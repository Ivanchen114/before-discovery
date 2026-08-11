#!/usr/bin/env python3
"""Focused positive and negative tests for mechanics_guard.py."""

from __future__ import annotations

import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from mechanics_guard import ENGINE_ADAPTERS, validate_contract


SCRIPT_PATH = Path(__file__).resolve()
GUARD_PATH = SCRIPT_PATH.with_name("mechanics_guard.py")
REPO_ROOT = SCRIPT_PATH.parents[4]


def make_valid_contract() -> dict:
    anchors = (
        ("question", "C0-1/n1", "world"),
        ("commitment", "C0-1/c_meet", "player"),
        ("operation", "C0-3/c1", "player"),
        ("trace", "C1-1/e1", "system"),
        ("interpretation", "C3-2/c1", "player"),
        ("resistance", "C3-2/x5", "npc"),
        ("success", "C3-2/s1", "system"),
        ("failure", "C3-2/g1", "system"),
    )
    beats = {
        name: {
            "anchor": anchor,
            "ordinal": ordinal,
            "reachable": True,
            "authorship": authorship,
        }
        for ordinal, (name, anchor, authorship) in enumerate(anchors, start=1)
    }
    beats["failure"]["preserves"] = ["trace"]

    return {
        "schema_version": 2,
        "chapter": "ch3",
        "binding": {
            "targetPath": "greybox/data/scenes3.json",
            "targetFormat": "scenes-json",
        },
        "segments": [
            {
                "id": "p1",
                "ordinal": 1,
                "mechanicalSpine": beats,
                "commitBeforeReveal": {
                    "commitment": "commitment",
                    "reveal": "trace",
                },
                "narrativeTrack": {
                    "payments": [
                        {
                            "id": "captain-pushes-back",
                            "anchor": "resistance",
                            "purpose": "character_response",
                        }
                    ],
                    "suppliesRequiredInference": False,
                    "suppliesMissingOperation": False,
                    "suppliesControlInstruction": False,
                },
            }
        ],
        "decisionRegistry": [
            {
                "id": "p1-concept",
                "segment": "p1",
                "kind": "evidence_judgment",
                "anchor": "operation",
            },
            {
                "id": "meet-gassendi",
                "segment": "p1",
                "kind": "narrative",
                "anchor": "commitment",
            },
            {
                "id": "name-dossier",
                "segment": "p1",
                "kind": "narrative",
                "anchor": "interpretation",
            },
            {
                "id": "public-bounded-claim",
                "segment": "p1",
                "kind": "evidence_judgment",
                "anchor": "interpretation",
                "runtimeAnchor": "C3-1/x1",
            },
        ],
        "decisions": [
            {
                "id": "p1-concept",
                "segment": "p1",
                "kind": "evidence_judgment",
                "anchor": "operation",
                "preselected": False,
                "options": [
                    {
                        "id": "shared-motion",
                        "isCorrect": True,
                        "supportedBy": [
                            {
                                "sourceId": "S5",
                                "field": "promptText",
                                "condition": "near_zero",
                            }
                        ],
                    },
                    {
                        "id": "small-lag",
                        "isCorrect": False,
                        "refutedBy": [
                            {
                                "sourceId": "S5",
                                "field": "promptText",
                                "relation": "contradicts",
                                "condition": "no_systematic_lag",
                            }
                        ],
                    },
                ],
            },
            {
                "id": "meet-gassendi",
                "segment": "p1",
                "kind": "narrative",
                "anchor": "commitment",
                "preselected": False,
                "options": [{"id": "own"}, {"id": "ask"}],
            },
            {
                "id": "name-dossier",
                "segment": "p1",
                "kind": "narrative",
                "anchor": "interpretation",
                "preselected": False,
                "options": [{"id": "cabin"}, {"id": "segment"}, {"id": "stone"}],
            },
            {
                "id": "public-bounded-claim",
                "segment": "p1",
                "kind": "evidence_judgment",
                "anchor": "interpretation",
                "runtimeAnchor": "C3-1/x1",
                "preselected": False,
                "options": [
                    {
                        "id": "bounded",
                        "isCorrect": True,
                        "supportedBy": [
                            {
                                "sourceId": "S5",
                                "field": "promptText",
                                "condition": "bounded-public-claim",
                            }
                        ],
                    },
                    {
                        "id": "earth-moves",
                        "isCorrect": False,
                        "refutedBy": [
                            {
                                "sourceId": "S5",
                                "field": "promptText",
                                "relation": "out_of_scope",
                                "condition": "earth-not-directly-measured",
                            }
                        ],
                    },
                    {
                        "id": "nothing-learned",
                        "isCorrect": False,
                        "refutedBy": [
                            {
                                "sourceId": "S5",
                                "field": "promptText",
                                "relation": "contradicts",
                                "condition": "repeatable-near-mast-fall",
                            }
                        ],
                    },
                ],
            },
        ],
        "evidenceSources": [
            {
                "id": "S5",
                "fields": [
                    {
                        "id": "promptText",
                        "locator": {
                            "scene": "C0-1",
                            "node": "s1",
                            "field": "text",
                        },
                    }
                ],
            }
        ],
    }


