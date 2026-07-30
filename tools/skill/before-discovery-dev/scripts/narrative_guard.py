#!/usr/bin/env python3
"""Deterministic narrative diagnostics for the before-discovery project."""

from __future__ import annotations

import heapq
import json
import re
import unicodedata
from pathlib import Path
from typing import Callable


CHAPTERS = {"ch1", "ch2", "ch3", "ch4", "ch5"}
TRAVELER_PREFIX = "旅人"
SYSTEM_SPEAKERS = {"stage", "system"}
CHAR_DENSITY_BASELINE = 27.0
CHAR_DENSITY_WARNING = CHAR_DENSITY_BASELINE * 1.2
MIN_NODES_PER_SCENE = 6.0
MAX_LINES_BEFORE_FIRST_ACTION = 20
OS_PURPOSES = {
    "time_dislocation",
    "future_knowledge",
    "cross_chapter_memory",
    "private_observation",
    "private_hypothesis",
    "emotional_risk",
    "naming",
}

FORBIDDEN_PATTERNS: dict[str, tuple[tuple[str, re.Pattern[str]], ...]] = {
    "ch1": (
        (
            "加速度(數值用)",
            re.compile(
                r"(?:加速度[^。！？!?]{0,16}(?:\d|公尺|米|m/s|g\b)"
                r"|(?:\d|公尺|米|m/s|g\b)[^。！？!?]{0,16}加速度)",
                re.IGNORECASE,
            ),
        ),
        ("g", re.compile(r"(?<![A-Za-z])g(?![A-Za-z])", re.IGNORECASE)),
        ("9.8", re.compile(r"9[.．]8")),
        ("4.9", re.compile(r"4[.．]9")),
        ("慣性", re.compile(r"慣性")),
        ("真空", re.compile(r"真空")),
        ("拋物線", re.compile(r"拋物線")),
        ("動量", re.compile(r"動量")),
        ("能量", re.compile(r"能量")),
    ),
    "ch2": (
        ("慣性", re.compile(r"慣性")),
        ("參考系", re.compile(r"參考系")),
        ("相對運動", re.compile(r"相對運動")),
        ("萬有引力", re.compile(r"萬有引力")),
        ("平方反比", re.compile(r"平方反比")),
        ("動量", re.compile(r"動量")),
        ("能量", re.compile(r"能量")),
    ),
    "ch3": (
        ("慣性", re.compile(r"慣性")),
        ("參考系", re.compile(r"參考系")),
        ("相對運動", re.compile(r"相對運動")),
        ("引力", re.compile(r"引力")),
        ("重力", re.compile(r"重力")),
        ("向心", re.compile(r"向心")),
        ("平方反比", re.compile(r"平方反比")),
        ("動量", re.compile(r"動量")),
        ("能量", re.compile(r"能量")),
    ),
    "ch4": (
        ("動量", re.compile(r"動量")),
        ("能量", re.compile(r"能量")),
        ("活力", re.compile(r"活力")),
        ("守恆", re.compile(r"守恆")),
        ("動能", re.compile(r"動能")),
        ("位能", re.compile(r"位能")),
    ),
    "ch5": (
        ("焦耳", re.compile(r"焦耳")),
        (
            "動能=½mv²",
            re.compile(
                r"動能\s*[＝=]\s*(?:½|1\s*/\s*2)\s*[mＭ]\s*[vＶ](?:²|\^?\s*2)",
                re.IGNORECASE,
            ),
        ),
        ("能量守恆定律", re.compile(r"能量守恆定律")),
    ),
}

CONTRACT_SECTIONS = (
    "three_beat_evidence",
    "cognitive_pauses",
    "npc_reactions",
    "forced_transitions",
)


class NarrativeInputError(ValueError):
    """Raised when a narrative source cannot be parsed deterministically."""


def _strip_inline_markdown(text: str) -> str:
    text = re.sub(r"<!--.*?-->", "", text)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"[*_~]+", "", text)
    return text.strip()


