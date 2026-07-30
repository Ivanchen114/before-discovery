#!/usr/bin/env python3
"""Route and validate the before-discovery-dev skill package."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

from mechanics_guard import run_check as check_mechanics
from narrative_guard import check_narrative


SCRIPT_PATH = Path(__file__).resolve()
SKILL_DIR = SCRIPT_PATH.parents[1]
REPO_ROOT = SCRIPT_PATH.parents[4]
REGISTRY_PATH = SKILL_DIR / "references" / "source-registry.json"
SKILL_PATH = SKILL_DIR / "SKILL.md"
OVERLAY_PATH = SKILL_DIR / "OVERLAY-claude.md"
OPENAI_YAML_PATH = SKILL_DIR / "agents" / "openai.yaml"
MIRROR_PATH = REPO_ROOT / "01_治理" / "發現之前_Claude開發守則_before-discovery-dev_skill鏡像.md"
REGRESSION_PATH = SCRIPT_PATH.with_name("test_skill_guard.py")
NARRATIVE_GUARD_PATH = SCRIPT_PATH.with_name("narrative_guard.py")
NARRATIVE_GUIDE_PATH = SKILL_DIR / "references" / "narrative-guard.md"
MECHANICS_GUARD_PATH = SCRIPT_PATH.with_name("mechanics_guard.py")
MECHANICS_REGRESSION_PATH = SCRIPT_PATH.with_name("test_mechanics_guard.py")
MECHANICS_GUIDE_PATH = SKILL_DIR / "references" / "mechanics-guard.md"

COMMON_BEGIN = "<!-- MIRROR:COMMON:BEGIN -->"
COMMON_END = "<!-- MIRROR:COMMON:END -->"
OVERLAY_BEGIN = "<!-- MIRROR:OVERLAY-CLAUDE:BEGIN -->"
OVERLAY_END = "<!-- MIRROR:OVERLAY-CLAUDE:END -->"

REQUIRED_SOURCE_FIELDS = {
    "id",
    "path",
    "status",
    "authority",
    "phase",
    "mode_roles",
    "tracked_required",
    "required_headings",
    "supersedes",
    "blocks_skill_activation",
    "note",
}

LANE_ORDER = {f"R{level}": level for level in range(5)}
READ_ONLY_PHASES = {"plan", "diagnose", "verify", "review"}
SHARED_ENGINE_TARGETS = {
    "greybox/src/chapter-ui.js",
    "greybox/src/narrative.js",
    "greybox/src/sanitize.js",
    "greybox/src/stage/05-events.part.js",
}
SERIALIZED_STATE_TARGETS = {
    "greybox/src/ch4-migration.js",
    "greybox/src/sanitize.js",
    "greybox/src/save-envelope.js",
}
PLAYER_VISIBLE_TASKS = {
    "runtime",
    "ui",
    "narrative",
    "history",
    "art",
    "accessibility",
}
PLAYER_RUNTIME_ROOTS = {
    "greybox/data",
    "greybox/src",
    "public",
}
CHAPTER_NAME_MARKERS = {
    "第一章": "ch1",
    "第二章": "ch2",
    "第三章": "ch3",
    "第四章": "ch4",
    "第五章": "ch5",
}
CHAPTER_TOKEN = re.compile(r"^ch[1-9][0-9]*$")
SUPPORT_ARTIFACT_REQUIREMENTS = {
    "chapter-brief": {
        "artifact": "chapter-brief",
        "statuses": {"design-gate-passed"},
    },
    "chapter-spec": {
        "artifact": "implementation-spec",
        "statuses": {"frozen"},
    },
    "provenance": {
        "artifact": "historical-provenance",
        "statuses": {"review-ready", "verified"},
    },
}


def load_registry() -> dict:
    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def normalize_heading(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = re.sub(r"[`*_]", "", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def markdown_headings(path: Path) -> list[str]:
    headings: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$", line)
        if match:
            headings.append(normalize_heading(match.group(1)))
    return headings


def strip_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        return text.strip()
    end = text.find("\n---\n", 4)
    if end == -1:
        return text.strip()
    return text[end + 5 :].strip()


def support_artifact_metadata(path: str) -> tuple[dict[str, str], str | None]:
    """Read the small, dependency-free metadata contract used by new-chapter gates."""
    try:
        text = resolve_target_path(path).read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return {}, "必須是含 YAML front matter 的 UTF-8 文字檔"
    if not text.startswith("---\n"):
        return {}, "缺少 YAML front matter"
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, "YAML front matter 未閉合"
    metadata: dict[str, str] = {}
    for raw_line in text[4:end].splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        match = re.fullmatch(r"([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*", line)
        if not match:
            continue
        key, value = match.groups()
        if (
            len(value) >= 2
            and value[0] == value[-1]
            and value[0] in {'"', "'"}
        ):
            value = value[1:-1]
        metadata[key] = value.strip()
    return metadata, None


def validate_support_artifact_metadata(
    path: str,
    role: str,
    chapter: str,
) -> list[str]:
    requirement = SUPPORT_ARTIFACT_REQUIREMENTS[role]
    metadata, parse_error = support_artifact_metadata(path)
    if parse_error:
        return [f"{role} {path}: {parse_error}"]
    errors: list[str] = []
    if metadata.get("bd_artifact") != requirement["artifact"]:
        errors.append(
            f"{role} {path}: bd_artifact 必須是 {requirement['artifact']}"
        )
    if metadata.get("bd_chapter") != chapter:
        errors.append(f"{role} {path}: bd_chapter 必須是 {chapter}")
    if metadata.get("bd_status") not in requirement["statuses"]:
        errors.append(
            f"{role} {path}: bd_status 必須是 "
            + " 或 ".join(sorted(requirement["statuses"]))
        )
    return errors


def extract_marker(text: str, begin: str, end: str) -> str | None:
    start = text.find(begin)
    stop = text.find(end)
    if start == -1 or stop == -1 or stop < start:
        return None
    return text[start + len(begin) : stop].strip()


def untracked_source_blocks_activation(status: str, activation: bool) -> bool:
    """Only active sources are required to be tracked at activation time."""
    return activation and status == "active"


def build_mirror_header(registry: dict) -> str:
    if registry.get("registry_status") == "active":
        title = "✅ 這是 active 治理鏡像"
        lifecycle = (
            "本鏡像可作為 agent 安裝來源；各 agent 仍須明示同步並 read-back，"
            "不得把 repo 更新冒充已生效。"
        )
    else:
        title = "⚠ 這是候選鏡像，不是 agent 生效版"
        lifecycle = "Claude 對抗審與總監裁決前，不同步成 Claude／Codex 生效版。"
    return f"""> # {title}
>
> - repo skill canonical：`tools/skill/before-discovery-dev/SKILL.md`
> - Claude overlay：`tools/skill/before-discovery-dev/OVERLAY-claude.md`
> - registry：`tools/skill/before-discovery-dev/references/source-registry.json`
> - skill 版本：{registry['skill_version']}
> - registry 狀態：{registry['registry_status']}
> - 本鏡像由 `scripts/skill_guard.py sync-mirror` 機械產生。
> - {lifecycle}
"""


def build_mirror_text(registry: dict, common: str, overlay: str) -> str:
    return f"""{build_mirror_header(registry)}
{COMMON_BEGIN}
{common}
{COMMON_END}