def make_valid_to_be_contract() -> dict:
    contract = make_valid_contract()
    contract["chapter"] = "ch7"
    contract["binding"]["targetPath"] = "greybox/data/scenes7.json"
    for beat in contract["segments"][0]["mechanicalSpine"].values():
        beat["reachable"] = False
    contract["segments"][0]["mechanicalSpine"]["success"][
        "claimRef"
    ] = "p1-concept#shared-motion"
    contract["decisionRegistry"].append(
        {
            "id": "perform-p1-operation",
            "segment": "p1",
            "kind": "operation",
            "anchor": "operation",
        }
    )
    contract["decisions"].append(
        {
            "id": "perform-p1-operation",
            "segment": "p1",
            "kind": "operation",
            "anchor": "operation",
            "preselected": False,
            "options": [{"id": "configure"}, {"id": "repeat"}],
        }
    )
    for decision in contract["decisions"]:
        if decision["kind"] == "evidence_judgment":
            decision["plannedOrdinal"] = 5
    contract["evidenceSources"][0]["fields"][0]["plannedOrdinal"] = 4
    contract["toBeReview"] = {
        "status": "REVIEW_READY",
        "packet": {
            "briefPath": "README.md",
            "briefVersion": "fixture-v1",
            "provenancePath": "decisions.md",
            "provenanceVersion": "fixture-v1",
        },
        "consistencyRows": [
            {
                "id": "p1-six-columns",
                "segment": "p1",
                "claim": {
                    "decisionId": "p1-concept",
                    "optionId": "shared-motion",
                },
                "measurement": [{"sourceId": "S5", "field": "promptText"}],
                "evidence": [{"sourceId": "S5", "field": "promptText"}],
                "refutation": [
                    {"decisionId": "p1-concept", "optionId": "small-lag"}
                ],
                "playerOperation": {"decisionId": "perform-p1-operation"},
                "success": {
                    "segment": "p1",
                    "canonicalClaim": {
                        "decisionId": "p1-concept",
                        "optionId": "shared-motion",
                    },
                },
            }
        ],
        "controlBaselines": [
            {
                "segment": "p1",
                "status": "REQUIRED",
                "source": {"sourceId": "S5", "field": "promptText"},
            }
        ],
        "staleTextScan": {
            "status": "PASS",
            "scope": ["brief", "provenance", "contract"],
            "phrases": [],
            "emptyReason": "first complete packet fixture",
        },
    }
    return contract


def issue_codes(contract: dict, repo_root: Path | None = None) -> set[str]:
    return {
        issue.code
        for issue in validate_contract(contract, repo_root=repo_root or REPO_ROOT)
    }