def _node_visible_entries(scene_id: str, node: dict) -> list[dict]:
    entries: list[dict] = []
    node_id = str(node.get("id", "<missing-node>"))
    text = node.get("text")
    if isinstance(text, str) and text.strip():
        entries.append(
            {
                "location": f"{scene_id}/{node_id}",
                "speaker": str(node.get("speaker", "")),
                "text": text.strip(),
                "dialogue": node.get("type") == "line"
                and str(node.get("speaker", "")) not in SYSTEM_SPEAKERS,
                "metric": True,
                "node_type": str(node.get("type", "")),
                "legacy_only": node.get("legacyOnly") is True,
                "os_purpose": node.get("osPurpose"),
            }
        )
    options = node.get("options", [])
    if isinstance(options, list):
        for option in options:
            if not isinstance(option, dict):
                continue
            option_text = option.get("text")
            if not isinstance(option_text, str) or not option_text.strip():
                continue
            option_id = str(option.get("id", "<missing-option>"))
            entries.append(
                {
                    "location": f"{scene_id}/{node_id}/option:{option_id}",
                    "speaker": "player-option",
                    "text": option_text.strip(),
                    "dialogue": True,
                    "metric": False,
                    "node_type": "option",
                    "legacy_only": node.get("legacyOnly") is True,
                    "os_purpose": None,
                }
            )
    return entries


def parse_scenes_json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise NarrativeInputError(f"cannot read scenes JSON: {exc}") from exc
    if not isinstance(data, dict) or not isinstance(data.get("scenes"), list):
        raise NarrativeInputError("scenes JSON must be an object with a scenes array")

    scenes: list[dict] = []
    seen_scene_ids: set[str] = set()
    for raw_scene in data["scenes"]:
        if not isinstance(raw_scene, dict):
            raise NarrativeInputError("every scenes[] entry must be an object")
        scene_id = raw_scene.get("id")
        nodes = raw_scene.get("nodes")
        if not isinstance(scene_id, str) or not scene_id:
            raise NarrativeInputError("every scene must have a non-empty string id")
        if scene_id in seen_scene_ids:
            raise NarrativeInputError(f"duplicate scene id: {scene_id}")
        seen_scene_ids.add(scene_id)
        if not isinstance(nodes, list):
            raise NarrativeInputError(f"scene {scene_id} must have a nodes array")

        entries: list[dict] = []
        node_map: dict[str, dict] = {}
        for index, node in enumerate(nodes):
            if not isinstance(node, dict):
                raise NarrativeInputError(f"scene {scene_id} contains a non-object node")
            node_id = node.get("id")
            if not isinstance(node_id, str) or not node_id:
                raise NarrativeInputError(f"scene {scene_id} has a node without string id")
            if node_id in node_map:
                raise NarrativeInputError(f"scene {scene_id} has duplicate node id {node_id}")
            node_map[node_id] = {"index": index, "node": node}
            entries.extend(_node_visible_entries(scene_id, node))
        scenes.append(
            {
                "id": scene_id,
                "title": str(raw_scene.get("title", "")),
                "entries": entries,
                "nodes": nodes,
                "node_map": node_map,
                "node_count": len(nodes),
                "text_beat_count": sum(
                    1
                    for node in nodes
                    if isinstance(node.get("text"), str) and node["text"].strip()
                    and node.get("legacyOnly") is not True
                ),
                "active_node_count": sum(
                    node.get("legacyOnly") is not True for node in nodes
                ),
            }
        )
    return {
        "kind": "scenes",
        "data": data,
        "scenes": scenes,
        "scene_map": {scene["id"]: scene for scene in scenes},
    }


SCENE_HEADING = re.compile(r"^##\s+.*?【([^】]+)】")
SPEAKER_LINE = re.compile(
    r"^(?P<speaker>[^：:]{1,40}?)(?:\([^：:]{0,30}\))?\s*[：:]\s*(?P<text>.+)$"
)