{OVERLAY_BEGIN}
{overlay}
{OVERLAY_END}
"""


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def tracked(path: Path, repo_root: Path = REPO_ROOT) -> bool:
    """Return whether Git's index knows this path.

    This intentionally includes staged-only paths for ordinary candidate
    validation. Activation uses ``present_in_head`` instead, because a staged
    path is not reproducible from a clean checkout.
    """
    relative = path.relative_to(repo_root).as_posix()
    if path.is_dir():
        result = subprocess.run(
            ["git", "ls-files", "--", relative],
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
        )
        return bool(result.stdout.strip())
    result = subprocess.run(
        ["git", "ls-files", "--error-unmatch", "--", relative],
        cwd=repo_root,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def present_in_head(path: Path, repo_root: Path = REPO_ROOT) -> bool:
    """Return whether HEAD contains a reproducible version of this path."""
    relative = path.relative_to(repo_root).as_posix()
    if path.is_dir():
        result = subprocess.run(
            ["git", "ls-tree", "-r", "--name-only", "HEAD", "--", relative],
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
        )
        return result.returncode == 0 and bool(result.stdout.strip())
    result = subprocess.run(
        ["git", "cat-file", "-e", f"HEAD:{relative}"],
        cwd=repo_root,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def matches_head(path: Path, repo_root: Path = REPO_ROOT) -> bool:
    """Return whether a path is reproducible from HEAD with no local additions."""
    if not present_in_head(path, repo_root):
        return False
    relative = path.relative_to(repo_root).as_posix()
    result = subprocess.run(
        ["git", "diff", "--quiet", "HEAD", "--", relative],
        cwd=repo_root,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False
    if path.is_dir():
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard", "--", relative],
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
        )
        return untracked.returncode == 0 and not untracked.stdout.strip()
    return True


def source_versioned_for_validation(
    path: Path,
    status: str,
    activation: bool,
    repo_root: Path = REPO_ROOT,
) -> bool:
    """Require active sources to exactly match HEAD during activation."""
    if untracked_source_blocks_activation(status, activation):
        return matches_head(path, repo_root)
    return tracked(path, repo_root)


def dependency_cycles(routes: dict[str, dict]) -> list[list[str]]:
    cycles: list[list[str]] = []
    visiting: list[str] = []
    done: set[str] = set()

    def visit(route_id: str) -> None:
        if route_id in visiting:
            start = visiting.index(route_id)
            cycles.append(visiting[start:] + [route_id])
            return
        if route_id in done:
            return
        visiting.append(route_id)
        for dependency in routes[route_id].get("requires", []):
            if dependency in routes:
                visit(dependency)
        visiting.pop()
        done.add(route_id)

    for route_id in routes:
        visit(route_id)
    return cycles


def validate(activation: bool) -> int:
    errors: list[str] = []
    warnings: list[str] = []

    try:
        registry = load_registry()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR registry: {exc}")
        return 1

    required_top = {
        "schema_version",
        "registry_id",
        "registry_status",
        "skill_version",
        "updated",
        "truth_modes",
        "status_values",
        "authority_order_high_to_low",
        "phase_values",
        "mode_role_values",
        "impact_values",
        "required_route_ids",
        "routes",
    }
    missing_top = required_top - registry.keys()
    if missing_top:
        errors.append(f"registry 缺少頂層欄位: {sorted(missing_top)}")
    if registry.get("schema_version") != 4:
        errors.append(f"schema_version 應為 4，實際為 {registry.get('schema_version')!r}")

    modes = set(registry.get("truth_modes", []))
    statuses = set(registry.get("status_values", []))
    authorities = set(registry.get("authority_order_high_to_low", []))
    phases = set(registry.get("phase_values", []))
    mode_roles = set(registry.get("mode_role_values", []))
    impacts = set(registry.get("impact_values", []))

    if modes != {"AS-IS", "TO-BE", "CONFORMANCE"}:
        errors.append(f"truth_modes 必須恰為三種，實際為 {sorted(modes)}")

    route_list = registry.get("routes", [])
    route_ids = [route.get("id") for route in route_list]
    if len(route_ids) != len(set(route_ids)):
        errors.append("routes[].id 有重複")
    routes = {route.get("id"): route for route in route_list if route.get("id")}

    required_routes = set(registry.get("required_route_ids", []))
    missing_routes = required_routes - routes.keys()
    if missing_routes:
        errors.append(f"缺少必要 route: {sorted(missing_routes)}")

    source_ids: set[str] = set()
    supersessions: dict[str, list[str]] = {}
    satisfaction_refs: dict[str, list[str]] = {}
    reported_active_head_paths: set[str] = set()

    for route in route_list:
        route_id = route.get("id", "<missing-route-id>")
        if not isinstance(route.get("tasks"), list) or not route.get("tasks"):
            errors.append(f"{route_id}: tasks 必須是非空陣列")
        dependencies = route.get("requires")
        if not isinstance(dependencies, list):
            errors.append(f"{route_id}: requires 必須是陣列")
            dependencies = []
        for dependency in dependencies:
            if dependency not in routes:
                errors.append(f"{route_id}: requires 指向不存在 route {dependency!r}")
            if dependency == route_id:
                errors.append(f"{route_id}: route 不得依賴自己")

        sources = route.get("sources")
        if not isinstance(sources, list) or not sources:
            errors.append(f"{route_id}: sources 必須是非空陣列")
            continue

        for source in sources:
            source_id = source.get("id", "<missing-source-id>")
            missing_fields = REQUIRED_SOURCE_FIELDS - source.keys()
            if missing_fields:
                errors.append(f"{route_id}/{source_id}: 缺欄位 {sorted(missing_fields)}")
            if source_id in source_ids:
                errors.append(f"source id 重複: {source_id}")
            source_ids.add(source_id)
            supersessions[source_id] = source.get("supersedes", [])
            satisfaction_refs[source_id] = source.get("satisfied_by", [])

            status = source.get("status")
            authority = source.get("authority")
            source_phases = source.get("phase", [])
            source_roles = source.get("mode_roles", {})
            source_domains = source.get("domains", [])
            if status not in statuses:
                errors.append(f"{source_id}: 非法 status {status!r}")
            if authority not in authorities:
                errors.append(f"{source_id}: 非法 authority {authority!r}")
            if not isinstance(source_phases, list) or not source_phases:
                errors.append(f"{source_id}: phase 必須是非空陣列")
            elif any(phase not in phases for phase in source_phases):
                errors.append(f"{source_id}: phase 含非法值 {source_phases!r}")
            elif "always" in source_phases and len(source_phases) != 1:
                errors.append(f"{source_id}: always 不得與其他 phase 並列")

            if set(source_roles.keys()) != modes:
                errors.append(f"{source_id}: mode_roles 必須完整列三種真相模式")
            for mode, role in source_roles.items():
                if mode not in modes or role not in mode_roles:
                    errors.append(f"{source_id}: mode_roles[{mode!r}]={role!r} 非法")
            if not isinstance(source_domains, list):
                errors.append(f"{source_id}: domains 必須是陣列")
            elif any(domain not in routes for domain in source_domains):
                errors.append(f"{source_id}: domains 指向不存在 route {source_domains!r}")
            elif route_id.startswith("chapter.") and not source_domains:
                errors.append(f"{source_id}: 章別 source 必須宣告 domains，避免無條件過讀")

            path_value = source.get("path")
            if status == "missing":
                if path_value is not None:
                    errors.append(f"{source_id}: missing source 的 path 必須為 null")
                if source.get("tracked_required") is not False:
                    errors.append(f"{source_id}: missing source 不得要求 Git tracking")
                if authority != "unresolved":
                    errors.append(f"{source_id}: missing source authority 必須是 unresolved")
                if not source.get("gap_reason"):
                    errors.append(f"{source_id}: missing source 必須有 gap_reason")
                applies_when = source.get("applies_when", [])
                blocking_phases = source.get("blocking_phases", [])
                if applies_when and any(impact not in impacts for impact in applies_when):
                    errors.append(f"{source_id}: applies_when 含非法 impact {applies_when!r}")
                if blocking_phases and any(phase not in phases for phase in blocking_phases):
                    errors.append(
                        f"{source_id}: blocking_phases 含非法 phase {blocking_phases!r}"
                    )
                warnings.append(f"{route_id}/{source_id}: GAP — {source.get('gap_reason', '')}")
                continue

            if not isinstance(path_value, str) or not path_value:
                errors.append(f"{source_id}: 非 missing source 必須有相對路徑")
                continue
            relative = Path(path_value)
            if relative.is_absolute() or ".." in relative.parts:
                errors.append(f"{source_id}: 路徑必須是 repo-relative 且不得含 ..")
                continue
            full_path = (REPO_ROOT / relative).resolve()
            try:
                full_path.relative_to(REPO_ROOT.resolve())
            except ValueError:
                errors.append(f"{source_id}: 路徑逃出 repo: {path_value}")
                continue
            if not full_path.exists():
                errors.append(f"{source_id}: 路徑不存在: {path_value}")
                continue
            if status == "active" and relative.parts and relative.parts[0] == "archive":
                errors.append(f"{source_id}: active source 不得位於 archive/")

            headings = source.get("required_headings", [])
            if headings and full_path.suffix.lower() != ".md":
                errors.append(f"{source_id}: required_headings 只能用於 Markdown")
            elif headings:
                actual_headings = markdown_headings(full_path)
                positions: list[int] = []
                for required in headings:
                    normalized = normalize_heading(required)
                    matches = [index for index, actual in enumerate(actual_headings) if actual == normalized]
                    if not matches:
                        errors.append(f"{source_id}: 找不到 heading {required!r}")
                    elif len(matches) > 1:
                        errors.append(f"{source_id}: heading {required!r} 命中多次，索引含糊")
                    else:
                        positions.append(matches[0])
                if positions != sorted(positions):
                    errors.append(f"{source_id}: required_headings 順序與實檔不一致")

            version_required = bool(source.get("tracked_required")) or (
                activation and status == "active"
            )
            if version_required and not source_versioned_for_validation(
                full_path,
                status,
                activation,
            ):
                if untracked_source_blocks_activation(status, activation):
                    if present_in_head(full_path):
                        message = (
                            f"{source_id}: active source 本地內容與 HEAD 不同 — "
                            f"{path_value}"
                        )
                    else:
                        message = (
                            f"{source_id}: 尚未進入 HEAD commit — {path_value}"
                        )
                else:
                    message = f"{source_id}: 尚未由 Git 追蹤 — {path_value}"
                if untracked_source_blocks_activation(status, activation):
                    if path_value not in reported_active_head_paths:
                        errors.append(message)
                        reported_active_head_paths.add(path_value)
                else:
                    warnings.append(message)

            if status == "candidate":
                message = f"{source_id}: 仍為 candidate — {path_value}"
                if activation and source.get("blocks_skill_activation"):
                    errors.append(message)
                else:
                    warnings.append(message)
            if source.get("activation_blocker"):
                message = f"{source_id}: 尚有未解的 activation blocker"
                if activation:
                    errors.append(message)
                else:
                    warnings.append(message)
            for issue in source.get("known_issues", []):
                warnings.append(f"{source_id}: KNOWN ISSUE — {issue}")

    for cycle in dependency_cycles(routes):
        errors.append(f"route dependency cycle: {' -> '.join(cycle)}")

    for source_id, targets in supersessions.items():
        if len(targets) != len(set(targets)):
            errors.append(f"{source_id}: supersedes 有重複")
        for target in targets:
            if target == source_id:
                errors.append(f"{source_id}: 不得 supersede 自己")
            elif target not in source_ids:
                errors.append(f"{source_id}: supersedes 指向不存在 source {target!r}")

    for source_id, satisfiers in satisfaction_refs.items():
        for satisfier in satisfiers:
            if satisfier == source_id:
                errors.append(f"{source_id}: 不得由自己 satisfied_by")
            elif satisfier not in source_ids:
                errors.append(f"{source_id}: satisfied_by 指向不存在 source {satisfier!r}")

    skill_text = SKILL_PATH.read_text(encoding="utf-8")
    if not skill_text.startswith("---\n"):
        errors.append("SKILL.md 缺 YAML frontmatter")
    frontmatter_match = re.match(r"^---\n(.*?)\n---\n", skill_text, re.S)
    if not frontmatter_match:
        errors.append("SKILL.md frontmatter 無法解析")
    else:
        frontmatter = frontmatter_match.group(1)
        if not re.search(r"^name:\s*[\"']?before-discovery-dev[\"']?\s*$", frontmatter, re.M):
            errors.append("SKILL.md name 必須是 before-discovery-dev")
        if not re.search(r"^description:\s*.+$", frontmatter, re.M):
            errors.append("SKILL.md 缺 description")
    if len(skill_text.splitlines()) > 500:
        errors.append("SKILL.md 超過 500 行，違反漸進揭露")
    skill_version_match = re.search(
        r"^\*\*版本\*\*[：:]\s*v([^\s（(]+)",
        skill_text,
        flags=re.MULTILINE,
    )
    if not skill_version_match:
        errors.append("SKILL.md 缺少可解析的版本列")
    elif skill_version_match.group(1) != registry.get("skill_version"):
        errors.append(
            "SKILL.md 版本與 registry skill_version 不一致: "
            f"{skill_version_match.group(1)!r} != {registry.get('skill_version')!r}"
        )

    stale_tokens = [
        "§UI 控件",
        "→ 同上",
        "src/ch4-migration.js",
        "一、開工儀式(順序固定,每場都做)",
    ]
    for token in stale_tokens:
        if token in skill_text:
            errors.append(f"SKILL.md 仍含已知漂移字串: {token!r}")

    forbidden_common = ["## C-1 我的角色", "寫給 Sol 的訊息", "第一、二章的架構與劇本出自我"]
    for token in forbidden_common:
        if token in skill_text:
            errors.append(f"SKILL.md common 層含 agent 專屬內容: {token!r}")

    if not OPENAI_YAML_PATH.exists():
        errors.append("agents/openai.yaml 不存在")
    else:
        openai_yaml = OPENAI_YAML_PATH.read_text(encoding="utf-8")
        for key in ["display_name", "short_description", "default_prompt"]:
            if not re.search(rf"^\s+{key}:\s+\".+\"\s*$", openai_yaml, re.M):
                errors.append(f"agents/openai.yaml 缺少已加引號的 {key}")
        if "$before-discovery-dev" not in openai_yaml:
            errors.append("agents/openai.yaml default_prompt 必須提到 $before-discovery-dev")

    if MIRROR_PATH.exists():
        mirror_text = MIRROR_PATH.read_text(encoding="utf-8")
        mirror_common = extract_marker(mirror_text, COMMON_BEGIN, COMMON_END)
        mirror_overlay = extract_marker(mirror_text, OVERLAY_BEGIN, OVERLAY_END)
        expected_common = strip_frontmatter(skill_text)
        expected_overlay = OVERLAY_PATH.read_text(encoding="utf-8").strip()
        if not mirror_text.startswith(build_mirror_header(registry)):
            errors.append("治理鏡像 lifecycle 檔頭與 registry 狀態不同步")
        if mirror_common is None or mirror_overlay is None:
            errors.append("治理鏡像缺 common／overlay markers")
        else:
            if mirror_common != expected_common:
                errors.append("治理鏡像 common 與 SKILL.md 正文不同步")
            if mirror_overlay != expected_overlay:
                errors.append("治理鏡像 overlay 與 OVERLAY-claude.md 不同步")
    else:
        errors.append(f"治理鏡像不存在: {MIRROR_PATH.relative_to(REPO_ROOT)}")

    if activation and registry.get("registry_status") != "active":
        errors.append(
            f"activation 要求 registry_status=active，實際為 {registry.get('registry_status')!r}"
        )
    package_paths = (
        SKILL_PATH,
        OVERLAY_PATH,
        OPENAI_YAML_PATH,
        REGISTRY_PATH,
        SCRIPT_PATH,
        REGRESSION_PATH,
        NARRATIVE_GUARD_PATH,
        NARRATIVE_GUIDE_PATH,
        MECHANICS_GUARD_PATH,
        MECHANICS_REGRESSION_PATH,
        MECHANICS_GUIDE_PATH,
        MIRROR_PATH,
    )
    for package_path in package_paths:
        if not package_path.exists():
            errors.append(f"skill package 缺檔: {package_path}")
        elif activation and not matches_head(package_path):
            errors.append(
                "skill package 尚未進入 HEAD commit，或本地內容與 HEAD 不同: "
                + package_path.relative_to(REPO_ROOT).as_posix()
            )

    print(
        f"skill={registry.get('skill_version')} "
        f"registry={registry.get('registry_status')} "
        f"routes={len(routes)} sources={len(source_ids)}"
    )
    for warning in warnings:
        print(f"WARN {warning}")
    for error in errors:
        print(f"ERROR {error}")

    if errors:
        print(f"RESULT FAIL: {len(errors)} errors, {len(warnings)} warnings")
        return 1
    print(f"RESULT PASS: 0 errors, {len(warnings)} warnings")
    return 0


def resolve_routes(registry: dict, tasks: list[str], chapter: str | None) -> list[dict]:
    route_list = registry["routes"]
    routes = {route["id"]: route for route in route_list}
    selected: set[str] = {"core"}

    for route in route_list:
        if route["id"] in tasks or set(route.get("tasks", [])) & set(tasks):
            selected.add(route["id"])
    if chapter:
        chapter_route = f"chapter.{chapter}"
        if chapter_route in routes:
            selected.add(chapter_route)

    pending = list(selected)
    while pending:
        route_id = pending.pop()
        for dependency in routes[route_id].get("requires", []):
            if dependency not in selected:
                selected.add(dependency)
                pending.append(dependency)

    return [route for route in route_list if route["id"] in selected]


def source_applies(
    source: dict,
    chapter: str | None,
    phase: str,
    selected_route_ids: set[str],
    targets: list[str],
) -> bool:
    source_phase = "verify" if phase == "diagnose" else phase
    source_phases = source["phase"]
    if "always" not in source_phases and source_phase not in source_phases:
        return False

    source_chapters = source.get("chapters")
    if source_chapters and (chapter is None or chapter not in source_chapters):
        return False

    domains = set(source.get("domains", []))
    if domains and not domains & selected_route_ids:
        return False
    if source["status"] == "superseded" and not source_matches_target(source, targets):
        return False
    return True


def source_matches_target(source: dict, targets: list[str]) -> bool:
    source_path = source.get("path")
    if not isinstance(source_path, str):
        return False
    normalized_source = source_path.removeprefix("./")
    source_file = REPO_ROOT / normalized_source
    for target in targets:
        normalized_target = target.split("#", 1)[0].removeprefix("./")
        if normalized_source == normalized_target:
            return True
        target_file = resolve_target_path(target)
        try:
            if source_file.is_file() and target_file.is_file() and os.path.samefile(
                source_file, target_file
            ):
                return True
            if source_file.is_dir() and target_file.is_file():
                for parent in target_file.parents:
                    if os.path.samefile(source_file, parent):
                        return True
        except OSError:
            continue
    return False


def resolve_target_path(target: str) -> Path:
    path = Path(target.split("#", 1)[0]).expanduser()
    return path if path.is_absolute() else REPO_ROOT / path


def repo_relative_target(target: str) -> str | None:
    try:
        return resolve_target_path(target).resolve().relative_to(
            REPO_ROOT.resolve()
        ).as_posix()
    except ValueError:
        return None


def target_matches_repo_file(target: str, relative_path: str) -> bool:
    target_file = resolve_target_path(target)
    repo_file = REPO_ROOT / relative_path
    try:
        return target_file.is_file() and repo_file.is_file() and os.path.samefile(
            target_file, repo_file
        )
    except OSError:
        return False


def target_is_under_repo_directory(target: str, relative_dir: str) -> bool:
    target_file = resolve_target_path(target)
    repo_dir = REPO_ROOT / relative_dir
    if not target_file.is_file() or not repo_dir.is_dir():
        return False
    for parent in target_file.parents:
        try:
            if os.path.samefile(parent, repo_dir):
                return True
        except OSError:
            continue
    return False


def target_matches_any_source(registry: dict, target: str) -> bool:
    return any(
        source_matches_target(source, [target])
        for route in registry["routes"]
        for source in route["sources"]
    )


def target_route_chapters(registry: dict, target: str) -> set[str]:
    return {
        route["id"].removeprefix("chapter.")
        for route in registry["routes"]
        if route["id"].startswith("chapter.")
        and any(
            source_matches_target(source, [target])
            for source in route["sources"]
        )
    }


def target_name_chapters(target: str) -> set[str]:
    name = resolve_target_path(target).name
    return {
        chapter
        for marker, chapter in CHAPTER_NAME_MARKERS.items()
        if marker in name
    }


def target_sources(selected_routes: list[dict], target: str) -> list[dict]:
    matches: dict[str, dict] = {}
    for route in selected_routes:
        for source in route["sources"]:
            if source_matches_target(source, [target]):
                matches[source["id"]] = source
    return list(matches.values())


def validate_support_paths(option_name: str, values: list[str]) -> str | None:
    for value in values:
        if not value or any(
            ord(character) < 32 or ord(character) == 127 for character in value
        ):
            return f"{option_name} 不得為空白或含控制字元"
        if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*://", value):
            return f"{option_name} 只接受 repo 內既有檔案，不接受 URL: {value}"
        relative = repo_relative_target(value)
        if relative is None:
            return f"{option_name} 必須位於 repo 內: {value}"
        if Path(relative).parts and Path(relative).parts[0] == ".git":
            return f"{option_name} 不接受 .git 內部檔案: {value}"
        if not resolve_target_path(value).is_file():
            return f"{option_name} 必須指向 repo 內既有一般檔案: {value}"
    return None


def route_sources(
    tasks: list[str],
    chapter: str | None,
    phase: str,
    mode: str,
    lane: str,
    requested_impacts: list[str],
    target_paths: list[str],
    target_labels: list[str],
    chapter_brief_path: str | None,
    chapter_spec_path: str | None,
    provenance_paths: list[str],
) -> int:
    registry = load_registry()
    target_paths = [target.strip() for target in target_paths]
    target_labels = [target.strip() for target in target_labels]
    chapter_brief_path = chapter_brief_path.strip() if chapter_brief_path else None
    chapter_spec_path = chapter_spec_path.strip() if chapter_spec_path else None
    provenance_paths = list(
        dict.fromkeys(path.strip() for path in provenance_paths)
    )
    targets = target_paths
    if mode not in registry["truth_modes"]:
        print(f"ERROR mode 必須是 {', '.join(registry['truth_modes'])}")
        return 1
    if phase not in registry["phase_values"]:
        print(f"ERROR phase 必須是 {', '.join(registry['phase_values'])}")
        return 1
    invalid_impacts = [
        impact for impact in requested_impacts if impact not in registry["impact_values"]
    ]
    if invalid_impacts:
        print(f"ERROR 未知 impact: {', '.join(invalid_impacts)}")
        return 1
    if lane not in LANE_ORDER:
        print(f"ERROR lane 必須是 {', '.join(LANE_ORDER)}")
        return 1
    if chapter is not None and not CHAPTER_TOKEN.fullmatch(chapter):
        print("ERROR --chapter 必須是 ch 加正整數，例如 ch1 或 ch6。")
        return 1
    invalid_controls = [
        target
        for target in [*target_paths, *target_labels]
        if not target or any(ord(character) < 32 or ord(character) == 127 for character in target)
    ]
    if invalid_controls:
        print("ERROR target 不得為空白或含控制字元。")
        return 1
    invalid_target_paths = [
        target
        for target in target_paths
        if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*://", target)
    ]
    if invalid_target_paths:
        print(
            "ERROR --target-path 只接受本機／repo 路徑；"
            "外部工作包請用 --target-label: "
            + ", ".join(invalid_target_paths)
        )
        return 1
    outside_target_paths = [
        target
        for target in target_paths
        if repo_relative_target(target) is None
        and not target_matches_any_source(registry, target)
    ]
    if outside_target_paths:
        print(
            "ERROR --target-path 必須位於 repo 內；外部工作包請用 --target-label: "
            + ", ".join(outside_target_paths)
        )
        return 1
    internal_git_paths = [
        target
        for target in target_paths
        if (relative := repo_relative_target(target)) is not None
        and Path(relative).parts
        and Path(relative).parts[0] == ".git"
    ]
    if internal_git_paths:
        print(
            "ERROR --target-path 只能指向 worktree artifact，不接受 .git 內部檔案: "
            + ", ".join(internal_git_paths)
        )
        return 1
    invalid_nonfiles = [
        target
        for target in target_paths
        if resolve_target_path(target).exists()
        and not resolve_target_path(target).is_file()
    ]
    if invalid_nonfiles:
        print(
            "ERROR --target-path 必須指向一般檔案，不接受目錄或特殊裝置: "
            + ", ".join(invalid_nonfiles)
        )
        return 1
    source_ids = {
        source["id"].casefold()
        for route in registry["routes"]
        for source in route["sources"]
    }
    source_paths = {
        source["path"].casefold()
        for route in registry["routes"]
        for source in route["sources"]
        if isinstance(source.get("path"), str)
    }
    invalid_target_labels = [
        target
        for target in target_labels
        if not re.fullmatch(r"WP-[A-Za-z0-9][A-Za-z0-9_-]*", target)
        or "/" in target
        or "\\" in target
        or target.casefold() in source_ids
        or target.casefold() in source_paths
        or resolve_target_path(target).exists()
    ]
    if invalid_target_labels:
        print(
            "ERROR --target-label 必須是 WP- 開頭、只含英數／底線／連字號的"
            "非檔案工作包標籤；repo 路徑或 source id 請改用 --target-path: "
            + ", ".join(invalid_target_labels)
        )
        return 1
    support_error = validate_support_paths(
        "--chapter-brief-path",
        [chapter_brief_path] if chapter_brief_path else [],
    )
    if support_error is None:
        support_error = validate_support_paths(
            "--chapter-spec-path",
            [chapter_spec_path] if chapter_spec_path else [],
        )
    if support_error is None:
        support_error = validate_support_paths("--provenance-path", provenance_paths)
    if support_error is not None:
        print(f"ERROR {support_error}")
        return 1
    runtime_history_paths = {
        source["path"]
        for route in registry["routes"]
        if route["id"] == "history"
        for source in route["sources"]
        if source.get("authority") == "runtime_canonical"
        and isinstance(source.get("path"), str)
    }
    runtime_provenance_paths = {
        path
        for path in provenance_paths
        if any(
            target_matches_repo_file(path, runtime_path)
            for runtime_path in runtime_history_paths
        )
    }
    qualified_provenance_paths = [
        path for path in provenance_paths if path not in runtime_provenance_paths
    ]

    known_tasks = {
        task
        for route in registry["routes"]
        for task in [route["id"], *route.get("tasks", [])]
    }
    unknown = [task for task in tasks if task not in known_tasks]
    if unknown:
        print(f"ERROR 未知 task/route: {', '.join(unknown)}")
        return 1
    explicit_chapters = {
        task.removeprefix("chapter.")
        for task in tasks
        if task.startswith("chapter.")
    }
    if len(explicit_chapters) > 1:
        print(
            "ERROR 同一工作包不可同時宣告多個 chapter route: "
            + ", ".join(sorted(explicit_chapters))
        )
        return 1
    if explicit_chapters:
        explicit_chapter = next(iter(explicit_chapters))
        if chapter and chapter != explicit_chapter:
            print(
                f"ERROR --chapter {chapter} 與 --task chapter.{explicit_chapter} 衝突。"
            )
            return 1
        chapter = explicit_chapter
    target_chapters = {
        target_chapter
        for target in target_paths
        for target_chapter in (
            target_route_chapters(registry, target)
            | target_name_chapters(target)
        )
    }
    if chapter and target_chapters - {chapter}:
        print(
            f"ERROR --chapter {chapter} 與 target 的 registry／檔名章別線索 "
            f"{','.join(sorted(target_chapters))} 衝突。"
        )
        return 1
    if chapter is None and len(target_chapters) == 1:
        chapter = next(iter(target_chapters))

    impacts = set(requested_impacts)
    task_set = set(tasks)
    if phase == "art" or task_set & {
        "art",
        "image-generation",
        "visual",
        "asset",
        "master",
        "visual-qa",
    }:
        impacts.add("art-change")
    if task_set & {"save", "migration", "sanitizer", "import-export", "schema"}:
        impacts.add("serialized-state-change")
    if phase == "archive" or task_set & {
        "archive",
        "obsolete-banner",
        "historical-preservation",
        "move",
    }:
        impacts.add("archive-mutation")
    if any(
        target_matches_repo_file(target, known)
        for target in target_paths
        for known in SHARED_ENGINE_TARGETS
    ):
        impacts.add("shared-engine-change")
    if any(
        target_matches_repo_file(target, known)
        for target in target_paths
        for known in SERIALIZED_STATE_TARGETS
    ):
        impacts.add("serialized-state-change")

    selected_routes = resolve_routes(registry, tasks, chapter)
    selected_route_ids = {route["id"] for route in selected_routes}
    registered_chapters = {
        route["id"].removeprefix("chapter.")
        for route in registry["routes"]
        if route["id"].startswith("chapter.")
    }
    unregistered_chapter = (
        chapter is not None and chapter not in registered_chapters
    )
    support_metadata_errors: list[str] = []
    verified_support_artifacts: dict[str, str] = {}
    if unregistered_chapter and phase in {"write", "implement", "art"}:
        support_artifacts: list[tuple[str, str]] = []
        if chapter_brief_path:
            support_artifacts.append((chapter_brief_path, "chapter-brief"))
        if chapter_spec_path:
            support_artifacts.append((chapter_spec_path, "chapter-spec"))
        support_artifacts.extend(
            (provenance_path, "provenance")
            for provenance_path in qualified_provenance_paths
        )
        invalid_support_paths: set[str] = set()
        for support_path, role in support_artifacts:
            metadata_errors = validate_support_artifact_metadata(
                support_path,
                role,
                chapter,
            )
            if metadata_errors:
                invalid_support_paths.add(support_path)
                support_metadata_errors.extend(metadata_errors)
            else:
                verified_support_artifacts[support_path] = role

        identity_records: dict[Path, list[tuple[str, str]]] = {}
        for support_path, role in support_artifacts:
            identity_records.setdefault(
                resolve_target_path(support_path).resolve(),
                [],
            ).append((support_path, role))
        for records in identity_records.values():
            roles = {role for _, role in records}
            if len(roles) <= 1:
                continue
            reused_paths = sorted({path for path, _ in records})
            invalid_support_paths.update(reused_paths)
            support_metadata_errors.append(
                "同一實體檔案不得兼任 "
                + "／".join(sorted(roles))
                + ": "
                + ", ".join(reused_paths)
            )
        for invalid_path in invalid_support_paths:
            verified_support_artifacts.pop(invalid_path, None)
        qualified_provenance_paths = [
            provenance_path
            for provenance_path in qualified_provenance_paths
            if verified_support_artifacts.get(provenance_path) == "provenance"
        ]

    available_source_ids: set[str] = set()
    for route in selected_routes:
        for source in route["sources"]:
            if not source_applies(source, chapter, phase, selected_route_ids, targets):
                continue
            if source["status"] == "active" and source["mode_roles"][mode] != "unavailable":
                available_source_ids.add(source["id"])

    blockers = 0
    print(
        f"ROUTER skill={registry.get('skill_version')} "
        f"registry={registry.get('registry_status')} — source selection only"
    )
    if registry.get("registry_status") != "active":
        print("CAUTION candidate registry: 不得據此宣稱 active、Design Gate 通過或取得修改權。")
    print(
        f"MODE {mode} | PHASE {phase} | TASKS {','.join(tasks)}"
        + (f" | CHAPTER {chapter}" if chapter else "")
        + f" | LANE {lane}"
        + (f" | IMPACTS {','.join(sorted(impacts))}" if impacts else "")
    )
    if chapter_brief_path:
        if verified_support_artifacts.get(chapter_brief_path) == "chapter-brief":
            print(
                f"CHAPTER BRIEF PATH {chapter_brief_path} "
                "| role/chapter/status metadata verified; "
                "approval signatures and substance not independently evaluated"
            )
        else:
            print(
                f"CHAPTER BRIEF PATH {chapter_brief_path} "
                "| file exists; gate metadata not verified"
            )
    if chapter_spec_path:
        if verified_support_artifacts.get(chapter_spec_path) == "chapter-spec":
            print(
                f"CHAPTER SPEC PATH {chapter_spec_path} "
                "| role/chapter/frozen metadata verified; "
                "approval signatures and substance not independently evaluated"
            )
        else:
            print(
                f"CHAPTER SPEC PATH {chapter_spec_path} "
                "| file exists; gate metadata not verified"
            )
    for provenance_path in provenance_paths:
        if provenance_path in runtime_provenance_paths:
            print(
                f"PROVENANCE REJECTED {provenance_path} | runtime canonical "
                "describes current output and cannot self-source a historical claim"
            )
        elif verified_support_artifacts.get(provenance_path) == "provenance":
            print(
                f"PROVENANCE PATH {provenance_path} "
                "| role/chapter/status metadata verified; "
                "source quality not evaluated"
            )
        else:
            print(
                f"PROVENANCE PATH {provenance_path} "
                "| file-existence verified; source quality not evaluated"
            )
    for metadata_error in support_metadata_errors:
        print(f"ROUTE BLOCKER support-artifact metadata: {metadata_error}")
        blockers += 1
    if "historical-claim" in task_set and not qualified_provenance_paths:
        if phase in {"write", "implement", "art"}:
            print(
                "ROUTE BLOCKER historical-claim write/implement/art requires at "
                "least one verifiable --provenance-path; runtime histfacts cannot "
                "self-source a new or revised claim."
            )
            blockers += 1
        elif chapter is None:
            print(
                "ROUTE BLOCKER historical-claim requires --chapter or at least one "
                "verifiable --provenance-path."
            )
            blockers += 1
    if unregistered_chapter:
        print(
            f"CHAPTER TOKEN {chapter} is not registered; no chapter route or "
            "chapter runtime may be inferred."
        )
        if phase == "write":
            if chapter_brief_path is None:
                print(
                    "ROUTE BLOCKER unregistered chapter write requires "
                    "--chapter-brief-path."
                )
                blockers += 1
            if not qualified_provenance_paths:
                print(
                    "ROUTE BLOCKER unregistered chapter write requires "
                    "at least one --provenance-path."
                )
                blockers += 1
        elif phase in {"implement", "art"}:
            if chapter_spec_path is None:
                print(
                    "ROUTE BLOCKER unregistered chapter implement/art requires "
                    "--chapter-spec-path."
                )
                blockers += 1
            if not qualified_provenance_paths:
                print(
                    "ROUTE BLOCKER unregistered chapter implement/art requires "
                    "at least one --provenance-path."
                )
                blockers += 1
        else:
            print(
                "CAUTION unregistered chapter token is plan/review context only; "
                "it does not create a chapter brief, implementation specification "
                "or provenance."
            )
    lane_requirements: list[tuple[str, str]] = []
    if phase not in READ_ONLY_PHASES:
        if unregistered_chapter and phase in {"write", "implement", "art"}:
            lane_requirements.append(("R3", "unregistered-chapter"))
        if phase == "release" or "release" in selected_route_ids:
            lane_requirements.append(("R4", "release"))
        if phase == "archive" or "archive-mutation" in impacts:
            lane_requirements.append(("R4", "archive-mutation"))
        if "serialized-state-change" in impacts:
            lane_requirements.append(("R4", "serialized-state-change"))
        if "shared-engine-change" in impacts:
            lane_requirements.append(("R3", "shared-engine-change"))
        if phase == "art" or "art-change" in impacts:
            lane_requirements.append(("R2", "art-change"))
        if phase in {"write", "implement"} and (
            task_set & PLAYER_VISIBLE_TASKS
            or any(task.startswith("chapter.") for task in task_set)
            or any(
                target_matches_repo_file(target, "greybox/stage.html")
                or any(
                    target_is_under_repo_directory(target, root)
                    for root in PLAYER_RUNTIME_ROOTS
                )
                for target in target_paths
            )
        ):
            lane_requirements.append(("R2", "player-visible-runtime"))
    required_lane: str | None = None
    required_reason: str | None = None
    if lane_requirements:
        required_lane, required_reason = max(
            lane_requirements,
            key=lambda requirement: LANE_ORDER[requirement[0]],
        )
    if required_lane and LANE_ORDER[lane] < LANE_ORDER[required_lane]:
        print(
            f"LANE BLOCKER {required_reason} requires {required_lane} or higher; "
            f"declared {lane}."
        )
        blockers += 1
    if phase == "diagnose":
        print("PHASE MAP diagnose → verify（只借用現況證據篩選，不把診斷改稱驗收）。")
    if "art-change" in impacts:
        print("CAPABILITY image-generation: Sol/Codex only；Claude 可定義需求與獨立審圖。")
    if target_paths or target_labels:
        for target_kind, target_group in (
            ("PATH", target_paths),
            ("LABEL", target_labels),
        ):
            for target in target_group:
                print(f"TARGET {target_kind} {target}")
                target_file = resolve_target_path(target) if target_kind == "PATH" else None
                if target_kind == "PATH" and not target_file.is_file():
                    print(f"TARGET NOT FOUND {target}")
                    blockers += 1
                    continue
                matches = (
                    target_sources(selected_routes, target)
                    if target_kind == "PATH"
                    else []
                )
                if matches:
                    for source in matches:
                        print(
                            f"TARGET REGISTERED {target} | source={source['id']} "
                            f"| status={source['status']} | path={source.get('path') or '<missing>'}"
                        )
                        if source["status"] == "superseded":
                            print(
                                "CAUTION TARGET SUPERSEDED — 可審歷史版本，"
                                "但不得誤稱現行或候選最新版。"
                            )
                else:
                    print(
                        f"TARGET {target_kind} EXTERNAL/UNREGISTERED — "
                        "registry 法源不得取代此主對象。"
                    )
    elif phase != "plan":
        print(
            "TARGET BLOCKER — 除純規劃外，工作包卡必須用 "
            "--target-path 或 --target-label 固定精確主對象。"
        )
        blockers += 1
    print("以下 registry-role 只描述法源用途；不得覆蓋工作包卡的 TARGET。")

    for route in selected_routes:
        print(f"\n[{route['id']}]")
        if route["id"] == "history":
            if qualified_provenance_paths:
                for provenance_path in qualified_provenance_paths:
                    print(
                        "WORK-PACKAGE PROVENANCE | explicit | "
                        f"{provenance_path} | existence verified; "
                        "source quality requires review"
                    )
            for provenance_path in sorted(runtime_provenance_paths):
                print(
                    "REJECTED work-package.provenance | runtime canonical | "
                    f"{provenance_path} | cannot source its own historical claim"
                )
            if not qualified_provenance_paths and "historical-claim" in task_set and (
                chapter is None or phase in {"write", "implement", "art"}
            ):
                print(
                    "BLOCKER work-package.provenance | missing | "
                    "historical-claim lacks provenance required for this phase"
                )
            elif not qualified_provenance_paths and unregistered_chapter:
                print(
                    f"GAP history.{chapter}-source | unregistered | "
                    "plan/review may proceed; write uses an explicit chapter brief, "
                    "implement/art use a frozen chapter spec, and all historical "
                    "mutation requires provenance"
                )
        for source in route["sources"]:
            if not source_applies(source, chapter, phase, selected_route_ids, targets):
                continue
            role = source["mode_roles"][mode]
            default_role = role
            if (
                (target_paths or target_labels)
                and mode == "TO-BE"
                and route["id"].startswith("chapter.")
                and role == "primary"
                and not source_matches_target(source, target_paths)
            ):
                role = "comparison"
            status = source["status"]
            path_value = source["path"] or "<missing>"
            prefix = "SOURCE"
            if status == "missing":
                source_phases = source["phase"]
                applies_when = set(source.get("applies_when", []))
                applies = not applies_when or bool(applies_when & impacts)
                blocking_phases = set(source.get("blocking_phases", source_phases))
                satisfiers = set(source.get("satisfied_by", []))
                satisfied = bool(satisfiers & available_source_ids)
                if satisfied:
                    prefix = "SATISFIED"
                elif role == "unavailable" and applies and phase in blocking_phases:
                    prefix = "BLOCKER"
                    blockers += 1
                elif applies:
                    prefix = "GAP"
                else:
                    prefix = "CONDITIONAL"
            elif status == "candidate":
                prefix = "CAUTION"
            role_suffix = (
                f" (default={default_role})" if role != default_role else ""
            )
            print(
                f"{prefix} {source['id']} | {status} | {source['authority']} "
                f"| registry-role={role}{role_suffix} | {path_value}"
            )
            if source.get("gap_reason"):
                print(f"  gap: {source['gap_reason']}")
            for issue in source.get("known_issues", []):
                print(f"  known: {issue}")
            if source.get("activation_blocker"):
                print("  activation-blocker: 未解；candidate 不得切換成 active。")
            print(f"  note: {source['note']}")

    if blockers:
        print(
            f"\nRESULT SOURCES_BLOCKED: {blockers} applicable routing blocker(s); "
            "Design Gate and mutation authority were not evaluated"
        )
        return 2
    print(
        "\nRESULT SOURCES_ROUTED: no applicable registry blocker; "
        "Design Gate and mutation authority were not evaluated"
    )
    return 0


def strip_delivery_noncontent(text: str) -> str:
    """Remove Markdown regions that cannot supply delivery-status fields."""
    text = text.lstrip("\ufeff")
    if text.startswith("---\n"):
        frontmatter_end = text.find("\n---\n", 4)
        text = "" if frontmatter_end == -1 else text[frontmatter_end + 5 :]
    text = re.sub(r"<!--[\s\S]*?(?:-->|\Z)", "", text)
    text = re.sub(
        r"(?is)<details\b[^>]*>.*?(?:</details\s*>|\Z)",
        "",
        text,
    )

    kept: list[str] = []
    fence_character: str | None = None
    fence_length = 0
    for line in text.splitlines():
        if fence_character is not None:
            closing = re.match(
                rf"^ {{0,3}}({re.escape(fence_character)}+)[ \t]*$",
                line,
            )
            if closing and len(closing.group(1)) >= fence_length:
                fence_character = None
                fence_length = 0
            continue
        opening = re.match(r"^ {0,3}(`{3,}|~{3,})(?:[^\n]*)$", line)
        if opening:
            fence_character = opening.group(1)[0]
            fence_length = len(opening.group(1))
            continue
        if re.match(r"^(?: {4}| {0,3}\t)", line):
            continue
        kept.append(line)
    return "\n".join(kept)


def check_report(report: str, lane: str) -> int:
    report_path = resolve_target_path(report)
    if not report_path.is_file():
        print(f"ERROR report not found: {report}")
        return 1

    text = strip_delivery_noncontent(report_path.read_text(encoding="utf-8"))

    def field_values(label: str) -> list[str]:
        values: list[str] = []
        expected = re.sub(r"\s+", " ", label).strip().casefold()
        for line in text.splitlines():
            candidate = line.lstrip(" ")
            while candidate.startswith(">"):
                candidate = candidate[1:].lstrip(" ")
            candidate = re.sub(r"^#{1,6}[ \t]+", "", candidate)
            candidate = re.sub(r"^(?:[-*+]|\d+[.)])[ \t]+", "", candidate)
            candidate = re.sub(r"^\[[ xX]\][ \t]+", "", candidate)
            match = re.match(r"^([^：:]+)[：:](.*)$", candidate)
            if not match:
                continue
            key = re.sub(r"[*_`]+", "", match.group(1))
            key = re.sub(r"\s+", " ", key).strip().casefold()
            if key != expected:
                continue
            value = match.group(2).strip()
            value = value.strip("*_`").strip()
            values.append(value)
        return values

    full_tests = field_values("Full tests")
    registry_updated = field_values("Registry updated")
    warnings = 0
    if len(full_tests) != 1:
        if not full_tests:
            print(f"WARN lane {lane} delivery is missing the Full tests field.")
        else:
            print(
                f"WARN lane {lane} delivery has {len(full_tests)} Full tests fields; "
                "the status is ambiguous."
            )
        warnings += 1
    else:
        raw_status = full_tests[0]
        normalized_status = re.sub(
            r"[\s_-]+", " ", raw_status.upper()
        ).strip()
        skipped = (
            "NOT RUN" in normalized_status
            or "SKIP" in normalized_status
            or "未執行" in raw_status
            or "未跑" in raw_status
        )
        standalone_not_run = (
            normalized_status == "NOT RUN"
            or raw_status in {"未執行", "未跑"}
        )
        pass_match = re.fullmatch(
            r"PASS(?:\s*[（(]\s*(\d+)(?:\s*/\s*(\d+))?\s*[）)])?",
            raw_status,
            flags=re.IGNORECASE,
        )
        fail_match = re.fullmatch(
            r"FAIL(?:\s*[（(].*[）)])?",
            raw_status,
            flags=re.IGNORECASE,
        )
        contradictory_pass = bool(
            pass_match
            and pass_match.group(2)
            and int(pass_match.group(2)) != 0
        )
        if skipped:
            if (
                LANE_ORDER[lane] >= LANE_ORDER["R2"]
                or not standalone_not_run
            ):
                print(
                    f"WARN lane {lane} delivery declares Full tests: {raw_status}; "
                    "it cannot support a complete implementation claim."
                )
                warnings += 1
        elif contradictory_pass:
            print(
                f"WARN lane {lane} delivery declares PASS with nonzero failures: "
                f"{raw_status}"
            )
            warnings += 1
        elif not pass_match and not fail_match and normalized_status != "NOT RUN":
            print(
                f"WARN lane {lane} delivery has an unknown Full tests status: "
                f"{raw_status}"
            )
            warnings += 1

    if len(registry_updated) != 1:
        if not registry_updated:
            print(f"WARN lane {lane} delivery is missing the Registry updated field.")
        else:
            print(
                f"WARN lane {lane} delivery has {len(registry_updated)} "
                "Registry updated fields; the status is ambiguous."
            )
        warnings += 1
    elif registry_updated[0].upper() not in {"YES", "N-A", "N/A", "NA"}:
        print(
            f"WARN lane {lane} delivery has an unknown Registry updated "
            f"status: {registry_updated[0]}"
        )
        warnings += 1
    print(f"RESULT REPORT_CHECKED: 0 blockers, {warnings} warning(s)")
    return 0


def sync_mirror() -> int:
    registry = load_registry()
    common = strip_frontmatter(SKILL_PATH.read_text(encoding="utf-8"))
    overlay = OVERLAY_PATH.read_text(encoding="utf-8").strip()
    MIRROR_PATH.write_text(build_mirror_text(registry, common, overlay), encoding="utf-8")
    print(f"SYNCED {MIRROR_PATH.relative_to(REPO_ROOT)}")
    print(f"COMMON_SHA256 {sha256_text(common)}")
    print(f"OVERLAY_SHA256 {sha256_text(overlay)}")
    return 0


class ExitOneArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        self.print_usage(sys.stderr)
        self.exit(1, f"{self.prog}: error: {message}\n")


class StoreOnceAction(argparse.Action):
    def __call__(
        self,
        parser: argparse.ArgumentParser,
        namespace: argparse.Namespace,
        values: object,
        option_string: str | None = None,
    ) -> None:
        marker = f"__seen_{self.dest}"
        if getattr(namespace, marker, False):
            parser.error(f"{option_string or self.dest} 不得重複宣告")
        setattr(namespace, marker, True)
        setattr(namespace, self.dest, values)


def main() -> int:
    parser = ExitOneArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate", help="validate package and registry")
    validate_parser.add_argument(
        "--activation",
        action="store_true",
        help="enforce active status and Git tracking for installation",
    )

    route_parser = subparsers.add_parser("route", help="resolve task sources")
    route_parser.add_argument("--task", action="append", required=True)
    route_parser.add_argument(
        "--chapter",
        action=StoreOnceAction,
        help="chapter token such as ch1 or ch6; unregistered chapters remain gated",
    )
    route_parser.add_argument("--phase", required=True, action=StoreOnceAction)
    route_parser.add_argument("--mode", required=True, action=StoreOnceAction)
    route_parser.add_argument(
        "--lane",
        choices=list(LANE_ORDER),
        required=True,
        action=StoreOnceAction,
        help="declare the work-package risk lane so impact floors can be checked",
    )
    route_parser.add_argument(
        "--target-path",
        action="append",
        default=[],
        help="declare an exact local/repo file target; repeat when needed",
    )
    route_parser.add_argument(
        "--target-label",
        action="append",
        default=[],
        help="declare a non-file WP-* work-package label; repeat when needed",
    )
    route_parser.add_argument(
        "--impact",
        action="append",
        default=[],
        help="declare an affected risk surface; repeat when needed",
    )
    route_parser.add_argument(
        "--chapter-brief-path",
        action=StoreOnceAction,
        help="existing repo chapter brief/case qualification for an unregistered chapter",
    )
    route_parser.add_argument(
        "--chapter-spec-path",
        action=StoreOnceAction,
        help="existing repo implementation specification for an unregistered chapter",
    )
    route_parser.add_argument(
        "--provenance-path",
        action="append",
        default=[],
        help="existing repo provenance/fact-ledger file; repeat when needed",
    )

    report_parser = subparsers.add_parser(
        "check-report",
        help="check lane-sensitive delivery-report claims",
    )
    report_parser.add_argument("--report", required=True, action=StoreOnceAction)
    report_parser.add_argument(
        "--lane",
        choices=list(LANE_ORDER),
        required=True,
        action=StoreOnceAction,
    )

    narrative_parser = subparsers.add_parser(
        "check-narrative",
        help="run low-false-positive narrative diagnostics and optional beat contracts",
    )
    narrative_source = narrative_parser.add_mutually_exclusive_group(required=True)
    narrative_source.add_argument(
        "--scenes",
        action=StoreOnceAction,
        help="runtime scenes JSON (recommended; enables beat contracts)",
    )
    narrative_source.add_argument(
        "--draft",
        action=StoreOnceAction,
        help="structured Markdown draft with ## ...【SCENE-ID】 headings",
    )
    narrative_parser.add_argument(
        "--chapter",
        choices=["ch1", "ch2", "ch3", "ch4", "ch5"],
        required=True,
        action=StoreOnceAction,
    )
    narrative_parser.add_argument(
        "--previous-scenes",
        action=StoreOnceAction,
        help="previous chapter runtime scenes JSON for verbatim seam checking",
    )
    narrative_parser.add_argument(
        "--contract",
        action=StoreOnceAction,
        help="optional schema-1 four-law beat contract JSON",
    )
    narrative_parser.add_argument(
        "--require-contract",
        action="store_true",
        help="warn when no explicit four-law beat contract is supplied",
    )
    narrative_parser.add_argument(
        "--fail-on-warnings",
        action="store_true",
        help="return 2 when diagnostics report warnings; default remains advisory",
    )

    mechanics_parser = subparsers.add_parser(
        "check-mechanics",
        help="check inquiry mechanics and evidence-judgment contracts",
    )
    mechanics_parser.add_argument(
        "--contract",
        required=True,
        action=StoreOnceAction,
        help="schema-1 inquiry mechanics contract JSON",
    )

    subparsers.add_parser("sync-mirror", help="regenerate the human-readable mirror")

    args = parser.parse_args()
    if args.command == "validate":
        return validate(args.activation)
    if args.command == "route":
        return route_sources(
            args.task,
            args.chapter,
            args.phase,
            args.mode,
            args.lane,
            args.impact,
            args.target_path,
            args.target_label,
            args.chapter_brief_path,
            args.chapter_spec_path,
            args.provenance_path,
        )
    if args.command == "check-report":
        return check_report(args.report, args.lane)
    if args.command == "check-narrative":
        source_kind = "scenes" if args.scenes else "draft"
        source_value = args.scenes if args.scenes else args.draft
        return check_narrative(
            source_path=resolve_target_path(source_value),
            source_kind=source_kind,
            chapter=args.chapter,
            previous_scenes=(
                resolve_target_path(args.previous_scenes)
                if args.previous_scenes
                else None
            ),
            contract_path=(
                resolve_target_path(args.contract) if args.contract else None
            ),
            require_contract=args.require_contract,
            fail_on_warnings=args.fail_on_warnings,
        )
    if args.command == "check-mechanics":
        return check_mechanics(resolve_target_path(args.contract))
    if args.command == "sync-mirror":
        return sync_mirror()
    return 1


if __name__ == "__main__":
    sys.exit(main())