def to_be_issue_codes(contract: dict) -> set[str]:
    return {
        issue.code
        for issue in validate_contract(
            contract,
            repo_root=REPO_ROOT,
            to_be=True,
            brief_path=REPO_ROOT / "README.md",
            provenance_path=REPO_ROOT / "decisions.md",
        )
    }


class MechanicsGuardStructureTests(unittest.TestCase):
    def test_positive_contract_passes(self) -> None:
        self.assertEqual(validate_contract(make_valid_contract()), [])

    def test_ch7_runtime_contract_requires_registered_engine_adapter(self) -> None:
        contract_path = REPO_ROOT / (
            "03_規格/發現之前_第七章mechanics_contract_v0.1_TO-BE_Fable_20260809.json"
        )
        contract = json.loads(contract_path.read_text(encoding="utf-8"))
        self.assertEqual(validate_contract(contract), [])

        registered = ENGINE_ADAPTERS["ch7"]["adapter"]
        try:
            ENGINE_ADAPTERS["ch7"]["adapter"] = "tools/skill/before-discovery-dev/scripts/NO_ADAPTER.mjs"
            self.assertIn("ENG-01", issue_codes(contract))
        finally:
            ENGINE_ADAPTERS["ch7"]["adapter"] = registered

        drifted = copy.deepcopy(contract)
        drifted["segments"][1]["mechanicalSpine"]["success"]["_planned"] = (
            "章末主張上限＝「兩邊都對了一半。」"
        )
        self.assertIn("ENG-01", issue_codes(drifted))

    def test_runtime_anchor_must_bind_an_in_scope_choice(self) -> None:
        missing = make_valid_contract()
        missing["decisionRegistry"][-1]["runtimeAnchor"] = "C3-1/missing"
        missing["decisions"][-1]["runtimeAnchor"] = "C3-1/missing"
        self.assertIn("BIND-02", issue_codes(missing))

        outside = make_valid_contract()
        outside["decisionRegistry"][-1]["runtimeAnchor"] = "CE-1/n1"
        outside["decisions"][-1]["runtimeAnchor"] = "CE-1/n1"
        self.assertIn("DEC-01", issue_codes(outside))

    def test_spine_requires_all_reachable_ordered_beats(self) -> None:
        missing = make_valid_contract()
        del missing["segments"][0]["mechanicalSpine"]["question"]
        self.assertIn("MEC-02", issue_codes(missing))

        unreachable = make_valid_contract()
        unreachable["segments"][0]["mechanicalSpine"]["operation"][
            "reachable"
        ] = False
        self.assertIn("MEC-02", issue_codes(unreachable))

        misordered = make_valid_contract()
        misordered["segments"][0]["mechanicalSpine"]["trace"]["ordinal"] = 2
        self.assertIn("MEC-03", issue_codes(misordered))

    def test_player_authorship_failure_trace_and_commit_before_reveal(self) -> None:
        not_player = make_valid_contract()
        not_player["segments"][0]["mechanicalSpine"]["interpretation"][
            "authorship"
        ] = "npc"
        self.assertIn("MEC-04", issue_codes(not_player))

        erased_trace = make_valid_contract()
        erased_trace["segments"][0]["mechanicalSpine"]["failure"]["preserves"] = []
        self.assertIn("MEC-05", issue_codes(erased_trace))

        reveal_first = make_valid_contract()
        reveal_first["segments"][0]["commitBeforeReveal"]["reveal"] = "question"
        self.assertIn("MEC-06", issue_codes(reveal_first))

    def test_narrative_track_is_anchored_but_cannot_supply_mechanics(self) -> None:
        inference = make_valid_contract()
        inference["segments"][0]["narrativeTrack"][
            "suppliesRequiredInference"
        ] = True
        self.assertIn("MEC-07", issue_codes(inference))

        no_payment = make_valid_contract()
        no_payment["segments"][0]["narrativeTrack"]["payments"] = []
        self.assertIn("MEC-07", issue_codes(no_payment))