def parse_draft_markdown(path: Path) -> dict:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise NarrativeInputError(f"cannot read draft Markdown: {exc}") from exc

    scenes: list[dict] = []
    current: dict | None = None
    in_fence = False
    fence_char = ""
    for line_number, raw_line in enumerate(lines, start=1):
        fence = re.match(r"^\s{0,3}(`{3,}|~{3,})", raw_line)
        if fence:
            char = fence.group(1)[0]
            if not in_fence:
                in_fence = True
                fence_char = char
            elif char == fence_char:
                in_fence = False
                fence_char = ""
            continue
        if in_fence:
            continue

        heading = SCENE_HEADING.match(raw_line)
        if heading:
            scene_id = heading.group(1).strip()
            current = {
                "id": scene_id,
                "title": _strip_inline_markdown(raw_line),
                "entries": [],
                "nodes": [],
                "node_map": {},
                "node_count": 0,
                "text_beat_count": 0,
            }
            scenes.append(current)
            continue
        if current is None:
            continue
        if raw_line.startswith("#"):
            continue
        stripped = raw_line.strip()
        if (
            not stripped
            or stripped.startswith("|")
            or stripped.startswith(">")
            or stripped.startswith("<!--")
        ):
            continue

        cleaned = re.sub(r"^(?:\*\*)?〔(?:新|改)〕(?:\*\*)?\s*", "", stripped)
        cleaned = _strip_inline_markdown(cleaned)
        if cleaned.startswith(("-", "+")):
            continue
        entry: dict | None = None
        if cleaned.startswith(("(", "（")):
            entry = {
                "location": f"{current['id']}/line:{line_number}",
                "speaker": "stage",
                "text": cleaned,
                "dialogue": False,
                "metric": True,
            }
        elif cleaned.startswith("【") and "】" in cleaned:
            entry = {
                "location": f"{current['id']}/line:{line_number}",
                "speaker": "system",
                "text": cleaned,
                "dialogue": False,
                "metric": True,
            }
        elif cleaned.startswith(("▸", "▶")):
            option_text = re.split(r"→", cleaned, maxsplit=1)[0].strip()
            entry = {
                "location": f"{current['id']}/line:{line_number}",
                "speaker": "player-option",
                "text": option_text,
                "dialogue": True,
                "metric": False,
            }
        else:
            speaker_candidate = cleaned.lstrip("→").strip()
            speaker_match = SPEAKER_LINE.match(speaker_candidate)
            if speaker_match:
                speaker = _strip_inline_markdown(speaker_match.group("speaker"))
                text = speaker_match.group("text").strip()
                if "|" not in speaker and not speaker.startswith(("【", "〔", "-", "+")):
                    entry = {
                        "location": f"{current['id']}/line:{line_number}",
                        "speaker": speaker,
                        "text": text,
                        "dialogue": True,
                        "metric": True,
                    }
        if entry is not None:
            current["entries"].append(entry)
            current["node_count"] += 1
            if entry["metric"]:
                current["text_beat_count"] += 1

    if not scenes:
        raise NarrativeInputError(
            "draft has no recognized scene heading; expected '## ...【SCENE-ID】'"
        )
    duplicate_ids = {
        scene["id"]
        for scene in scenes
        if sum(other["id"] == scene["id"] for other in scenes) > 1
    }
    if duplicate_ids:
        raise NarrativeInputError(f"duplicate draft scene ids: {sorted(duplicate_ids)}")
    return {
        "kind": "draft",
        "data": None,
        "scenes": scenes,
        "scene_map": {scene["id"]: scene for scene in scenes},
    }


def _contains_gold_phrase(text: str) -> bool:
    for sentence in re.split(r"(?<=[。！？!?])", text):
        if "不是" not in sentence:
            continue
        after_not = sentence.split("不是", 1)[1]
        if "就是" not in after_not and re.search(
            r"不是[^。！？!?]{1,45}(?:[，,；;：:]\s*)?是",
            sentence,
        ):
            return True
        if re.search(r"[^。！？!?]{1,30}[，,；;]\s*不是[^。！？!?]{1,30}", sentence):
            return True
    return False


def _last_open_question(parsed: dict) -> tuple[str, str] | None:
    if not parsed["scenes"]:
        return None
    for entry in reversed(parsed["scenes"][-1]["entries"]):
        quoted = re.findall(r"「([^」]*[？?])」", entry["text"])
        if quoted:
            return quoted[-1], entry["location"]
        clauses = re.findall(
            r"(?:^|[。！!：:\n])\s*([^。！!\n]*?[？?])",
            entry["text"],
        )
        if clauses:
            clause = re.split(r"[：:]", clauses[-1])[-1].strip()
            return clause, entry["location"]
    return None


def _normalize_seam_text(text: str) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", text))


def _is_traveler_inner(speaker: object) -> bool:
    return isinstance(speaker, str) and speaker == "旅人・心聲"


def _is_traveler_spoken(speaker: object) -> bool:
    return (
        isinstance(speaker, str)
        and speaker.startswith(TRAVELER_PREFIX)
        and not _is_traveler_inner(speaker)
    )


def _node_targets(node: dict) -> list[str]:
    targets: list[str] = []
    if isinstance(node.get("next"), str):
        targets.append(node["next"])
    options = node.get("options", [])
    if isinstance(options, list):
        targets.extend(
            option["next"]
            for option in options
            if isinstance(option, dict) and isinstance(option.get("next"), str)
        )
    return targets


