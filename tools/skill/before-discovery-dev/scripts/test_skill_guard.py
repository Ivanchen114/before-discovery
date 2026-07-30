#!/usr/bin/env python3
"""Regression tests for the candidate before-discovery skill guard."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import skill_guard as guard_module
from test_mechanics_guard import make_valid_contract


SCRIPT_PATH = Path(__file__).resolve()
GUARD_PATH = SCRIPT_PATH.with_name("skill_guard.py")
REPO_ROOT = SCRIPT_PATH.parents[4]
PROVENANCE_FIXTURE = (
    "05_審核/發現之前_第四章v0.7對抗審_Sol_20260728.md"
)


def run_guard(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(GUARD_PATH), *args],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )


def make_support_artifact(
    directory: Path,
    filename: str,
    *,
    artifact: str,
    chapter: str = "ch6",
    status: str,
) -> str:
    path = directory / filename
    path.write_text(
        "\n".join(
            [
                "---",
                f"bd_artifact: {artifact}",
                f"bd_chapter: {chapter}",
                f"bd_status: {status}",
                "---",
                "",
                f"# Test fixture: {filename}",
                "",
            ]
        ),
        encoding="utf-8",
    )
    return path.relative_to(REPO_ROOT).as_posix()


class ActivationLifecycleTests(unittest.TestCase):
    @staticmethod
    def git(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["git", *args],
            cwd=repo,
            check=False,
            capture_output=True,
            text=True,
        )

    def make_git_repo(self, directory: Path) -> Path:
        repo = directory / "repo"
        repo.mkdir()
        self.assertEqual(self.git(repo, "init").returncode, 0)
        self.assertEqual(
            self.git(repo, "config", "user.name", "Skill Guard Test").returncode,
            0,
        )
        self.assertEqual(
            self.git(repo, "config", "user.email", "skill-guard@example.invalid").returncode,
            0,
        )
        seed = repo / "seed.txt"
        seed.write_text("seed\n", encoding="utf-8")
        self.assertEqual(self.git(repo, "add", "seed.txt").returncode, 0)
        self.assertEqual(
            self.git(repo, "commit", "-m", "seed").returncode,
            0,
        )
        return repo

    def test_only_untracked_active_sources_block_activation(self) -> None:
        self.assertTrue(
            guard_module.untracked_source_blocks_activation("active", True)
        )
        for status in ("candidate", "superseded", "obsolete", "historical"):
            with self.subTest(status=status):
                self.assertFalse(
                    guard_module.untracked_source_blocks_activation(status, True)
                )
        self.assertFalse(
            guard_module.untracked_source_blocks_activation("active", False)
        )

    def test_staged_only_active_source_does_not_satisfy_activation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = self.make_git_repo(Path(temp_dir))
            active = repo / "active.md"
            active.write_text("# Active\n", encoding="utf-8")
            self.assertEqual(self.git(repo, "add", "active.md").returncode, 0)

            self.assertTrue(guard_module.tracked(active, repo))
            self.assertFalse(guard_module.present_in_head(active, repo))
            self.assertFalse(
                guard_module.source_versioned_for_validation(
                    active,
                    "active",
                    True,
                    repo,
                )
            )

    def test_committed_active_source_satisfies_activation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = self.make_git_repo(Path(temp_dir))
            active = repo / "active.md"
            active.write_text("# Active\n", encoding="utf-8")
            self.assertEqual(self.git(repo, "add", "active.md").returncode, 0)
            self.assertEqual(
                self.git(repo, "commit", "-m", "track active").returncode,
                0,
            )

            self.assertTrue(guard_module.present_in_head(active, repo))
            self.assertTrue(
                guard_module.source_versioned_for_validation(
                    active,
                    "active",
                    True,
                    repo,
                )
            )

    def test_modified_active_source_does_not_satisfy_activation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = self.make_git_repo(Path(temp_dir))
            active = repo / "active.md"
            active.write_text("# Active\n", encoding="utf-8")
            self.assertEqual(self.git(repo, "add", "active.md").returncode, 0)
            self.assertEqual(
                self.git(repo, "commit", "-m", "track active").returncode,
                0,
            )

            active.write_text("# Active\n\nLocal drift.\n", encoding="utf-8")
            self.assertTrue(guard_module.present_in_head(active, repo))
            self.assertFalse(guard_module.matches_head(active, repo))
            self.assertFalse(
                guard_module.source_versioned_for_validation(
                    active,
                    "active",
                    True,
                    repo,
                )
            )

    def test_untracked_child_inside_active_directory_does_not_match_head(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = self.make_git_repo(Path(temp_dir))
            active_dir = repo / "active"
            active_dir.mkdir()
            (active_dir / "law.md").write_text("# Law\n", encoding="utf-8")
            self.assertEqual(self.git(repo, "add", "active/law.md").returncode, 0)
            self.assertEqual(
                self.git(repo, "commit", "-m", "track active directory").returncode,
                0,
            )
            self.assertTrue(guard_module.matches_head(active_dir, repo))

            (active_dir / "local.md").write_text("# Local\n", encoding="utf-8")
            self.assertFalse(guard_module.matches_head(active_dir, repo))

    def test_modified_skill_package_does_not_match_head(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = self.make_git_repo(Path(temp_dir))
            package = repo / "package.md"
            package.write_text("v1\n", encoding="utf-8")
            self.assertEqual(self.git(repo, "add", "package.md").returncode, 0)
            self.assertEqual(
                self.git(repo, "commit", "-m", "track package").returncode,
                0,
            )
            self.assertTrue(guard_module.matches_head(package, repo))

            package.write_text("v2\n", encoding="utf-8")
            self.assertFalse(guard_module.matches_head(package, repo))
            self.assertEqual(self.git(repo, "add", "package.md").returncode, 0)
            self.assertFalse(guard_module.matches_head(package, repo))

    def test_mirror_header_tracks_registry_lifecycle(self) -> None:
        candidate = guard_module.build_mirror_header(
            {
                "skill_version": "3.4.2-candidate",
                "registry_status": "candidate",
            }
        )
        active = guard_module.build_mirror_header(
            {
                "skill_version": "3.4.2",
                "registry_status": "active",
            }
        )
        self.assertIn("候選鏡像，不是 agent 生效版", candidate)
        self.assertIn("仍須明示同步並 read-back", active)
        self.assertIn("active 治理鏡像", active)
        self.assertNotIn("候選鏡像", active)


class RouteGuardTests(unittest.TestCase):
    def base_review(self) -> list[str]:
        return [
            "route",
            "--task",
            "review",
            "--chapter",
            "ch4",
            "--phase",
            "review",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
        ]

    def test_missing_path_blocks_but_label_routes(self) -> None:
        missing = run_guard(
            *self.base_review(),
            "--target-path",
            "04_劇本/第四章台詞稿_v0.9_不存在.md",
        )
        self.assertEqual(missing.returncode, 2, missing.stdout + missing.stderr)
        self.assertIn("TARGET NOT FOUND", missing.stdout)

        label = run_guard(
            *self.base_review(),
            "--target-label",
            "WP-A-CH4-NEW-SCRIPT",
        )
        self.assertEqual(label.returncode, 0, label.stdout + label.stderr)
        self.assertIn("TARGET LABEL EXTERNAL/UNREGISTERED", label.stdout)

    def test_target_kind_is_explicit_not_suffix_guessed(self) -> None:
        typescript = run_guard(
            *self.base_review(),
            "--target-path",
            "04_劇本/不存在.ts",
        )
        self.assertEqual(typescript.returncode, 2, typescript.stdout + typescript.stderr)

        fragment = run_guard(
            *self.base_review(),
            "--target-path",
            "04_劇本/不存在.md#L1",
        )
        self.assertEqual(fragment.returncode, 2, fragment.stdout + fragment.stderr)

        url = run_guard(
            *self.base_review(),
            "--target-path",
            "https://example.invalid/spec",
        )
        self.assertEqual(url.returncode, 1, url.stdout + url.stderr)

    def test_lane_is_required_and_serialized_floor_is_r4(self) -> None:
        no_lane = run_guard(
            "route",
            "--task",
            "save",
            "--chapter",
            "ch4",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--target-path",
            "greybox/src/ch4-migration.js",
        )
        self.assertEqual(no_lane.returncode, 1, no_lane.stdout + no_lane.stderr)

        for lane, expected in (("R1", 2), ("R4", 0)):
            result = run_guard(
                "route",
                "--task",
                "save",
                "--chapter",
                "ch4",
                "--phase",
                "implement",
                "--mode",
                "TO-BE",
                "--lane",
                lane,
                "--target-path",
                "greybox/src/ch4-migration.js",
            )
            self.assertEqual(result.returncode, expected, result.stdout + result.stderr)

    def test_known_shared_target_auto_requires_r3(self) -> None:
        for lane, expected in (("R2", 2), ("R3", 0)):
            result = run_guard(
                "route",
                "--task",
                "runtime",
                "--chapter",
                "ch4",
                "--phase",
                "implement",
                "--mode",
                "TO-BE",
                "--lane",
                lane,
                "--target-path",
                "greybox/src/chapter-ui.js",
            )
            self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
            self.assertIn("shared-engine-change", result.stdout)

    def test_read_only_phases_do_not_inherit_mutation_lane_floors(self) -> None:
        cases = (
            ("runtime", "diagnose", "greybox/src/chapter-ui.js"),
            ("save", "review", "greybox/src/ch4-migration.js"),
            ("save", "verify", "greybox/src/ch4-migration.js"),
        )
        for task, phase, target in cases:
            with self.subTest(task=task, phase=phase, target=target):
                result = run_guard(
                    "route",
                    "--task",
                    task,
                    "--chapter",
                    "ch4",
                    "--phase",
                    phase,
                    "--mode",
                    "AS-IS",
                    "--lane",
                    "R0",
                    "--target-path",
                    target,
                )
                self.assertEqual(
                    result.returncode,
                    0,
                    result.stdout + result.stderr,
                )
                self.assertNotIn("LANE BLOCKER", result.stdout)

    def test_phase_and_player_visible_lane_floors(self) -> None:
        cases = (
            ("art", "art", "R1", "--target-label", "WP-ART-SMOKE", "R2", "art-change"),
            (
                "archive",
                "archive",
                "R1",
                "--target-label",
                "WP-ARCHIVE-SMOKE",
                "R4",
                "archive-mutation",
            ),
            (
                "release",
                "release",
                "R1",
                "--target-label",
                "WP-RELEASE-SMOKE",
                "R4",
                "release",
            ),
            (
                "ui",
                "implement",
                "R1",
                "--target-path",
                "greybox/stage.html",
                "R2",
                "player-visible-runtime",
            ),
        )
        for task, phase, lane, target_flag, target, floor, reason in cases:
            with self.subTest(task=task, phase=phase):
                result = run_guard(
                    "route",
                    "--task",
                    task,
                    "--chapter",
                    "ch4",
                    "--phase",
                    phase,
                    "--mode",
                    "TO-BE",
                    "--lane",
                    lane,
                    target_flag,
                    target,
                )
                self.assertEqual(
                    result.returncode,
                    2,
                    result.stdout + result.stderr,
                )
                self.assertIn(
                    f"LANE BLOCKER {reason} requires {floor}",
                    result.stdout,
                )

    def test_release_action_aliases_require_r4_during_mutation(self) -> None:
        for task in ("commit", "push", "deploy", "publish"):
            with self.subTest(task=task):
                blocked = run_guard(
                    "route",
                    "--task",
                    task,
                    "--phase",
                    "implement",
                    "--mode",
                    "TO-BE",
                    "--lane",
                    "R1",
                    "--target-label",
                    f"WP-{task.upper()}-SMOKE",
                )
                self.assertEqual(
                    blocked.returncode,
                    2,
                    blocked.stdout + blocked.stderr,
                )
                self.assertIn(
                    "LANE BLOCKER release requires R4",
                    blocked.stdout,
                )

    def test_shared_stage_event_descendant_is_registered_and_r3(self) -> None:
        blocked = run_guard(
            "route",
            "--task",
            "runtime",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--lane",
            "R2",
            "--target-path",
            "greybox/src/stage/05-events.part.js",
        )
        self.assertEqual(blocked.returncode, 2, blocked.stdout + blocked.stderr)
        self.assertIn("shared-engine-change", blocked.stdout)
        self.assertIn("source=runtime.stage-sources", blocked.stdout)

        allowed = run_guard(
            "route",
            "--task",
            "runtime",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
            "--target-path",
            "greybox/src/stage/05-events.part.js",
        )
        self.assertEqual(allowed.returncode, 0, allowed.stdout + allowed.stderr)

    def test_file_identity_aliases_keep_risk_and_registry_identity(self) -> None:
        absolute_shared = str((REPO_ROOT / "greybox/src/chapter-ui.js").resolve())
        shared = run_guard(
            "route",
            "--task",
            "runtime",
            "--chapter",
            "ch4",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--lane",
            "R2",
            "--target-path",
            absolute_shared,
        )
        self.assertEqual(shared.returncode, 2, shared.stdout + shared.stderr)
        self.assertIn("shared-engine-change", shared.stdout)

        absolute_superseded = str(
            (
                REPO_ROOT
                / "04_劇本/第四章台詞稿_v0.7_展開版_Claude_20260727.md"
            ).resolve()
        )
        superseded = run_guard(
            *self.base_review(),
            "--target-path",
            absolute_superseded,
        )
        self.assertEqual(
            superseded.returncode,
            0,
            superseded.stdout + superseded.stderr,
        )
        self.assertIn("status=superseded", superseded.stdout)

    def test_invalid_path_and_label_targets_are_rejected(self) -> None:
        cases = (
            ("--target-path", ""),
            ("--target-path", "greybox"),
            ("--target-path", "/dev/null"),
            ("--target-path", ".git/config"),
            ("--target-label", ""),
            ("--target-label", "greybox/src/chapter-ui.js"),
            ("--target-label", "runtime.chapter-ui"),
            ("--target-label", "不存在.md"),
            ("--target-label", "WP-BAD\nLABEL"),
        )
        for flag, target in cases:
            with self.subTest(flag=flag, target=target):
                result = run_guard(*self.base_review(), flag, target)
                self.assertEqual(
                    result.returncode,
                    1,
                    result.stdout + result.stderr,
                )

    def test_chapter_conflicts_are_rejected(self) -> None:
        task_conflict = run_guard(
            "route",
            "--task",
            "chapter.ch4",
            "--chapter",
            "ch3",
            "--phase",
            "review",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-CHAPTER-CONFLICT",
        )
        self.assertEqual(
            task_conflict.returncode,
            1,
            task_conflict.stdout + task_conflict.stderr,
        )

        target_conflict = run_guard(
            "route",
            "--task",
            "review",
            "--chapter",
            "ch3",
            "--phase",
            "review",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-path",
            "04_劇本/第四章台詞稿_v0.7_展開版_Claude_20260727.md",
        )
        self.assertEqual(
            target_conflict.returncode,
            1,
            target_conflict.stdout + target_conflict.stderr,
        )

        mixed_targets = run_guard(
            *self.base_review(),
            "--target-path",
            "04_劇本/第四章台詞稿_v0.7_展開版_Claude_20260727.md",
            "--target-path",
            "04_劇本/第三章台詞稿_v0.9_展開版_Claude_20260728.md",
        )
        self.assertEqual(
            mixed_targets.returncode,
            1,
            mixed_targets.stdout + mixed_targets.stderr,
        )

        unregistered_name_conflict = run_guard(
            "route",
            "--task",
            "narrative",
            "--chapter",
            "ch3",
            "--phase",
            "review",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-path",
            "04_劇本/第四章台詞稿_v0.8_Claude_20260728.md",
        )
        self.assertEqual(
            unregistered_name_conflict.returncode,
            1,
            unregistered_name_conflict.stdout + unregistered_name_conflict.stderr,
        )

        inferred_chapter = run_guard(
            "route",
            "--task",
            "narrative",
            "--phase",
            "review",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-path",
            "04_劇本/第四章台詞稿_v0.8_Claude_20260728.md",
        )
        self.assertEqual(
            inferred_chapter.returncode,
            0,
            inferred_chapter.stdout + inferred_chapter.stderr,
        )
        self.assertIn("CHAPTER ch4", inferred_chapter.stdout)
        self.assertIn("[chapter.ch4]", inferred_chapter.stdout)

    def test_singleton_arguments_and_mutation_target_are_enforced(self) -> None:
        duplicate_lane = run_guard(
            *self.base_review(),
            "--lane",
            "R1",
            "--target-label",
            "WP-DUPLICATE-LANE",
        )
        self.assertEqual(
            duplicate_lane.returncode,
            1,
            duplicate_lane.stdout + duplicate_lane.stderr,
        )

        missing_target = run_guard(
            "route",
            "--task",
            "runtime",
            "--chapter",
            "ch4",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
        )
        self.assertEqual(
            missing_target.returncode,
            2,
            missing_target.stdout + missing_target.stderr,
        )
        self.assertIn("TARGET BLOCKER", missing_target.stdout)

    def test_superseded_target_is_explicitly_cautioned(self) -> None:
        result = run_guard(
            *self.base_review(),
            "--target-path",
            "04_劇本/第四章台詞稿_v0.7_展開版_Claude_20260727.md",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("status=superseded", result.stdout)
        self.assertIn("CAUTION TARGET SUPERSEDED", result.stdout)

    def test_narrative_implementation_and_historical_inquiry_route_full_law(self) -> None:
        implement = run_guard(
            "route",
            "--task",
            "narrative",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
            "--target-label",
            "WP-NARRATIVE-IMPLEMENT",
            "--impact",
            "shared-engine-change",
        )
        self.assertEqual(implement.returncode, 0, implement.stdout + implement.stderr)
        self.assertIn("narrative.voice", implement.stdout)
        self.assertIn("narrative.historical-inquiry", implement.stdout)
        self.assertIn("narrative.series-bible", implement.stdout)
        self.assertNotIn("SOURCE narrative.dialogue-rules", implement.stdout)

        inquiry = run_guard(
            "route",
            "--task",
            "historical-inquiry",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-HISTORICAL-INQUIRY",
        )
        self.assertEqual(inquiry.returncode, 0, inquiry.stdout + inquiry.stderr)
        for route in ("[design]", "[narrative]", "[history]"):
            self.assertIn(route, inquiry.stdout)
        self.assertIn("narrative.series-bible", inquiry.stdout)
        self.assertNotIn("[workbench]", inquiry.stdout)
        self.assertNotIn("SOURCE design.workbench", inquiry.stdout)

        workbench = run_guard(
            "route",
            "--task",
            "workbench",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-WORKBENCH-DESIGN",
        )
        self.assertEqual(workbench.returncode, 0, workbench.stdout + workbench.stderr)
        self.assertIn("[design]", workbench.stdout)
        self.assertIn("[workbench]", workbench.stdout)
        self.assertIn("SOURCE design.evidence-ownership", workbench.stdout)
        self.assertIn("SOURCE design.workbench", workbench.stdout)

    def test_evidence_route_owns_unlock_and_art_contract_without_workbench(self) -> None:
        result = run_guard(
            "route",
            "--task",
            "evidence",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-EVIDENCE-CONTRACT",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[design]", result.stdout)
        self.assertIn("design.evidence-ownership", result.stdout)
        self.assertNotIn("[workbench]", result.stdout)
        self.assertNotIn("design.workbench", result.stdout)

    def test_reputation_route_loads_cross_chapter_law_and_ch3_case(self) -> None:
        cross_chapter = run_guard(
            "route",
            "--task",
            "reputation",
            "--phase",
            "review",
            "--mode",
            "CONFORMANCE",
            "--lane",
            "R0",
            "--target-label",
            "WP-REPUTATION-REVIEW",
        )
        self.assertEqual(
            cross_chapter.returncode,
            0,
            cross_chapter.stdout + cross_chapter.stderr,
        )
        self.assertIn("SOURCE design.reputation-lifecycle", cross_chapter.stdout)
        self.assertNotIn("SOURCE ch3.cr-026", cross_chapter.stdout)
        self.assertNotIn("[workbench]", cross_chapter.stdout)

        chapter_three = run_guard(
            "route",
            "--task",
            "reputation",
            "--chapter",
            "ch3",
            "--phase",
            "review",
            "--mode",
            "CONFORMANCE",
            "--lane",
            "R0",
            "--target-label",
            "WP-CH3-REPUTATION-REVIEW",
        )
        self.assertEqual(
            chapter_three.returncode,
            0,
            chapter_three.stdout + chapter_three.stderr,
        )
        self.assertIn("SOURCE design.reputation-lifecycle", chapter_three.stdout)
        self.assertIn("CAUTION ch3.cr-026", chapter_three.stdout)

    def test_release_routes_closeout_accessibility_and_review_sources(self) -> None:
        result = run_guard(
            "route",
            "--task",
            "release",
            "--phase",
            "release",
            "--mode",
            "CONFORMANCE",
            "--lane",
            "R4",
            "--target-label",
            "WP-RELEASE-CANDIDATE",
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        for source_id in (
            "core.closeout-baseline",
            "accessibility.art-rules",
            "review.shared-format",
        ):
            self.assertIn(source_id, result.stdout)

    def test_generic_interaction_routes_narrative_not_workbench(self) -> None:
        generic = run_guard(
            "route",
            "--task",
            "interaction",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-SCENE-INTERACTION",
        )
        self.assertEqual(generic.returncode, 0, generic.stdout + generic.stderr)
        self.assertIn("[narrative]", generic.stdout)
        self.assertNotIn("[workbench]", generic.stdout)
        self.assertNotIn("design.workbench", generic.stdout)

        for task in ("evidence-interaction", "workbench-interaction"):
            specialized = run_guard(
                "route",
                "--task",
                task,
                "--phase",
                "plan",
                "--mode",
                "TO-BE",
                "--lane",
                "R0",
                "--target-label",
                f"WP-{task.upper()}",
            )
            self.assertEqual(
                specialized.returncode,
                0,
                specialized.stdout + specialized.stderr,
            )
            self.assertIn("[design]", specialized.stdout)
            self.assertIn("[workbench]", specialized.stdout)
            self.assertIn("design.workbench", specialized.stdout)

    def test_historical_claim_requires_chapter_or_provenance(self) -> None:
        missing = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-HISTORY-NO-CONTEXT",
        )
        self.assertEqual(missing.returncode, 2, missing.stdout + missing.stderr)
        self.assertIn(
            "historical-claim requires --chapter or at least one "
            "verifiable --provenance-path",
            missing.stdout,
        )
        self.assertIn("RESULT SOURCES_BLOCKED", missing.stdout)
        self.assertIn("BLOCKER work-package.provenance", missing.stdout)

        chapter = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch4",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-CH4-HISTORY",
        )
        self.assertEqual(chapter.returncode, 0, chapter.stdout + chapter.stderr)
        self.assertIn("history.ch4-runtime", chapter.stdout)
        self.assertNotIn("history.ch1-runtime", chapter.stdout)

        provenance = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-HISTORY-WITH-PROVENANCE",
            "--provenance-path",
            PROVENANCE_FIXTURE,
        )
        self.assertEqual(
            provenance.returncode,
            0,
            provenance.stdout + provenance.stderr,
        )
        self.assertIn(
            f"PROVENANCE PATH {PROVENANCE_FIXTURE}",
            provenance.stdout,
        )
        self.assertIn("WORK-PACKAGE PROVENANCE", provenance.stdout)
        self.assertIn("source quality not evaluated", provenance.stdout)

    def test_unregistered_chapter_plans_but_write_and_implement_fail_closed(self) -> None:
        fixture_dir = tempfile.TemporaryDirectory(
            prefix=".route-support-",
            dir=REPO_ROOT,
        )
        self.addCleanup(fixture_dir.cleanup)
        fixture_root = Path(fixture_dir.name)
        brief_fixture = make_support_artifact(
            fixture_root,
            "brief.md",
            artifact="chapter-brief",
            status="design-gate-passed",
        )
        spec_fixture = make_support_artifact(
            fixture_root,
            "spec.md",
            artifact="implementation-spec",
            status="frozen",
        )
        provenance_fixture = make_support_artifact(
            fixture_root,
            "provenance.md",
            artifact="historical-provenance",
            status="review-ready",
        )
        plan = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch6",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-CH6-HISTORY-PLAN",
        )
        self.assertEqual(plan.returncode, 0, plan.stdout + plan.stderr)
        self.assertIn("CHAPTER TOKEN ch6 is not registered", plan.stdout)
        self.assertIn("plan/review context only", plan.stdout)
        self.assertIn("GAP history.ch6-source", plan.stdout)

        for phase in ("write", "implement", "art"):
            missing_both = run_guard(
                "route",
                "--task",
                "historical-claim",
                "--chapter",
                "ch6",
                "--phase",
                phase,
                "--mode",
                "TO-BE",
                "--lane",
                "R3",
                "--target-label",
                f"WP-CH6-{phase.upper()}",
            )
            self.assertEqual(
                missing_both.returncode,
                2,
                missing_both.stdout + missing_both.stderr,
            )
            required_path = (
                "--chapter-brief-path" if phase == "write" else "--chapter-spec-path"
            )
            self.assertIn(f"requires {required_path}", missing_both.stdout)
            self.assertIn("requires at least one --provenance-path", missing_both.stdout)

        only_brief = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch6",
            "--phase",
            "write",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
            "--target-label",
            "WP-CH6-ONLY-BRIEF",
            "--chapter-brief-path",
            brief_fixture,
        )
        self.assertEqual(only_brief.returncode, 2, only_brief.stdout + only_brief.stderr)
        self.assertNotIn("requires --chapter-brief-path", only_brief.stdout)
        self.assertIn("requires at least one --provenance-path", only_brief.stdout)

        only_provenance = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch6",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
            "--target-label",
            "WP-CH6-ONLY-PROVENANCE",
            "--provenance-path",
            provenance_fixture,
        )
        self.assertEqual(
            only_provenance.returncode,
            2,
            only_provenance.stdout + only_provenance.stderr,
        )
        self.assertIn("requires --chapter-spec-path", only_provenance.stdout)
        self.assertNotIn(
            "requires at least one --provenance-path",
            only_provenance.stdout,
        )

        complete_write = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch6",
            "--phase",
            "write",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
            "--target-label",
            "WP-CH6-COMPLETE",
            "--chapter-brief-path",
            brief_fixture,
            "--provenance-path",
            provenance_fixture,
        )
        self.assertEqual(
            complete_write.returncode,
            0,
            complete_write.stdout + complete_write.stderr,
        )
        self.assertIn(
            f"CHAPTER BRIEF PATH {brief_fixture}",
            complete_write.stdout,
        )
        self.assertIn("role/chapter/status metadata verified", complete_write.stdout)
        self.assertIn(
            "substance not independently evaluated",
            complete_write.stdout,
        )
        self.assertIn(
            f"PROVENANCE PATH {provenance_fixture}",
            complete_write.stdout,
        )
        self.assertIn("WORK-PACKAGE PROVENANCE", complete_write.stdout)
        self.assertIn("source quality not evaluated", complete_write.stdout)

        for phase in ("implement", "art"):
            complete_implementation_phase = run_guard(
                "route",
                "--task",
                "historical-claim",
                "--chapter",
                "ch6",
                "--phase",
                phase,
                "--mode",
                "TO-BE",
                "--lane",
                "R3",
                "--target-label",
                f"WP-CH6-COMPLETE-{phase.upper()}",
                "--chapter-spec-path",
                spec_fixture,
                "--provenance-path",
                provenance_fixture,
            )
            self.assertEqual(
                complete_implementation_phase.returncode,
                0,
                complete_implementation_phase.stdout
                + complete_implementation_phase.stderr,
            )
            self.assertIn(
                f"CHAPTER SPEC PATH {spec_fixture}",
                complete_implementation_phase.stdout,
            )
            self.assertIn(
                "role/chapter/frozen metadata verified",
                complete_implementation_phase.stdout,
            )

        underdeclared = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch6",
            "--phase",
            "write",
            "--mode",
            "TO-BE",
            "--lane",
            "R2",
            "--target-label",
            "WP-CH6-UNDERDECLARED",
            "--chapter-brief-path",
            brief_fixture,
            "--provenance-path",
            provenance_fixture,
        )
        self.assertEqual(
            underdeclared.returncode,
            2,
            underdeclared.stdout + underdeclared.stderr,
        )
        self.assertIn(
            "LANE BLOCKER unregistered-chapter requires R3",
            underdeclared.stdout,
        )

    def test_unregistered_chapter_support_artifact_metadata_fails_closed(self) -> None:
        fixture_dir = tempfile.TemporaryDirectory(
            prefix=".route-support-negative-",
            dir=REPO_ROOT,
        )
        self.addCleanup(fixture_dir.cleanup)
        fixture_root = Path(fixture_dir.name)
        valid_provenance = make_support_artifact(
            fixture_root,
            "provenance.md",
            artifact="historical-provenance",
            status="verified",
        )
        bad_briefs = {
            "wrong-role": make_support_artifact(
                fixture_root,
                "wrong-role.md",
                artifact="implementation-spec",
                status="design-gate-passed",
            ),
            "wrong-chapter": make_support_artifact(
                fixture_root,
                "wrong-chapter.md",
                artifact="chapter-brief",
                chapter="ch7",
                status="design-gate-passed",
            ),
            "unapproved": make_support_artifact(
                fixture_root,
                "unapproved.md",
                artifact="chapter-brief",
                status="draft",
            ),
        }
        for label, bad_brief in bad_briefs.items():
            with self.subTest(label=label):
                result = run_guard(
                    "route",
                    "--task",
                    "historical-claim",
                    "--chapter",
                    "ch6",
                    "--phase",
                    "write",
                    "--mode",
                    "TO-BE",
                    "--lane",
                    "R3",
                    "--target-label",
                    f"WP-CH6-BAD-{label.upper()}",
                    "--chapter-brief-path",
                    bad_brief,
                    "--provenance-path",
                    valid_provenance,
                )
                self.assertEqual(
                    result.returncode,
                    2,
                    result.stdout + result.stderr,
                )
                self.assertIn(
                    "ROUTE BLOCKER support-artifact metadata",
                    result.stdout,
                )

        unfrozen_spec = make_support_artifact(
            fixture_root,
            "unfrozen-spec.md",
            artifact="implementation-spec",
            status="draft",
        )
        unfrozen = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch6",
            "--phase",
            "implement",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
            "--target-label",
            "WP-CH6-UNFROZEN",
            "--chapter-spec-path",
            unfrozen_spec,
            "--provenance-path",
            valid_provenance,
        )
        self.assertEqual(
            unfrozen.returncode,
            2,
            unfrozen.stdout + unfrozen.stderr,
        )
        self.assertIn("bd_status 必須是 frozen", unfrozen.stdout)

        package_json = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch6",
            "--phase",
            "write",
            "--mode",
            "TO-BE",
            "--lane",
            "R3",
            "--target-label",
            "WP-CH6-PACKAGE-JSON",
            "--chapter-brief-path",
            "greybox/package.json",
            "--provenance-path",
            "greybox/package.json",
        )
        self.assertEqual(
            package_json.returncode,
            2,
            package_json.stdout + package_json.stderr,
        )
        self.assertIn("缺少 YAML front matter", package_json.stdout)
        self.assertIn("同一實體檔案不得兼任", package_json.stdout)

    def test_existing_chapter_claim_mutation_requires_external_provenance(self) -> None:
        for phase in ("write", "implement", "art"):
            missing = run_guard(
                "route",
                "--task",
                "historical-claim",
                "--chapter",
                "ch4",
                "--phase",
                phase,
                "--mode",
                "TO-BE",
                "--lane",
                "R2",
                "--target-label",
                f"WP-CH4-HISTORY-{phase.upper()}",
            )
            self.assertEqual(
                missing.returncode,
                2,
                missing.stdout + missing.stderr,
            )
            self.assertIn(
                "historical-claim write/implement/art requires at least one "
                "verifiable --provenance-path",
                missing.stdout,
            )
            self.assertIn("runtime histfacts cannot self-source", missing.stdout)
            self.assertIn("BLOCKER work-package.provenance", missing.stdout)

            sourced = run_guard(
                "route",
                "--task",
                "historical-claim",
                "--chapter",
                "ch4",
                "--phase",
                phase,
                "--mode",
                "TO-BE",
                "--lane",
                "R2",
                "--target-label",
                f"WP-CH4-HISTORY-SOURCED-{phase.upper()}",
                "--provenance-path",
                PROVENANCE_FIXTURE,
            )
            self.assertEqual(
                sourced.returncode,
                0,
                sourced.stdout + sourced.stderr,
            )
            self.assertIn("WORK-PACKAGE PROVENANCE", sourced.stdout)
            self.assertIn("history.ch4-runtime", sourced.stdout)

    def test_runtime_histfacts_cannot_self_source_historical_claim(self) -> None:
        self_sourced = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "ch4",
            "--phase",
            "write",
            "--mode",
            "TO-BE",
            "--lane",
            "R2",
            "--target-label",
            "WP-CH4-HISTORY-SELF-SOURCED",
            "--provenance-path",
            "greybox/data/histfacts4.json",
        )
        self.assertEqual(
            self_sourced.returncode,
            2,
            self_sourced.stdout + self_sourced.stderr,
        )
        self.assertIn(
            "PROVENANCE REJECTED greybox/data/histfacts4.json",
            self_sourced.stdout,
        )
        self.assertIn(
            "runtime canonical describes current output and cannot self-source",
            self_sourced.stdout,
        )
        self.assertIn(
            "runtime histfacts cannot self-source",
            self_sourced.stdout,
        )
        self.assertIn("REJECTED work-package.provenance", self_sourced.stdout)
        self.assertIn("RESULT SOURCES_BLOCKED", self_sourced.stdout)

    def test_chapter_and_support_path_inputs_are_verified(self) -> None:
        invalid_chapter = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--chapter",
            "chapter-six",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-BAD-CHAPTER",
        )
        self.assertEqual(
            invalid_chapter.returncode,
            1,
            invalid_chapter.stdout + invalid_chapter.stderr,
        )
        self.assertIn("--chapter 必須是 ch 加正整數", invalid_chapter.stdout)

        missing_provenance = run_guard(
            "route",
            "--task",
            "historical-claim",
            "--phase",
            "plan",
            "--mode",
            "TO-BE",
            "--lane",
            "R0",
            "--target-label",
            "WP-BAD-PROVENANCE",
            "--provenance-path",
            "05_審核/不存在的史實來源.md",
        )
        self.assertEqual(
            missing_provenance.returncode,
            1,
            missing_provenance.stdout + missing_provenance.stderr,
        )
        self.assertIn(
            "--provenance-path 必須指向 repo 內既有一般檔案",
            missing_provenance.stdout,
        )


class NarrativeGuardTests(unittest.TestCase):
    def make_scenes(self, *, traveler: bool = True) -> dict:
        traveler_speaker = "旅人(你)" if traveler else "旁觀者"
        return {
            "chapter": "ch5",
            "title": "fixture",
            "startScene": "S1",
            "scenes": [
                {
                    "id": "S1",
                    "title": "scene one",
                    "nodes": [
                        {
                            "id": "n1",
                            "type": "line",
                            "speaker": "甲",
                            "text": "我先看見刻度偏了。",
                            "next": "n2",
                        },
                        {
                            "id": "n2",
                            "type": "line",
                            "speaker": "乙",
                            "text": "我也看見，先別改紙。",
                            "next": "n3",
                        },
                        {
                            "id": "n3",
                            "type": "system",
                            "speaker": "system",
                            "text": "兩人重讀原紙，取得 J1。",
                            "effects": [{"evidence": "J1"}],
                            "next": "n4",
                        },
                        {
                            "id": "n4",
                            "type": "line",
                            "speaker": traveler_speaker,
                            "text": "我剛才還以為這一輪已經做完了。",
                            "next": "n5",
                        },
                        {
                            "id": "n5",
                            "type": "line",
                            "speaker": "乙",
                            "text": "桌邊的人都靠了過來。",
                            "next": "g1",
                        },
                        {
                            "id": "g1",
                            "type": "goto",
                            "scene": "S2",
                        },
                    ],
                },
                {
                    "id": "S2",
                    "title": "scene two",
                    "nodes": [
                        {
                            "id": "n1",
                            "type": "line",
                            "speaker": "甲",
                            "text": "下一張紙攤開了。",
                            "next": "n2",
                        },
                        {
                            "id": "n2",
                            "type": "line",
                            "speaker": traveler_speaker,
                            "text": "我想先把上一張紙的缺口說清楚。",
                            "next": "n3",
                        },
                        {
                            "id": "n3",
                            "type": "line",
                            "speaker": "乙",
                            "text": "你說，我先聽。",
                            "next": "n4",
                        },
                        {
                            "id": "n4",
                            "type": "line",
                            "speaker": "甲",
                            "text": "壁爐裡的木頭裂了一聲。",
                            "next": "n5",
                        },
                        {
                            "id": "n5",
                            "type": "system",
                            "speaker": "system",
                            "text": "本場收束。",
                            "next": "end",
                        },
                        {"id": "end", "type": "end"},
                    ],
                },
            ],
        }

    def make_contract(self) -> dict:
        return {
            "schema_version": 1,
            "chapter": "ch5",
            "three_beat_evidence": [
                {
                    "id": "J1",
                    "scene": "S1",
                    "discover": "n1",
                    "respond": "n2",
                    "confirm": "n3",
                }
            ],
            "cognitive_pauses": [
                {
                    "id": "J1",
                    "scene": "S1",
                    "pause": "n4",
                    "evidence": "n5",
                }
            ],
            "npc_reactions": [
                {
                    "id": "乙回應甲",
                    "scene": "S1",
                    "responder": "乙",
                    "to_speaker": "甲",
                    "node": "n2",
                },
                {
                    "id": "甲回應乙",
                    "scene": "S2",
                    "responder": "甲",
                    "to_speaker": "乙",
                    "node": "n4",
                }
            ],
            "forced_transitions": [
                {
                    "id": "眾人靠近",
                    "from_scene": "S1",
                    "pressure": "n5",
                    "to_scene": "S2",
                }
            ],
        }

    def run_json(
        self,
        scenes: dict,
        *,
        contract: dict | None = None,
        extra: tuple[str, ...] = (),
    ) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            scenes_path = root / "scenes.json"
            scenes_path.write_text(
                json.dumps(scenes, ensure_ascii=False),
                encoding="utf-8",
            )
            args = [
                "check-narrative",
                "--scenes",
                str(scenes_path),
                "--chapter",
                "ch5",
                *extra,
            ]
            if contract is not None:
                contract_path = root / "contract.json"
                contract_path.write_text(
                    json.dumps(contract, ensure_ascii=False),
                    encoding="utf-8",
                )
                args.extend(["--contract", str(contract_path)])
            return run_guard(*args)

    def test_valid_explicit_contract_passes_strict(self) -> None:
        result = self.run_json(
            self.make_scenes(),
            contract=self.make_contract(),
            extra=("--require-contract", "--fail-on-warnings"),
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("0 warning(s)", result.stdout)

    def test_delaying_first_player_action_turns_strict_red(self) -> None:
        scenes = self.make_scenes()
        scene = scenes["scenes"][0]
        scene["nodes"] = [
            {
                "id": f"intro-{index}",
                "type": "line",
                "speaker": "stage",
                "text": f"第 {index + 1} 段只讓玩家繼續。",
                "next": f"intro-{index + 1}" if index < 20 else "n1",
            }
            for index in range(21)
        ] + scene["nodes"]
        scenes["scenes"][1]["nodes"].insert(
            -1,
            {
                "id": "late-choice",
                "type": "choice",
                "text": "現在才讓玩家選。",
                "options": [{"id": "continue", "text": "繼續", "next": "end"}],
            },
        )
        scenes["scenes"][1]["nodes"][-3]["next"] = "late-choice"
        result = self.run_json(scenes, extra=("--fail-on-warnings",))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("WARN NAR-01", result.stdout)
        self.assertIn("before first choice/embed", result.stdout)

    def test_unreachable_dead_choice_cannot_fake_early_player_action(self) -> None:
        scenes = self.make_scenes()
        scenes["scenes"].insert(
            0,
            {
                "id": "DEAD",
                "title": "unreachable scene",
                "nodes": [
                    {
                        "id": "dead-choice",
                        "type": "choice",
                        "text": "這個選項不在主線上。",
                        "options": [
                            {
                                "id": "dead-end",
                                "text": "不應被算成第一次操作",
                                "next": "end",
                            }
                        ],
                    },
                    {"id": "end", "type": "end"},
                ],
            },
        )
        first_scene = scenes["scenes"][1]
        first_scene["nodes"] = [
            {
                "id": f"intro-{index}",
                "type": "line",
                "speaker": "stage",
                "text": f"第 {index + 1} 段仍未讓玩家操作。",
                "next": f"intro-{index + 1}" if index < 20 else "n1",
            }
            for index in range(21)
        ] + first_scene["nodes"]
        second_scene = scenes["scenes"][2]
        second_scene["nodes"].insert(
            -1,
            {
                "id": "true-choice",
                "type": "choice",
                "text": "這才是可達的第一次操作。",
                "options": [{"id": "continue", "text": "繼續", "next": "end"}],
            },
        )
        second_scene["nodes"][-3]["next"] = "true-choice"

        result = self.run_json(scenes, extra=("--fail-on-warnings",))

        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("WARN NAR-01", result.stdout)
        self.assertIn("first_action=S2/true-choice", result.stdout)
        self.assertNotIn("first_action=DEAD/dead-choice", result.stdout)

    def test_reachable_legacy_choice_does_not_pay_player_action(self) -> None:
        scenes = self.make_scenes()
        first_scene = scenes["scenes"][0]
        first_scene["nodes"] = [
            {
                "id": "legacy-choice",
                "type": "choice",
                "legacyOnly": True,
                "text": "舊存檔入口，不再算玩家操作。",
                "options": [{"id": "resume", "text": "繼續", "next": "intro-0"}],
            }
        ] + [
            {
                "id": f"intro-{index}",
                "type": "line",
                "speaker": "stage",
                "text": f"第 {index + 1} 段仍未讓玩家操作。",
                "next": f"intro-{index + 1}" if index < 20 else "n1",
            }
            for index in range(21)
        ] + first_scene["nodes"]
        second_scene = scenes["scenes"][1]
        second_scene["nodes"].insert(
            -1,
            {
                "id": "true-choice",
                "type": "choice",
                "text": "這才是現行玩家操作。",
                "options": [{"id": "continue", "text": "繼續", "next": "end"}],
            },
        )
        second_scene["nodes"][-3]["next"] = "true-choice"

        result = self.run_json(scenes, extra=("--fail-on-warnings",))

        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("WARN NAR-01", result.stdout)
        self.assertIn("first_action=S2/true-choice", result.stdout)
        self.assertNotIn("first_action=S1/legacy-choice", result.stdout)

    def test_os_purpose_legacy_edge_and_consecutive_os_turn_strict_red(self) -> None:
        missing_purpose = self.make_scenes()
        missing_purpose["scenes"][0]["nodes"][3]["speaker"] = "旅人・心聲"
        missing_purpose["scenes"][0]["nodes"][3]["osPurpose"] = "naming"
        missing_purpose["scenes"][1]["nodes"][1]["speaker"] = "旅人・心聲"
        result = self.run_json(
            missing_purpose,
            extra=("--fail-on-warnings",),
        )
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("active OS has no osPurpose", result.stdout)

        legacy_edge = self.make_scenes()
        legacy_edge["scenes"][0]["nodes"][4]["legacyOnly"] = True
        result = self.run_json(legacy_edge, extra=("--fail-on-warnings",))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("still routes into legacy-only node n5", result.stdout)

        consecutive = self.make_scenes()
        for node in consecutive["scenes"][0]["nodes"][:2]:
            node["speaker"] = "旅人・心聲"
            node["osPurpose"] = "private_observation"
        result = self.run_json(consecutive, extra=("--fail-on-warnings",))
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("consecutive active OS: S1/n1 → n2", result.stdout)

    def test_forbidden_terms_only_scan_player_visible_content(self) -> None:
        clean = self.make_scenes()
        clean["title"] = "焦耳只在 metadata"
        clean["lint"] = {"notes": ["能量守恆定律只在註記"]}
        result = self.run_json(clean)
        self.assertNotIn("WARN NAR-02", result.stdout)

        dirty = self.make_scenes()
        dirty["scenes"][0]["nodes"][0]["text"] = "焦耳已經替我們命名。"
        result = self.run_json(
            dirty,
            extra=("--fail-on-warnings",),
        )
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("WARN NAR-02", result.stdout)

    def test_second_aphorism_candidate_turns_strict_red(self) -> None:
        scenes = self.make_scenes()
        scenes["scenes"][0]["nodes"][0]["text"] = "不是猜，是重讀原紙。"
        scenes["scenes"][0]["nodes"][1]["text"] = "這是記錄，不是恭喜。"
        result = self.run_json(
            scenes,
            extra=("--fail-on-warnings",),
        )
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("WARN NAR-03", result.stdout)

    def test_contract_order_mutation_turns_strict_red(self) -> None:
        contract = self.make_contract()
        contract["three_beat_evidence"][0]["respond"] = "n5"
        result = self.run_json(
            self.make_scenes(),
            contract=contract,
            extra=("--require-contract", "--fail-on-warnings"),
        )
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("WARN NAR-63", result.stdout)

    def test_required_or_empty_contract_turns_strict_red(self) -> None:
        missing = self.run_json(
            self.make_scenes(),
            extra=("--require-contract", "--fail-on-warnings"),
        )
        self.assertEqual(missing.returncode, 2, missing.stdout + missing.stderr)
        self.assertIn("WARN NAR-CONTRACT", missing.stdout)

        empty = self.make_contract()
        empty["npc_reactions"] = []
        result = self.run_json(
            self.make_scenes(),
            contract=empty,
            extra=("--require-contract", "--fail-on-warnings"),
        )
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("protects no beat", result.stdout)

    def test_draft_ignores_headings_tables_notes_and_blockquotes(self) -> None:
        draft = (
            "# 設計註記\n"
            "## ◆【S1】焦耳只在場名\n"
            "| 說明 | 能量守恆定律 |\n"
            "> 不是註記，是規格。\n"
            "旅人:「我先把這句話講完。」\n"
            "甲:「請繼續。」\n"
            "（兩人把紙攤平。）\n"
            "## ◆【S2】第二場\n"
            "<!-- 動量不是能量 -->\n"
            "旅人(心聲):我還要再看一次。\n"
            "乙:「我等你。」\n"
            "（門外有人走近。）\n"
        )
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "draft.md"
            path.write_text(draft, encoding="utf-8")
            result = run_guard(
                "check-narrative",
                "--draft",
                str(path),
                "--chapter",
                "ch4",
                "--fail-on-warnings",
            )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("0 warning(s)", result.stdout)

    def test_draft_design_bullets_do_not_count_as_visible_beats(self) -> None:
        draft = (
            "## ◆【S1】兩句可見對話\n"
            "旅人:「我先看原紙。」\n"
            "甲:「我把燈移近。」\n"
            "- 場景目的：先建立共同注意力\n"
            "- 道具：桌面保留一張舊紙\n"
            "+ 音效：門外腳步逐漸靠近\n"
            "+ 導演註記：此處暫不切換鏡頭\n"
        )
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "draft.md"
            path.write_text(draft, encoding="utf-8")
            result = run_guard(
                "check-narrative",
                "--draft",
                str(path),
                "--chapter",
                "ch4",
            )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn(
            "scenes=1 active_nodes/beats=2",
            result.stdout,
        )
        self.assertIn("nodes/scene=2.0", result.stdout)

    def test_seam_uses_last_scene_open_question_verbatim(self) -> None:
        previous = self.make_scenes()
        previous["scenes"][-1]["nodes"][-2]["text"] = (
            "筆記新增未解問題：「下一張紙為什麼空著？」"
        )
        current = self.make_scenes()
        current["scenes"][0]["nodes"][0]["text"] = (
            "旅人翻頁。下一張紙為什麼空著？"
        )
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            previous_path = root / "previous.json"
            current_path = root / "current.json"
            previous_path.write_text(
                json.dumps(previous, ensure_ascii=False),
                encoding="utf-8",
            )
            current_path.write_text(
                json.dumps(current, ensure_ascii=False),
                encoding="utf-8",
            )
            passing = run_guard(
                "check-narrative",
                "--scenes",
                str(current_path),
                "--chapter",
                "ch5",
                "--previous-scenes",
                str(previous_path),
                "--fail-on-warnings",
            )
            self.assertEqual(
                passing.returncode,
                0,
                passing.stdout + passing.stderr,
            )

            current["scenes"][0]["nodes"][0]["text"] = "旅人翻頁。問題變了。"
            current_path.write_text(
                json.dumps(current, ensure_ascii=False),
                encoding="utf-8",
            )
            failing = run_guard(
                "check-narrative",
                "--scenes",
                str(current_path),
                "--chapter",
                "ch5",
                "--previous-scenes",
                str(previous_path),
                "--fail-on-warnings",
            )
        self.assertEqual(failing.returncode, 2, failing.stdout + failing.stderr)
        self.assertIn("WARN NAR-04", failing.stdout)


class ReportGuardTests(unittest.TestCase):
    def check(
        self,
        body: str,
        lane: str = "R2",
    ) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as temp_dir:
            report = Path(temp_dir) / "delivery.md"
            report.write_text(body, encoding="utf-8")
            return run_guard(
                "check-report",
                "--report",
                str(report),
                "--lane",
                lane,
            )

    def test_not_run_variants_warn(self) -> None:
        for status in ("NOT RUN", "NOT-RUN", "NOT_RUN", "未執行"):
            result = self.check(
                f"Full tests: {status}\nRegistry updated: YES\n"
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("1 warning(s)", result.stdout)

    def test_missing_or_unknown_fields_warn(self) -> None:
        missing = self.check("Outcome: COMPLETE\n")
        self.assertIn("2 warning(s)", missing.stdout)

        unknown = self.check(
            "Full tests: SOMEDAY\nRegistry updated: MAYBE\n"
        )
        self.assertIn("2 warning(s)", unknown.stdout)

    def test_known_complete_statuses_do_not_warn(self) -> None:
        for status in ("PASS", "PASS（130/0）", "FAIL（1）"):
            result = self.check(
                f"Full tests: {status}\nRegistry updated: N-A\n"
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("0 warning(s)", result.stdout)

    def test_duplicate_fields_cannot_mask_each_other(self) -> None:
        duplicate_tests = self.check(
            "Full tests: PASS\n"
            "Full tests: NOT RUN\n"
            "Registry updated: YES\n"
        )
        self.assertIn("1 warning(s)", duplicate_tests.stdout)

        duplicate_registry = self.check(
            "Full tests: PASS\n"
            "Registry updated: N-A\n"
            "Registry updated: MAYBE\n"
        )
        self.assertIn("1 warning(s)", duplicate_registry.stdout)

    def test_pass_skip_and_nonzero_failure_masks_warn(self) -> None:
        for status in (
            "PASS (NOT RUN)",
            "PASS; NOT RUN",
            "PASS — but skipped",
            "PASS (0/132)",
        ):
            with self.subTest(status=status):
                result = self.check(
                    f"Full tests: {status}\nRegistry updated: YES\n"
                )
                self.assertIn("1 warning(s)", result.stdout)

    def test_comments_and_code_fences_cannot_supply_delivery_fields(self) -> None:
        result = self.check(
            "<!-- Full tests: PASS\nRegistry updated: N-A -->\n"
            "```text\n"
            "Full tests: PASS\n"
            "Registry updated: N-A\n"
            "```\n"
            "Full tests: NOT RUN\n"
            "Registry updated: MAYBE\n"
        )
        self.assertIn("2 warning(s)", result.stdout)

    def test_commonmark_code_boundaries_cannot_supply_fields(self) -> None:
        bodies = (
            "\tFull tests: PASS\n\tRegistry updated: N-A\n",
            "````text\nFull tests: PASS\nRegistry updated: N-A\n````\n",
            "~~~text\nFull tests: PASS\nRegistry updated: N-A\n",
        )
        for body in bodies:
            with self.subTest(body=body.splitlines()[0]):
                result = self.check(body)
                self.assertIn("2 warning(s)", result.stdout)

    def test_markdown_styled_fields_cannot_hide_duplicates(self) -> None:
        duplicate_tests = self.check(
            "Full tests: PASS\n"
            "**Full tests:** NOT RUN\n"
            "Registry updated: N-A\n"
        )
        self.assertIn("1 warning(s)", duplicate_tests.stdout)

        duplicate_registry = self.check(
            "Full tests: PASS\n"
            "Registry updated: N-A\n"
            "> **Registry updated:** unknown\n"
        )
        self.assertIn("1 warning(s)", duplicate_registry.stdout)

    def test_frontmatter_and_details_cannot_supply_fields(self) -> None:
        result = self.check(
            "---\n"
            "Full tests: PASS\n"
            "Registry updated: N-A\n"
            "---\n"
            "<details>\n"
            "<summary>example</summary>\n"
            "Full tests: PASS\n"
            "Registry updated: N-A\n"
            "</details>\n"
            "Outcome: COMPLETE\n"
        )
        self.assertIn("2 warning(s)", result.stdout)

        for body in (
            "---\nFull tests: PASS\nRegistry updated: N-A\n",
            "<!--\nFull tests: PASS\nRegistry updated: N-A\n",
        ):
            with self.subTest(body=body.splitlines()[0]):
                result = self.check(body)
                self.assertIn("2 warning(s)", result.stdout)

    def test_low_risk_not_run_is_explicit_but_allowed(self) -> None:
        for lane in ("R0", "R1"):
            with self.subTest(lane=lane):
                result = self.check(
                    "Full tests: NOT RUN\nRegistry updated: YES\n",
                    lane=lane,
                )
                self.assertEqual(
                    result.returncode,
                    0,
                    result.stdout + result.stderr,
                )
                self.assertIn("0 warning(s)", result.stdout)

    def test_low_risk_reports_still_require_both_fields(self) -> None:
        result = self.check("Outcome: COMPLETE\n", lane="R1")
        self.assertIn("2 warning(s)", result.stdout)

class MechanicsGuardIntegrationTests(unittest.TestCase):
    def run_contract(self, contract: dict) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "mechanics.json"
            path.write_text(
                json.dumps(contract, ensure_ascii=False),
                encoding="utf-8",
            )
            return run_guard("check-mechanics", "--contract", str(path))

    def test_skill_guard_routes_valid_mechanics_contract(self) -> None:
        result = self.run_contract(make_valid_contract())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("MECHANICS_CONTRACT: PASS", result.stdout)
        self.assertIn("MANUAL:", result.stdout)

    def test_skill_guard_propagates_mechanics_contract_failure(self) -> None:
        contract = make_valid_contract()
        contract["decisions"][0]["options"][1]["refutedBy"] = []
        result = self.run_contract(contract)
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("DEC-04", result.stdout)


if __name__ == "__main__":
    unittest.main()