class EvidenceJudgmentContractTests(unittest.TestCase):
    def test_declared_registry_prevents_kind_downgrade(self) -> None:
        downgraded = make_valid_contract()
        downgraded["decisions"][0]["kind"] = "narrative"
        del downgraded["decisions"][0]["options"][1]["refutedBy"]
        codes = issue_codes(downgraded)
        self.assertIn("DEC-01", codes)
        self.assertIn("DEC-04", codes)

        undeclared = make_valid_contract()
        undeclared["decisionRegistry"] = []
        self.assertIn("DEC-01", issue_codes(undeclared))

        omitted_runtime_choice = make_valid_contract()
        omitted_runtime_choice["decisionRegistry"] = omitted_runtime_choice[
            "decisionRegistry"
        ][:-1]
        omitted_runtime_choice["decisions"] = omitted_runtime_choice["decisions"][
            :-1
        ]
        self.assertIn("DEC-01", issue_codes(omitted_runtime_choice))

    def test_preselection_is_rejected(self) -> None:
        selected = make_valid_contract()
        selected["decisions"][0]["preselected"] = True
        self.assertIn("DEC-02", issue_codes(selected))

        selected_option = make_valid_contract()
        selected_option["decisions"][0]["options"][0]["preselected"] = True
        self.assertIn("DEC-02", issue_codes(selected_option))

    def test_distractor_requires_refuted_by(self) -> None:
        missing = make_valid_contract()
        del missing["decisions"][0]["options"][1]["refutedBy"]
        self.assertIn("DEC-04", issue_codes(missing))

        missing_relation = make_valid_contract()
        del missing_relation["decisions"][0]["options"][1]["refutedBy"][0][
            "relation"
        ]
        self.assertIn("DEC-04", issue_codes(missing_relation))

        invalid_relation = make_valid_contract()
        invalid_relation["decisions"][0]["options"][1]["refutedBy"][0][
            "relation"
        ] = "sounds_wrong"
        self.assertIn("DEC-04", issue_codes(invalid_relation))

    def test_refs_require_existing_source_and_field(self) -> None:
        unknown_source = make_valid_contract()
        unknown_source["decisions"][0]["options"][1]["refutedBy"][0][
            "sourceId"
        ] = "NO-SUCH-PAPER"
        self.assertIn("DEC-05", issue_codes(unknown_source))

        unknown_field = make_valid_contract()
        unknown_field["decisions"][0]["options"][1]["refutedBy"][0][
            "field"
        ] = "invisibleColumn"
        self.assertIn("DEC-05", issue_codes(unknown_field))

    def test_evidence_field_must_be_visible_before_decision(self) -> None:
        branch_only = make_valid_contract()
        branch_only["evidenceSources"][0]["fields"][0]["locator"].update(
            {"scene": "C0-1", "node": "meet-own-reply", "field": "text"}
        )
        self.assertIn("DEC-06", issue_codes(branch_only))

        late = make_valid_contract()
        late["evidenceSources"][0]["fields"][0]["locator"].update(
            {"scene": "C3-2", "node": "x5", "field": "text"}
        )
        self.assertIn("DEC-06", issue_codes(late))