def _first_reachable_action(parsed: dict) -> tuple[tuple[str, str] | None, int]:
    """Return the reachable choice/embed with the shortest visible-line runway.

    Runtime enters the first node of ``startScene``, follows ``next`` and
    ``option.next`` inside a scene, and enters the first node of a target scene
    at ``goto``.  ``legacyOnly`` nodes remain traversable migration scaffolding,
    but they do not count as visible beats or player actions.
    """

    if parsed["kind"] != "scenes":
        return None, 0

    data = parsed["data"]
    start_scene_id = data.get("startScene")
    scene_map = parsed["scene_map"]
    if not isinstance(start_scene_id, str) or start_scene_id not in scene_map:
        return None, 0

    def first_node_id(scene_id: str) -> str | None:
        scene = scene_map.get(scene_id)
        if scene is None or not scene["nodes"]:
            return None
        node_id = scene["nodes"][0].get("id")
        return node_id if isinstance(node_id, str) else None

    start_node_id = first_node_id(start_scene_id)
    if start_node_id is None:
        return None, 0

    # (visible lines, stable insertion order, scene id, node id)
    frontier: list[tuple[int, int, str, str]] = [
        (0, 0, start_scene_id, start_node_id)
    ]
    best_runway: dict[tuple[str, str], int] = {}
    insertion_order = 0

    while frontier:
        lines_before, _, scene_id, node_id = heapq.heappop(frontier)
        location = (scene_id, node_id)
        if lines_before >= best_runway.get(location, lines_before + 1):
            continue
        best_runway[location] = lines_before

        scene = scene_map.get(scene_id)
        node_record = scene["node_map"].get(node_id) if scene is not None else None
        if node_record is None:
            continue
        node = node_record["node"]
        legacy_only = node.get("legacyOnly") is True
        if not legacy_only and node.get("type") in {"choice", "embed"}:
            return location, lines_before

        next_runway = lines_before
        if (
            not legacy_only
            and isinstance(node.get("text"), str)
            and node["text"].strip()
        ):
            next_runway += 1

        targets: list[tuple[str, str]] = []
        if node.get("type") == "goto":
            target_scene_id = node.get("scene")
            if isinstance(target_scene_id, str):
                target_node_id = first_node_id(target_scene_id)
                if target_node_id is not None:
                    targets.append((target_scene_id, target_node_id))
        else:
            for target_node_id in _node_targets(node):
                if target_node_id in scene["node_map"]:
                    targets.append((scene_id, target_node_id))

        for target_scene_id, target_node_id in targets:
            target_location = (target_scene_id, target_node_id)
            if next_runway >= best_runway.get(target_location, next_runway + 1):
                continue
            insertion_order += 1
            heapq.heappush(
                frontier,
                (
                    next_runway,
                    insertion_order,
                    target_scene_id,
                    target_node_id,
                ),
            )

    return None, 0


def _evidence_effect_ids(value: object) -> set[str]:
    evidence: set[str] = set()
    if isinstance(value, dict):
        if isinstance(value.get("evidence"), str):
            evidence.add(value["evidence"])
        for child in value.values():
            evidence |= _evidence_effect_ids(child)
    elif isinstance(value, list):
        for child in value:
            evidence |= _evidence_effect_ids(child)
    return evidence


def _validate_contract(
    contract_path: Path,
    chapter: str,
    parsed: dict,
    warn: Callable[[str, str], None],
) -> None:
    if parsed["kind"] != "scenes":
        raise NarrativeInputError("beat contracts require --scenes JSON, not --draft")
    try:
        contract = json.loads(contract_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise NarrativeInputError(f"cannot read narrative contract: {exc}") from exc
    if not isinstance(contract, dict) or contract.get("schema_version") != 1:
        raise NarrativeInputError("narrative contract schema_version must be 1")
    if contract.get("chapter") != chapter:
        raise NarrativeInputError(
            f"narrative contract chapter {contract.get('chapter')!r} != {chapter!r}"
        )
    for section in CONTRACT_SECTIONS:
        if section not in contract or not isinstance(contract[section], list):
            raise NarrativeInputError(f"narrative contract must contain array {section}")
        if not contract[section]:
            warn(
                "NAR-CONTRACT",
                f"narrative contract section {section} is empty and protects no beat",
            )
        ids = [
            record.get("id")
            for record in contract[section]
            if isinstance(record, dict) and isinstance(record.get("id"), str)
        ]
        duplicate_ids = sorted({item_id for item_id in ids if ids.count(item_id) > 1})
        if duplicate_ids:
            warn(
                "NAR-CONTRACT",
                f"narrative contract section {section} has duplicate ids {duplicate_ids}",
            )

    scene_map = parsed["scene_map"]
    scene_order = {scene["id"]: index for index, scene in enumerate(parsed["scenes"])}
    three_beat_ids = {
        record["id"]
        for record in contract["three_beat_evidence"]
        if isinstance(record, dict) and isinstance(record.get("id"), str)
    }
    pause_ids = {
        record["id"]
        for record in contract["cognitive_pauses"]
        if isinstance(record, dict) and isinstance(record.get("id"), str)
    }
    for missing_pause in sorted(three_beat_ids - pause_ids):
        warn(
            "NAR-64",
            f"evidence contract {missing_pause!r} has no matching cognitive pause",
        )

    direct_evidence_ids: set[str] = set()
    npc_speakers: set[str] = set()
    for scene in parsed["scenes"]:
        for node in scene["nodes"]:
            direct_evidence_ids |= _evidence_effect_ids(node.get("effects", []))
            options = node.get("options", [])
            if isinstance(options, list):
                direct_evidence_ids |= _evidence_effect_ids(
                    [
                        option.get("effects", [])
                        for option in options
                        if isinstance(option, dict)
                    ]
                )
            speaker = node.get("speaker")
            if (
                isinstance(speaker, str)
                and speaker
                and speaker not in SYSTEM_SPEAKERS
                and not speaker.startswith(TRAVELER_PREFIX)
            ):
                npc_speakers.add(speaker)
    for missing_evidence in sorted(direct_evidence_ids - three_beat_ids):
        warn(
            "NAR-63",
            f"runtime evidence {missing_evidence!r} has no three_beat_evidence contract",
        )
    reaction_speakers = {
        record["responder"]
        for record in contract["npc_reactions"]
        if isinstance(record, dict) and isinstance(record.get("responder"), str)
    }
    for missing_npc in sorted(npc_speakers - reaction_speakers):
        warn(
            "NAR-65",
            f"NPC {missing_npc!r} has no reaction contract",
        )

    def record_id(record: dict, section: str, index: int) -> str:
        value = record.get("id") if isinstance(record, dict) else None
        return value if isinstance(value, str) and value else f"{section}[{index}]"

    def resolve_node(section: str, item_id: str, scene_id: object, node_id: object):
        if not isinstance(scene_id, str) or scene_id not in scene_map:
            warn("NAR-CONTRACT", f"{section}/{item_id}: unknown scene {scene_id!r}")
            return None
        if not isinstance(node_id, str) or node_id not in scene_map[scene_id]["node_map"]:
            warn(
                "NAR-CONTRACT",
                f"{section}/{item_id}: unknown node {scene_id}/{node_id}",
            )
            return None
        return scene_map[scene_id]["node_map"][node_id]

    for index, record in enumerate(contract["three_beat_evidence"]):
        if not isinstance(record, dict):
            warn("NAR-63", f"three_beat_evidence[{index}] must be an object")
            continue
        item_id = record_id(record, "three_beat_evidence", index)
        scene_id = record.get("scene")
        resolved = [
            resolve_node("three_beat_evidence", item_id, scene_id, record.get(field))
            for field in ("discover", "respond", "confirm")
        ]
        if any(item is None for item in resolved):
            continue
        indices = [item["index"] for item in resolved]
        node_ids = [record[field] for field in ("discover", "respond", "confirm")]
        if len(set(node_ids)) != 3 or indices != sorted(indices) or len(set(indices)) != 3:
            warn(
                "NAR-63",
                f"{item_id}: discover → respond → confirm must be three distinct ordered nodes",
            )
            continue
        speakers = [str(item["node"].get("speaker", "")) for item in resolved]
        if speakers[0] == speakers[1]:
            warn(
                "NAR-63",
                f"{item_id}: respond node speaker must differ from discover speaker",
            )

    for index, record in enumerate(contract["cognitive_pauses"]):
        if not isinstance(record, dict):
            warn("NAR-64", f"cognitive_pauses[{index}] must be an object")
            continue
        item_id = record_id(record, "cognitive_pauses", index)
        scene_id = record.get("scene")
        pause = resolve_node("cognitive_pauses", item_id, scene_id, record.get("pause"))
        evidence = resolve_node(
            "cognitive_pauses", item_id, scene_id, record.get("evidence")
        )
        if pause and evidence and pause["index"] >= evidence["index"]:
            warn("NAR-64", f"{item_id}: pause must occur before evidence")

    for index, record in enumerate(contract["npc_reactions"]):
        if not isinstance(record, dict):
            warn("NAR-65", f"npc_reactions[{index}] must be an object")
            continue
        item_id = record_id(record, "npc_reactions", index)
        scene_id = record.get("scene")
        reaction = resolve_node(
            "npc_reactions", item_id, scene_id, record.get("node")
        )
        if not reaction:
            continue
        responder = record.get("responder")
        target = record.get("to_speaker")
        actual = reaction["node"].get("speaker")
        if not isinstance(responder, str) or responder in SYSTEM_SPEAKERS or responder.startswith(
            TRAVELER_PREFIX
        ):
            warn("NAR-65", f"{item_id}: responder must name an NPC")
        elif actual != responder:
            warn(
                "NAR-65",
                f"{item_id}: reaction speaker is {actual!r}, expected {responder!r}",
            )
        if not isinstance(target, str) or not any(
            item["node"].get("speaker") == target
            and item["index"] < reaction["index"]
            for item in parsed["scene_map"].get(str(scene_id), {}).get("node_map", {}).values()
        ):
            warn(
                "NAR-65",
                f"{item_id}: to_speaker {target!r} has no earlier line in the scene",
            )

    for index, record in enumerate(contract["forced_transitions"]):
        if not isinstance(record, dict):
            warn("NAR-66", f"forced_transitions[{index}] must be an object")
            continue
        item_id = record_id(record, "forced_transitions", index)
        from_scene = record.get("from_scene")
        to_scene = record.get("to_scene")
        pressure = resolve_node(
            "forced_transitions", item_id, from_scene, record.get("pressure")
        )
        if not isinstance(to_scene, str) or to_scene not in scene_map:
            warn("NAR-66", f"{item_id}: unknown to_scene {to_scene!r}")
            continue
        if pressure is None:
            continue
        if scene_order[to_scene] <= scene_order[str(from_scene)]:
            warn("NAR-66", f"{item_id}: to_scene must follow from_scene")
        outgoing = {
            str(node.get("scene"))
            for node in scene_map[str(from_scene)]["nodes"]
            if node.get("type") == "goto" and isinstance(node.get("scene"), str)
        }
        if outgoing and to_scene not in outgoing:
            warn(
                "NAR-66",
                f"{item_id}: {from_scene} has goto targets {sorted(outgoing)}, not {to_scene}",
            )


def check_narrative(
    *,
    source_path: Path,
    source_kind: str,
    chapter: str,
    previous_scenes: Path | None,
    contract_path: Path | None,
    require_contract: bool,
    fail_on_warnings: bool,
) -> int:
    if chapter not in CHAPTERS:
        print(f"ERROR unsupported chapter: {chapter}")
        return 1
    if not source_path.is_file():
        print(f"ERROR narrative source not found: {source_path}")
        return 1
    if previous_scenes is not None and not previous_scenes.is_file():
        print(f"ERROR previous scenes not found: {previous_scenes}")
        return 1
    if contract_path is not None and not contract_path.is_file():
        print(f"ERROR narrative contract not found: {contract_path}")
        return 1

    try:
        parsed = (
            parse_scenes_json(source_path)
            if source_kind == "scenes"
            else parse_draft_markdown(source_path)
        )
    except NarrativeInputError as exc:
        print(f"ERROR {exc}")
        return 1

    warnings: list[tuple[str, str]] = []

    def warn(code: str, message: str) -> None:
        warnings.append((code, message))

    scenes = parsed["scenes"]
    total_spoken = 0
    total_inner = 0
    total_inner_inventory = 0
    scene_voice_summary: list[str] = []
    for scene in scenes:
        active_entries = [
            entry for entry in scene["entries"] if not entry.get("legacy_only", False)
        ]
        spoken = sum(
            _is_traveler_spoken(entry["speaker"]) for entry in active_entries
        )
        inner = sum(
            _is_traveler_inner(entry["speaker"]) for entry in active_entries
        )
        inner_inventory = sum(
            _is_traveler_inner(entry["speaker"]) for entry in scene["entries"]
        )
        actions = sum(
            node.get("legacyOnly") is not True
            and node.get("type") in {"choice", "embed"}
            for node in scene["nodes"]
        )
        total_spoken += spoken
        total_inner += inner
        total_inner_inventory += inner_inventory
        scene_voice_summary.append(
            f"{scene['id']}:spoken={spoken},inner={inner},actions={actions}"
        )

    first_action, lines_before_first_action = _first_reachable_action(parsed)
    if (
        first_action is not None
        and lines_before_first_action > MAX_LINES_BEFORE_FIRST_ACTION
    ):
        warn(
            "NAR-01",
            f"{lines_before_first_action} visible lines before first choice/embed at "
            f"{first_action[0]}/{first_action[1]}; player agency may arrive too late",
        )

    if parsed["kind"] == "scenes":
        active_inner_nodes = [
            node
            for scene in scenes
            for node in scene["nodes"]
            if node.get("legacyOnly") is not True
            and _is_traveler_inner(node.get("speaker"))
        ]
        purpose_contract_enabled = any(
            "osPurpose" in node for node in active_inner_nodes
        )
        for scene in scenes:
            node_map = {
                str(node.get("id")): node
                for node in scene["nodes"]
                if isinstance(node.get("id"), str)
            }
            for node in scene["nodes"]:
                if node.get("legacyOnly") is True:
                    continue
                node_id = str(node.get("id", "<missing-node>"))
                if _is_traveler_inner(node.get("speaker")):
                    purpose = node.get("osPurpose")
                    if purpose is not None and purpose not in OS_PURPOSES:
                        warn(
                            "NAR-09",
                            f"{scene['id']}/{node_id} has unknown osPurpose {purpose!r}",
                        )
                    elif purpose_contract_enabled and purpose is None:
                        warn(
                            "NAR-09",
                            f"{scene['id']}/{node_id} active OS has no osPurpose",
                        )
                for target_id in _node_targets(node):
                    target = node_map.get(target_id)
                    if target is None:
                        continue
                    if target.get("legacyOnly") is True:
                        warn(
                            "NAR-09",
                            f"{scene['id']}/{node_id} still routes into legacy-only "
                            f"node {target_id}",
                        )
                    if (
                        _is_traveler_inner(node.get("speaker"))
                        and target.get("legacyOnly") is not True
                        and _is_traveler_inner(target.get("speaker"))
                    ):
                        warn(
                            "NAR-09",
                            f"consecutive active OS: {scene['id']}/{node_id} → "
                            f"{target_id}",
                        )

    for scene in scenes:
        for entry in scene["entries"]:
            for label, pattern in FORBIDDEN_PATTERNS[chapter]:
                if pattern.search(entry["text"]):
                    warn(
                        "NAR-02",
                        f"forbidden term {label!r} at {entry['location']}: "
                        f"{entry['text'][:90]}",
                    )

    for scene in scenes:
        hits = [
            entry["location"]
            for entry in scene["entries"]
            if entry["dialogue"] and _contains_gold_phrase(entry["text"])
        ]
        if len(hits) > 1:
            warn(
                "NAR-03",
                f"scene {scene['id']} has {len(hits)} aphorism/contrast candidates: "
                + ", ".join(hits),
            )

    if previous_scenes is not None:
        try:
            previous = parse_scenes_json(previous_scenes)
        except NarrativeInputError as exc:
            print(f"ERROR previous scenes: {exc}")
            return 1
        question = _last_open_question(previous)
        if question is None:
            warn("NAR-04", "previous chapter has no quoted open question to compare")
        else:
            question_text, location = question
            first_scene_text = "\n".join(
                entry["text"] for entry in scenes[0]["entries"]
            )
            if _normalize_seam_text(question_text) not in _normalize_seam_text(
                first_scene_text
            ):
                warn(
                    "NAR-04",
                    f"seam question from {location} is not repeated verbatim in "
                    f"{scenes[0]['id']}: {question_text}",
                )

    total_nodes = sum(scene["node_count"] for scene in scenes)
    active_nodes = sum(
        scene.get("active_node_count", scene["node_count"]) for scene in scenes
    )
    total_chars = sum(
        len(re.sub(r"\s+", "", entry["text"]))
        for scene in scenes
        for entry in scene["entries"]
        if entry["metric"] and not entry.get("legacy_only", False)
    )
    chars_per_node = total_chars / active_nodes if active_nodes else 0.0
    nodes_per_scene = active_nodes / len(scenes) if scenes else 0.0
    if chars_per_node > CHAR_DENSITY_WARNING:
        warn(
            "NAR-08",
            f"{chars_per_node:.1f} chars/node exceeds 1.2× ch1 baseline "
            f"({CHAR_DENSITY_BASELINE:.0f}); beats may be compressed",
        )
    if len(scenes) >= 5 and nodes_per_scene < MIN_NODES_PER_SCENE:
        warn(
            "NAR-08",
            f"{nodes_per_scene:.1f} nodes/scene is below the diagnostic floor "
            f"{MIN_NODES_PER_SCENE:.0f}; the narrative layer may be a shell",
        )
    for scene in scenes:
        if scene["text_beat_count"] <= 1:
            warn(
                "NAR-08",
                f"scene {scene['id']} has only {scene['text_beat_count']} visible text beat(s)",
            )

    if parsed["kind"] == "scenes":
        acquisition_count = 0
        for scene in scenes:
            for index, node in enumerate(scene["nodes"]):
                if node.get("legacyOnly") is True:
                    continue
                evidence_ids = _evidence_effect_ids(node.get("effects", []))
                evidence_ids |= _evidence_effect_ids(
                    [option.get("effects", []) for option in node.get("options", [])]
                    if isinstance(node.get("options"), list)
                    else []
                )
                if not evidence_ids:
                    continue
                acquisition_count += 1
                runway = [
                    candidate
                    for candidate in scene["nodes"][: index + 1]
                    if candidate.get("legacyOnly") is not True
                ][-5:]
                visible_beats = sum(
                    isinstance(candidate.get("text"), str)
                    and bool(candidate["text"].strip())
                    for candidate in runway
                )
                if visible_beats < 3:
                    warn(
                        "NAR-63",
                        f"{scene['id']}/{node.get('id')} grants "
                        f"{sorted(evidence_ids)} with only {visible_beats} visible "
                        "beat(s) in its five-node runway",
                    )
        print(
            "COVERAGE NAR-63 runtime evidence effects inspected="
            f"{acquisition_count}; engine-owned evidence requires a beat contract"
        )

    if contract_path is not None:
        try:
            _validate_contract(contract_path, chapter, parsed, warn)
        except NarrativeInputError as exc:
            print(f"ERROR {exc}")
            return 1
    elif require_contract:
        warn(
            "NAR-CONTRACT",
            "four-law beat contract is required but --contract was not supplied",
        )

    traveler_total = total_spoken + total_inner
    inner_ratio = total_inner / traveler_total if traveler_total else 0.0
    print(
        f"COVERAGE NAR-01 first_action="
        f"{first_action[0] + '/' + first_action[1] if first_action else 'none'} "
        f"lines_before={lines_before_first_action}; heart voice does not pay "
        "player-participation"
    )
    print(
        f"COVERAGE NAR-09 spoken={total_spoken} active_inner={total_inner} "
        f"inner_inventory={total_inner_inventory} "
        f"inner_share={inner_ratio:.1%}"
    )
    print("COVERAGE NAR-09 BY_SCENE " + " | ".join(scene_voice_summary))
    print(
        f"NARRATIVE source={source_kind} chapter={chapter} "
        f"scenes={len(scenes)} active_nodes/beats={active_nodes} "
        f"inventory_nodes={total_nodes} chars/node={chars_per_node:.1f} "
        f"nodes/scene={nodes_per_scene:.1f}"
    )
    for code, message in warnings:
        print(f"WARN {code} {message}")
    print(
        "MANUAL NAR-05 aging treatment must be one of explicit / anonymous / deferred "
        "and still needs human review"
    )
    print(
        "MANUAL NAR-06 dates, places, people and external-world claims require a "
        "source-backed fact table"
    )
    print(
        "MANUAL NAR-07 fictional people, props and events require a visible "
        "reasonable-reconstruction disclosure"
    )
    print(
        "MANUAL FOUR-LAWS contract nodes preserve approved beats; they do not prove "
        "that the prose semantically discovers, responds, pauses or creates pressure"
    )
    print(
        f"RESULT NARRATIVE_CHECKED: 0 parser errors, {len(warnings)} warning(s), "
        f"strict={'ON' if fail_on_warnings else 'OFF'}"
    )
    return 2 if warnings and fail_on_warnings else 0