class ToBePacketContractTests(unittest.TestCase):
    def test_complete_to_be_packet_passes_without_scenes7(self) -> None:
        self.assertEqual(
            validate_contract(
                make_valid_to_be_contract(),
                repo_root=REPO_ROOT,
                to_be=True,
                brief_path=REPO_ROOT / "README.md",
                provenance_path=REPO_ROOT / "decisions.md",
            ),
            [],
        )

    def test_to_be_requires_packet_and_six_column_rows(self) -> None:
        missing = make_valid_to_be_contract()
        del missing["toBeReview"]
        self.assertIn("TB-01", to_be_issue_codes(missing))

        no_rows = make_valid_to_be_contract()
        no_rows["toBeReview"]["consistencyRows"] = []
        self.assertIn("TB-02", to_be_issue_codes(no_rows))

    def test_to_be_catches_late_evidence_and_missing_baseline(self) -> None:
        late = make_valid_to_be_contract()
        late["evidenceSources"][0]["fields"][0]["plannedOrdinal"] = 5
        self.assertIn("TB-03", to_be_issue_codes(late))

        no_baseline = make_valid_to_be_contract()
        no_baseline["toBeReview"]["controlBaselines"] = []
        self.assertIn("TB-04", to_be_issue_codes(no_baseline))

    def test_to_be_deduplicates_timing_issue_per_decision_and_field(self) -> None:
        late = make_valid_to_be_contract()
        late["evidenceSources"][0]["fields"][0]["plannedOrdinal"] = 5
        issues = validate_contract(
            late,
            repo_root=REPO_ROOT,
            to_be=True,
            brief_path=REPO_ROOT / "README.md",
            provenance_path=REPO_ROOT / "decisions.md",
        )
        timing_issues = [issue for issue in issues if issue.code == "TB-03"]
        self.assertEqual(len(timing_issues), 2)
        self.assertEqual(
            {issue.location for issue in timing_issues},
            {"$.decisions[p1-concept]", "$.decisions[public-bounded-claim]"},
        )

    def test_to_be_catches_unregistered_operation_and_success_drift(self) -> None:
        wrong_kind = make_valid_to_be_contract()
        wrong_kind["decisionRegistry"][-1]["kind"] = "experiment_commitment"
        wrong_kind["decisions"][-1]["kind"] = "experiment_commitment"
        self.assertIn("TB-05", to_be_issue_codes(wrong_kind))

        drift = make_valid_to_be_contract()
        drift["segments"][0]["mechanicalSpine"]["success"][
            "claimRef"
        ] = "p1-concept#small-lag"
        self.assertIn("TB-06", to_be_issue_codes(drift))

    def test_to_be_catches_supplied_stale_phrase(self) -> None:
        stale = make_valid_to_be_contract()
        stale["toBeReview"]["staleTextScan"]["phrases"] = ["shared-motion"]
        stale["toBeReview"]["staleTextScan"].pop("emptyReason")
        self.assertIn("TB-07", to_be_issue_codes(stale))


class RuntimeBindingAndExemptionTests(unittest.TestCase):
    def test_real_runtime_positive_fixture_passes(self) -> None:
        self.assertEqual(validate_contract(make_valid_contract(), REPO_ROOT), [])

    def test_fake_chapter_target_and_anchor_fail_closed(self) -> None:
        wrong_chapter = make_valid_contract()
        wrong_chapter["chapter"] = "ch99"
        codes = issue_codes(wrong_chapter)
        self.assertIn("MEC-01", codes)
        self.assertIn("BIND-01", codes)

        wrong_target = make_valid_contract()
        wrong_target["binding"]["targetPath"] = "greybox/data/scenes2.json"
        self.assertIn("BIND-01", issue_codes(wrong_target))

        missing_target = make_valid_contract()
        missing_target["binding"]["targetPath"] = "greybox/data/NO_SUCH_SCENES.json"
        self.assertIn("BIND-01", issue_codes(missing_target))

        missing_anchor = make_valid_contract()
        missing_anchor["segments"][0]["mechanicalSpine"]["trace"][
            "anchor"
        ] = "NO_SUCH_RUNTIME/nothing"
        self.assertIn("BIND-02", issue_codes(missing_anchor))

        unreachable_anchor = make_valid_contract()
        unreachable_anchor["segments"][0]["mechanicalSpine"]["failure"][
            "anchor"
        ] = "SC3-R1/n1"
        self.assertIn("BIND-02", issue_codes(unreachable_anchor))

    def test_evidence_locator_binds_real_node_and_json_field(self) -> None:
        missing_node = make_valid_contract()
        missing_node["evidenceSources"][0]["fields"][0]["locator"][
            "node"
        ] = "NO_SUCH_NODE"
        self.assertIn("DEC-05", issue_codes(missing_node))

        missing_json_field = make_valid_contract()
        missing_json_field["evidenceSources"][0]["fields"][0]["locator"][
            "field"
        ] = "NO_SUCH_FIELD"
        self.assertIn("DEC-05", issue_codes(missing_json_field))

        fake_source = make_valid_contract()
        fake_source["evidenceSources"][0]["id"] = "FAKE"
        for option in fake_source["decisions"][0]["options"]:
            ref_key = "supportedBy" if option["isCorrect"] else "refutedBy"
            option[ref_key][0]["sourceId"] = "FAKE"
        self.assertIn("DEC-05", issue_codes(fake_source))

    def test_reported_all_fake_zero_decision_attack_returns_failures(self) -> None:
        attack = make_valid_contract()
        for beat in attack["segments"][0]["mechanicalSpine"].values():
            beat["anchor"] = "NO_SUCH_RUNTIME/nope"
        attack["decisionRegistry"] = []
        attack["decisions"] = []
        attack["evidenceSources"] = []
        codes = issue_codes(attack)
        self.assertIn("BIND-02", codes)
        self.assertIn("DEC-07", codes)

    def test_zero_decision_requires_validated_not_applicable(self) -> None:
        no_decisions = make_valid_contract()
        no_decisions["decisionRegistry"] = []
        no_decisions["decisions"] = []
        no_decisions["evidenceSources"] = []
        self.assertIn("DEC-07", issue_codes(no_decisions))

        fake_exemption = copy.deepcopy(no_decisions)
        fake_exemption["decisionExemption"] = {
            "status": "NOT_APPLICABLE",
            "reason": "none",
            "decisionOwner": "director",
            "scopeSegments": ["p1"],
            "basis": {
                "targetPath": "NO_SUCH_FILE.md",
                "locator": "NO_DECISIONS",
            },
        }
        self.assertIn("DEC-07", issue_codes(fake_exemption))

    def test_validated_not_applicable_passes_only_without_player_actions(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            runtime_path = repo_root / "greybox/data/scenes3.json"
            runtime_path.parent.mkdir(parents=True)
            nodes = []
            beat_names = (
                "question",
                "commitment",
                "operation",
                "trace",
                "interpretation",
                "resistance",
                "success",
                "failure",
            )
            for index, name in enumerate(beat_names):
                node = {
                    "id": name,
                    "type": "line",
                    "speaker": (
                        "旅人(你)"
                        if name in {"commitment", "operation", "interpretation"}
                        else "stage"
                    ),
                    "text": name,
                }
                if index + 1 < len(beat_names):
                    node["next"] = beat_names[index + 1]
                if name in {"commitment", "operation", "interpretation"}:
                    node["playerAuthored"] = True
                nodes.append(node)
            runtime_path.write_text(
                json.dumps(
                    {
                        "chapter": "ch3",
                        "startScene": "S1",
                        "scenes": [{"id": "S1", "nodes": nodes}],
                    }
                ),
                encoding="utf-8",
            )
            (repo_root / "basis.md").write_text(
                "DESIGN GATE: NO_DECISIONS_APPROVED",
                encoding="utf-8",
            )
            contract = make_valid_contract()
            contract["binding"]["targetPath"] = "greybox/data/scenes3.json"
            for ordinal, name in enumerate(beat_names, start=1):
                contract["segments"][0]["mechanicalSpine"][name][
                    "anchor"
                ] = f"S1/{name}"
                contract["segments"][0]["mechanicalSpine"][name][
                    "ordinal"
                ] = ordinal
            contract["decisionRegistry"] = []
            contract["decisions"] = []
            contract["evidenceSources"] = []
            contract["decisionExemption"] = {
                "status": "NOT_APPLICABLE",
                "reason": "This scoped linear interlude contains no player decision.",
                "decisionOwner": "director",
                "scopeSegments": ["p1"],
                "basis": {
                    "targetPath": "basis.md",
                    "locator": "NO_DECISIONS_APPROVED",
                },
            }
            self.assertEqual(validate_contract(contract, repo_root), [])

            nodes[2]["type"] = "choice"
            nodes[2]["options"] = [{"id": "go", "text": "go", "next": "trace"}]
            nodes[2].pop("next", None)
            runtime_path.write_text(
                json.dumps(
                    {
                        "chapter": "ch3",
                        "startScene": "S1",
                        "scenes": [{"id": "S1", "nodes": nodes}],
                    }
                ),
                encoding="utf-8",
            )
            self.assertIn("DEC-07", issue_codes(contract, repo_root))


class MechanicsGuardCliTests(unittest.TestCase):
    def run_contract(
        self,
        contract: dict,
        *,
        to_be: bool = False,
    ) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "contract.json"
            path.write_text(
                json.dumps(contract, ensure_ascii=False),
                encoding="utf-8",
            )
            command = [sys.executable, str(GUARD_PATH), "--contract", str(path)]
            if to_be:
                command.extend(
                    [
                        "--to-be",
                        "--brief",
                        str(REPO_ROOT / "README.md"),
                        "--provenance",
                        str(REPO_ROOT / "decisions.md"),
                    ]
                )
            return subprocess.run(
                command,
                check=False,
                capture_output=True,
                text=True,
            )

    def test_cli_pass_and_manual_boundary(self) -> None:
        result = self.run_contract(make_valid_contract())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("MECHANICS_CONTRACT: PASS", result.stdout)
        self.assertIn("MANUAL:", result.stdout)
        self.assertIn("distractor plausibility", result.stdout)

    def test_cli_negative_fixture_returns_two(self) -> None:
        contract = copy.deepcopy(make_valid_contract())
        contract["decisions"][0]["options"][1]["refutedBy"] = []
        result = self.run_contract(contract)
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("DEC-04", result.stdout)

    def test_cli_fake_anchor_and_zero_decision_attack_returns_two(self) -> None:
        contract = make_valid_contract()
        for beat in contract["segments"][0]["mechanicalSpine"].values():
            beat["anchor"] = "NO_SUCH_RUNTIME/nope"
        contract["decisionRegistry"] = []
        contract["decisions"] = []
        contract["evidenceSources"] = []
        result = self.run_contract(contract)
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("BIND-02", result.stdout)
        self.assertIn("DEC-07", result.stdout)

    def test_cli_branch_only_and_late_evidence_return_two(self) -> None:
        for scene, node in (
            ("C0-1", "meet-own-reply"),
            ("C3-2", "x5"),
        ):
            with self.subTest(scene=scene, node=node):
                contract = make_valid_contract()
                contract["evidenceSources"][0]["fields"][0]["locator"].update(
                    {"scene": scene, "node": node, "field": "text"}
                )
                result = self.run_contract(contract)
                self.assertEqual(
                    result.returncode,
                    2,
                    result.stdout + result.stderr,
                )
                self.assertIn("DEC-06", result.stdout)

    def test_cli_invalid_json_returns_one(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "broken.json"
            path.write_text("{", encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(GUARD_PATH), "--contract", str(path)],
                check=False,
                capture_output=True,
                text=True,
            )
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("MECHANICS_INPUT_ERROR", result.stdout)

    def test_cli_to_be_passes_without_runtime_target(self) -> None:
        result = self.run_contract(make_valid_to_be_contract(), to_be=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("TO_BE_CONTRACT: PASS", result.stdout)
        self.assertIn("does not prove runtime reachability", result.stdout)


if __name__ == "__main__":
    unittest.main()
