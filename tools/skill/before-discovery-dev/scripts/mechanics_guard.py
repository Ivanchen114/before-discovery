#!/usr/bin/env python3
"""Structural guard for inquiry mechanics and evidence-judgment contracts.

The guard checks declared structure only. It deliberately cannot judge whether
an option is plausible, evidence is scientifically sufficient, or dialogue is
dramatically effective.
"""

from __future__ import annotations

import argparse
import json
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable


SCHEMA_VERSION = 2
REPO_ROOT = Path(__file__).resolve().parents[4]
CHAPTERS = {"ch1", "ch2", "ch3", "ch4", "ch5", "ch6"}
CANONICAL_SCENES_TARGETS = {
    "ch1": Path("greybox/data/scenes.json"),
    "ch2": Path("greybox/data/scenes2.json"),
    "ch3": Path("greybox/data/scenes3.json"),
    "ch4": Path("greybox/data/scenes4.json"),
    "ch5": Path("greybox/data/scenes5.json"),
    "ch6": Path("greybox/data/scenes6.json"),
}
BEATS = (
    "question",
    "commitment",
    "operation",
    "trace",
    "interpretation",
    "resistance",
    "success",
    "failure",
)
PLAYER_BEATS = {"commitment", "operation", "interpretation"}
ORDERED_BEATS = BEATS[:6]
AUTHORSHIPS = {"player", "npc", "world", "system"}
DECISION_KINDS = {
    "evidence_judgment",
    "experiment_commitment",
    "operation",
    "relationship",
    "navigation",
    "narrative",
}
REFUTATION_RELATIONS = {
    "contradicts",
    "confounded",
    "out_of_scope",
    "insufficient",
}
PAYMENT_PURPOSES = {
    "motive",
    "character_response",
    "relationship_change",
    "historical_stakes",
    "pressure",
}


class MechanicsInputError(ValueError):
    """Raised when a mechanics contract cannot be parsed."""


@dataclass(frozen=True)
class Issue:
    code: str
    location: str
    message: str

    def render(self) -> str:
        return f"{self.code} {self.location}: {self.message}"


@dataclass
class ContractIndex:
    segments: dict[str, dict[str, Any]]
    segment_ordinals: dict[str, int]
    beats: dict[str, dict[str, dict[str, Any]]]
    beat_nodes: dict[str, dict[str, tuple[str, str]]]
    registry: dict[str, dict[str, Any]]
    evidence: dict[str, dict[str, dict[str, Any]]]
    evidence_nodes: dict[tuple[str, str], tuple[str, str]]
    runtime: RuntimeBinding | None
    repo_root: Path


@dataclass
class RuntimeBinding:
    target_path: Path
    chapter: str
    nodes: dict[tuple[str, str], dict[str, Any]]
    edges: dict[tuple[str, str], set[tuple[str, str]]]
    reachable: set[tuple[str, str]]
    dominators: dict[tuple[str, str], set[tuple[str, str]]]

    def resolve_anchor(self, anchor: Any) -> tuple[str, str] | None:
        if not _string(anchor) or "/" not in anchor:
            return None
        scene_id, node_id = anchor.split("/", 1)
        key = (scene_id, node_id)
        return key if key in self.nodes else None

    def dominates(
        self,
        earlier: tuple[str, str],
        later: tuple[str, str],
    ) -> bool:
        return (
            earlier != later
            and later in self.reachable
            and earlier in self.dominators.get(later, set())
        )

    def descendants(self, start: tuple[str, str]) -> set[tuple[str, str]]:
        seen: set[tuple[str, str]] = set()
        queue = deque([start])
        while queue:
            node = queue.popleft()
            if node in seen:
                continue
            seen.add(node)
            queue.extend(self.edges.get(node, set()) - seen)
        return seen

    def ancestors(self, end: tuple[str, str]) -> set[tuple[str, str]]:
        reverse: dict[tuple[str, str], set[tuple[str, str]]] = {
            key: set() for key in self.nodes
        }
        for source, targets in self.edges.items():
            for target in targets:
                reverse.setdefault(target, set()).add(source)
        seen: set[tuple[str, str]] = set()
        queue = deque([end])
        while queue:
            node = queue.popleft()
            if node in seen:
                continue
            seen.add(node)
            queue.extend(reverse.get(node, set()) - seen)
        return seen


def _string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _positive_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def _decision_runtime_node(
    decision: dict[str, Any],
    index: ContractIndex,
) -> tuple[str, str] | None:
    """Resolve a decision's exact node without forcing every choice to be a spine beat."""
    if index.runtime is not None and _string(decision.get("runtimeAnchor")):
        return index.runtime.resolve_anchor(decision["runtimeAnchor"])
    return index.beat_nodes.get(decision.get("segment"), {}).get(
        decision.get("anchor")
    )


def load_contract(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise MechanicsInputError(f"cannot read mechanics contract: {exc}") from exc
    if not isinstance(data, dict):
        raise MechanicsInputError("mechanics contract root must be a JSON object")
    return data


def _repo_path(
    repo_root: Path,
    raw_path: Any,
) -> Path | None:
    if not _string(raw_path):
        return None
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = repo_root / candidate
    try:
        resolved = candidate.resolve()
        resolved.relative_to(repo_root)
    except (OSError, ValueError):
        return None
    return resolved


def _load_runtime_binding(
    contract: dict[str, Any],
    repo_root: Path,
    add: Callable[[str, str, str], None],
) -> RuntimeBinding | None:
    binding = contract.get("binding")
    if not isinstance(binding, dict):
        add(
            "BIND-01",
            "$.binding",
            "must bind the contract to a real targetPath and targetFormat",
        )
        return None
    if binding.get("targetFormat") != "scenes-json":
        add(
            "BIND-01",
            "$.binding.targetFormat",
            "only scenes-json has a fail-closed runtime adapter",
        )
        return None
    target_path = _repo_path(repo_root, binding.get("targetPath"))
    if target_path is None or not target_path.is_file():
        add(
            "BIND-01",
            "$.binding.targetPath",
            "must be an existing file inside the repository",
        )
        return None
    expected_relative = CANONICAL_SCENES_TARGETS.get(contract.get("chapter"))
    if (
        expected_relative is not None
        and target_path != (repo_root / expected_relative).resolve()
    ):
        add(
            "BIND-01",
            "$.binding.targetPath",
            f"must bind {contract.get('chapter')} to canonical "
            f"{expected_relative.as_posix()}",
        )
    try:
        runtime_data = json.loads(target_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        add("BIND-01", "$.binding.targetPath", f"cannot parse target JSON: {exc}")
        return None
    if not isinstance(runtime_data, dict):
        add("BIND-01", "$.binding.targetPath", "target JSON must be an object")
        return None

    target_chapter = runtime_data.get("chapter")
    if target_chapter is None:
        canonical_names = {"scenes.json": "ch1"}
        target_chapter = canonical_names.get(target_path.name)
    if target_chapter not in CHAPTERS:
        add(
            "BIND-01",
            "$.binding.targetPath",
            "target must declare a supported chapter (canonical scenes.json implies ch1)",
        )
        return None
    if target_chapter != contract.get("chapter"):
        add(
            "BIND-01",
            "$.binding.targetPath",
            f"target chapter {target_chapter!r} does not match contract chapter "
            f"{contract.get('chapter')!r}",
        )

    raw_scenes = runtime_data.get("scenes")
    if not isinstance(raw_scenes, list) or not raw_scenes:
        add("BIND-01", "$.binding.targetPath", "target must contain a scenes array")
        return None

    nodes: dict[tuple[str, str], dict[str, Any]] = {}
    scene_entries: dict[str, tuple[str, str]] = {}
    for scene_index, scene in enumerate(raw_scenes):
        location = f"{target_path}:scenes[{scene_index}]"
        if not isinstance(scene, dict) or not _string(scene.get("id")):
            add("BIND-01", location, "scene must be an object with a string id")
            continue
        scene_id = scene["id"]
        raw_nodes = scene.get("nodes")
        if not isinstance(raw_nodes, list) or not raw_nodes:
            add("BIND-01", location, "scene must contain at least one node")
            continue
        for node_index, node in enumerate(raw_nodes):
            node_location = f"{location}.nodes[{node_index}]"
            if not isinstance(node, dict) or not _string(node.get("id")):
                add("BIND-01", node_location, "node must have a string id")
                continue
            key = (scene_id, node["id"])
            if key in nodes:
                add("BIND-01", node_location, f"duplicate node anchor {key!r}")
                continue
            nodes[key] = node
            scene_entries.setdefault(scene_id, key)

    edges: dict[tuple[str, str], set[tuple[str, str]]] = {
        key: set() for key in nodes
    }
    for key, node in nodes.items():
        raw_targets: list[tuple[str, str]] = []
        if _string(node.get("next")):
            raw_targets.append((key[0], node["next"]))
        options = node.get("options")
        if isinstance(options, list):
            for option in options:
                if isinstance(option, dict) and _string(option.get("next")):
                    raw_targets.append((key[0], option["next"]))
        if node.get("type") == "goto":
            target_scene = node.get("scene")
            target_entry = scene_entries.get(target_scene)
            if target_entry is None:
                add(
                    "BIND-01",
                    f"{target_path}:{key[0]}/{key[1]}",
                    f"goto references unknown or empty scene {target_scene!r}",
                )
            else:
                raw_targets.append(target_entry)
        for target in raw_targets:
            if target not in nodes:
                add(
                    "BIND-01",
                    f"{target_path}:{key[0]}/{key[1]}",
                    f"edge references unknown node {target[0]}/{target[1]}",
                )
            else:
                edges[key].add(target)

    start_scene = runtime_data.get("startScene")
    start = scene_entries.get(start_scene)
    if start is None:
        add(
            "BIND-01",
            "$.binding.targetPath",
            f"startScene {start_scene!r} is missing or empty",
        )
        return None

    reachable: set[tuple[str, str]] = set()
    queue = deque([start])
    while queue:
        node = queue.popleft()
        if node in reachable:
            continue
        reachable.add(node)
        queue.extend(edges.get(node, set()) - reachable)

    predecessors: dict[tuple[str, str], set[tuple[str, str]]] = {
        key: set() for key in reachable
    }
    for source in reachable:
        for target in edges.get(source, set()):
            if target in reachable:
                predecessors[target].add(source)
    dominators = {node: set(reachable) for node in reachable}
    dominators[start] = {start}
    changed = True
    while changed:
        changed = False
        for node in reachable - {start}:
            incoming = predecessors[node]
            if not incoming:
                new_value = {node}
            else:
                intersection = set(reachable)
                for predecessor in incoming:
                    intersection &= dominators[predecessor]
                new_value = {node} | intersection
            if new_value != dominators[node]:
                dominators[node] = new_value
                changed = True

    return RuntimeBinding(
        target_path=target_path,
        chapter=target_chapter,
        nodes=nodes,
        edges=edges,
        reachable=reachable,
        dominators=dominators,
    )


def validate_contract(
    data: dict[str, Any],
    repo_root: Path | None = None,
) -> list[Issue]:
    """Return every deterministic structural violation."""

    issues: list[Issue] = []

    def add(code: str, location: str, message: str) -> None:
        issues.append(Issue(code, location, message))

    if data.get("schema_version") != SCHEMA_VERSION:
        add("MEC-01", "$.schema_version", f"must equal {SCHEMA_VERSION}")
    if data.get("chapter") not in CHAPTERS:
        add("MEC-01", "$.chapter", "must be one of ch1, ch2, ch3, ch4, ch5, ch6")

    resolved_root = (repo_root or REPO_ROOT).resolve()
    runtime = _load_runtime_binding(data, resolved_root, add)
    segments, segment_ordinals, beats, beat_nodes = _index_segments(
        data,
        runtime,
        add,
    )
    registry = _index_registry(data, segments, beats, add)
    evidence, evidence_nodes = _index_evidence(data, runtime, add)
    index = ContractIndex(
        segments,
        segment_ordinals,
        beats,
        beat_nodes,
        registry,
        evidence,
        evidence_nodes,
        runtime,
        resolved_root,
    )
    _validate_decisions(data, index, add)
    return issues


def _index_segments(
    data: dict[str, Any],
    runtime: RuntimeBinding | None,
    add: Callable[[str, str, str], None],
) -> tuple[
    dict[str, dict[str, Any]],
    dict[str, int],
    dict[str, dict[str, dict[str, Any]]],
    dict[str, dict[str, tuple[str, str]]],
]:
    raw_segments = data.get("segments")
    if not isinstance(raw_segments, list) or not raw_segments:
        add("MEC-01", "$.segments", "must be a non-empty array")
        return {}, {}, {}, {}

    segments: dict[str, dict[str, Any]] = {}
    ordinals: dict[str, int] = {}
    beats_by_segment: dict[str, dict[str, dict[str, Any]]] = {}
    beat_nodes_by_segment: dict[str, dict[str, tuple[str, str]]] = {}
    used_ordinals: dict[int, str] = {}

    for index, segment in enumerate(raw_segments):
        loc = f"$.segments[{index}]"
        if not isinstance(segment, dict):
            add("MEC-01", loc, "must be an object")
            continue
        segment_id = segment.get("id")
        if not _string(segment_id):
            add("MEC-01", f"{loc}.id", "must be a non-empty string")
            continue
        segment_id = segment_id.strip()
        if segment_id in segments:
            add("MEC-01", f"{loc}.id", f"duplicate segment id {segment_id!r}")
            continue
        segments[segment_id] = segment

        ordinal = segment.get("ordinal")
        if not _positive_int(ordinal):
            add("MEC-02", f"{loc}.ordinal", "must be a positive integer")
        elif ordinal in used_ordinals:
            add(
                "MEC-02",
                f"{loc}.ordinal",
                f"duplicates segment ordinal used by {used_ordinals[ordinal]!r}",
            )
        else:
            ordinals[segment_id] = ordinal
            used_ordinals[ordinal] = segment_id

        spine = segment.get("mechanicalSpine")
        if not isinstance(spine, dict):
            add("MEC-02", f"{loc}.mechanicalSpine", "must be an object")
            spine = {}
        beats: dict[str, dict[str, Any]] = {}
        beat_nodes: dict[str, tuple[str, str]] = {}
        used_anchors: dict[str, str] = {}
        for beat_name in BEATS:
            beat_loc = f"{loc}.mechanicalSpine.{beat_name}"
            beat = spine.get(beat_name)
            if not isinstance(beat, dict):
                add("MEC-02", beat_loc, "required beat must be an object")
                continue
            beats[beat_name] = beat
            anchor = beat.get("anchor")
            if not _string(anchor):
                add("MEC-02", f"{beat_loc}.anchor", "must be a non-empty string")
            elif anchor in used_anchors:
                add(
                    "MEC-02",
                    f"{beat_loc}.anchor",
                    f"already used by beat {used_anchors[anchor]!r}",
                )
            else:
                used_anchors[anchor] = beat_name
            if _string(anchor) and runtime is not None:
                runtime_node = runtime.resolve_anchor(anchor)
                if runtime_node is None:
                    add(
                        "BIND-02",
                        f"{beat_loc}.anchor",
                        f"does not exist in {runtime.target_path}",
                    )
                elif runtime_node not in runtime.reachable:
                    add(
                        "BIND-02",
                        f"{beat_loc}.anchor",
                        "exists but is unreachable from target startScene",
                    )
                else:
                    beat_nodes[beat_name] = runtime_node
            if not _positive_int(beat.get("ordinal")):
                add("MEC-02", f"{beat_loc}.ordinal", "must be a positive integer")
            if beat.get("reachable") is not True:
                add("MEC-02", f"{beat_loc}.reachable", "must be explicitly true")
            authorship = beat.get("authorship")
            if authorship not in AUTHORSHIPS:
                add(
                    "MEC-02",
                    f"{beat_loc}.authorship",
                    "must be one of player, npc, world, system",
                )
            elif beat_name in PLAYER_BEATS and authorship != "player":
                add(
                    "MEC-04",
                    f"{beat_loc}.authorship",
                    f"{beat_name} must be authored by the player",
                )
            if (
                runtime is not None
                and beat_name in PLAYER_BEATS
                and beat_name in beat_nodes
                and not _runtime_player_authored(runtime.nodes[beat_nodes[beat_name]])
            ):
                add(
                    "BIND-04",
                    f"{beat_loc}.anchor",
                    "bound runtime node is not a choice/embed or Traveler line",
                )
        beats_by_segment[segment_id] = beats
        beat_nodes_by_segment[segment_id] = beat_nodes

        for earlier, later in zip(ORDERED_BEATS, ORDERED_BEATS[1:]):
            _require_before(beats, earlier, later, f"{loc}.mechanicalSpine", add)
        for outcome in ("success", "failure"):
            _require_before(
                beats,
                "resistance",
                outcome,
                f"{loc}.mechanicalSpine",
                add,
            )
        if runtime is not None:
            for earlier, later in zip(ORDERED_BEATS, ORDERED_BEATS[1:]):
                _require_runtime_before(
                    runtime,
                    beat_nodes,
                    earlier,
                    later,
                    f"{loc}.mechanicalSpine",
                    add,
                )
            for outcome in ("success", "failure"):
                _require_runtime_before(
                    runtime,
                    beat_nodes,
                    "resistance",
                    outcome,
                    f"{loc}.mechanicalSpine",
                    add,
                )

        failure = beats.get("failure", {})
        if "trace" not in failure.get("preserves", []):
            add(
                "MEC-05",
                f"{loc}.mechanicalSpine.failure.preserves",
                "failure must preserve the trace beat",
            )
        _validate_commit_rule(segment, beats, beat_nodes, runtime, loc, add)
        _validate_narrative_track(segment, beats, loc, add)

    return segments, ordinals, beats_by_segment, beat_nodes_by_segment


def _require_before(
    beats: dict[str, dict[str, Any]],
    earlier: str,
    later: str,
    location: str,
    add: Callable[[str, str, str], None],
) -> None:
    left = beats.get(earlier, {}).get("ordinal")
    right = beats.get(later, {}).get("ordinal")
    if _positive_int(left) and _positive_int(right) and left >= right:
        add(
            "MEC-03",
            f"{location}.{later}.ordinal",
            f"{earlier} must occur before {later}",
        )


def _runtime_player_authored(node: dict[str, Any]) -> bool:
    return (
        node.get("type") in {"choice", "embed"}
        or node.get("playerAuthored") is True
    )


def _require_runtime_before(
    runtime: RuntimeBinding,
    beat_nodes: dict[str, tuple[str, str]],
    earlier: str,
    later: str,
    location: str,
    add: Callable[[str, str, str], None],
) -> None:
    earlier_node = beat_nodes.get(earlier)
    later_node = beat_nodes.get(later)
    if (
        earlier_node is not None
        and later_node is not None
        and not runtime.dominates(earlier_node, later_node)
    ):
        add(
            "BIND-03",
            f"{location}.{later}.anchor",
            f"runtime graph cannot prove {earlier} occurs on every path before {later}",
        )


def _validate_commit_rule(
    segment: dict[str, Any],
    beats: dict[str, dict[str, Any]],
    beat_nodes: dict[str, tuple[str, str]],
    runtime: RuntimeBinding | None,
    location: str,
    add: Callable[[str, str, str], None],
) -> None:
    rule = segment.get("commitBeforeReveal")
    if not isinstance(rule, dict):
        add(
            "MEC-06",
            f"{location}.commitBeforeReveal",
            "must declare commitment and reveal beat references",
        )
        return
    if rule.get("commitment") != "commitment":
        add(
            "MEC-06",
            f"{location}.commitBeforeReveal.commitment",
            "must reference the required commitment beat",
        )
    reveal = rule.get("reveal")
    if reveal not in beats:
        add(
            "MEC-06",
            f"{location}.commitBeforeReveal.reveal",
            "must reference an existing beat",
        )
        return
    commitment_ordinal = beats.get("commitment", {}).get("ordinal")
    reveal_ordinal = beats[reveal].get("ordinal")
    if (
        _positive_int(commitment_ordinal)
        and _positive_int(reveal_ordinal)
        and commitment_ordinal >= reveal_ordinal
    ):
        add(
            "MEC-06",
            f"{location}.commitBeforeReveal",
            "commitment must occur before the declared reveal beat",
        )
    commitment_node = beat_nodes.get("commitment")
    reveal_node = beat_nodes.get(reveal)
    if (
        runtime is not None
        and commitment_node is not None
        and reveal_node is not None
        and not runtime.dominates(commitment_node, reveal_node)
    ):
        add(
            "BIND-03",
            f"{location}.commitBeforeReveal",
            "runtime graph cannot prove commitment dominates the reveal",
        )


def _validate_narrative_track(
    segment: dict[str, Any],
    beats: dict[str, dict[str, Any]],
    location: str,
    add: Callable[[str, str, str], None],
) -> None:
    track = segment.get("narrativeTrack")
    if not isinstance(track, dict):
        add("MEC-07", f"{location}.narrativeTrack", "must be an object")
        return
    for field in (
        "suppliesRequiredInference",
        "suppliesMissingOperation",
        "suppliesControlInstruction",
    ):
        if track.get(field) is not False:
            add(
                "MEC-07",
                f"{location}.narrativeTrack.{field}",
                "must be explicitly false",
            )
    payments = track.get("payments")
    if not isinstance(payments, list) or not payments:
        add(
            "MEC-07",
            f"{location}.narrativeTrack.payments",
            "must contain at least one anchored narrative payment",
        )
        return
    for index, payment in enumerate(payments):
        loc = f"{location}.narrativeTrack.payments[{index}]"
        if not isinstance(payment, dict):
            add("MEC-07", loc, "must be an object")
            continue
        if not _string(payment.get("id")):
            add("MEC-07", f"{loc}.id", "must be a non-empty string")
        if payment.get("anchor") not in beats:
            add(
                "MEC-07",
                f"{loc}.anchor",
                "must reference a reachable mechanical-spine beat",
            )
        if payment.get("purpose") not in PAYMENT_PURPOSES:
            add("MEC-07", f"{loc}.purpose", "must be a narrative-payment purpose")


def _index_registry(
    data: dict[str, Any],
    segments: dict[str, dict[str, Any]],
    beats: dict[str, dict[str, dict[str, Any]]],
    add: Callable[[str, str, str], None],
) -> dict[str, dict[str, Any]]:
    raw_registry = data.get("decisionRegistry")
    if not isinstance(raw_registry, list):
        add("DEC-01", "$.decisionRegistry", "must be an array")
        return {}
    registry: dict[str, dict[str, Any]] = {}
    for index, entry in enumerate(raw_registry):
        loc = f"$.decisionRegistry[{index}]"
        if not isinstance(entry, dict) or not _string(entry.get("id")):
            add("DEC-01", loc, "must be an object with a non-empty id")
            continue
        decision_id = entry["id"].strip()
        if decision_id in registry:
            add("DEC-01", f"{loc}.id", f"duplicate decision id {decision_id!r}")
            continue
        registry[decision_id] = entry
        if entry.get("kind") not in DECISION_KINDS:
            add("DEC-01", f"{loc}.kind", "must be a supported decision kind")
        segment_id = entry.get("segment")
        if segment_id not in segments:
            add("DEC-01", f"{loc}.segment", "must reference an existing segment")
        elif entry.get("anchor") not in beats.get(segment_id, {}):
            add("DEC-01", f"{loc}.anchor", "must reference a beat in the segment")
    return registry


def _index_evidence(
    data: dict[str, Any],
    runtime: RuntimeBinding | None,
    add: Callable[[str, str, str], None],
) -> tuple[
    dict[str, dict[str, dict[str, Any]]],
    dict[tuple[str, str], tuple[str, str]],
]:
    raw_sources = data.get("evidenceSources")
    if not isinstance(raw_sources, list):
        add("DEC-05", "$.evidenceSources", "must be an array")
        return {}, {}
    evidence: dict[str, dict[str, dict[str, Any]]] = {}
    evidence_nodes: dict[tuple[str, str], tuple[str, str]] = {}
    for source_index, source in enumerate(raw_sources):
        loc = f"$.evidenceSources[{source_index}]"
        if not isinstance(source, dict) or not _string(source.get("id")):
            add("DEC-05", loc, "must be an object with a non-empty id")
            continue
        source_id = source["id"].strip()
        if source_id in evidence:
            add("DEC-05", f"{loc}.id", f"duplicate source id {source_id!r}")
            continue
        fields: dict[str, dict[str, Any]] = {}
        raw_fields = source.get("fields")
        if not isinstance(raw_fields, list) or not raw_fields:
            add("DEC-05", f"{loc}.fields", "must be a non-empty array")
            raw_fields = []
        for field_index, field in enumerate(raw_fields):
            field_loc = f"{loc}.fields[{field_index}]"
            if not isinstance(field, dict) or not _string(field.get("id")):
                add("DEC-05", field_loc, "must be an object with a non-empty id")
                continue
            field_id = field["id"].strip()
            if field_id in fields:
                add("DEC-05", f"{field_loc}.id", f"duplicate field id {field_id!r}")
                continue
            fields[field_id] = field
            locator = field.get("locator")
            if not isinstance(locator, dict):
                add(
                    "DEC-05",
                    f"{field_loc}.locator",
                    "must bind scene, node, and JSON field in targetPath",
                )
                continue
            scene_id = locator.get("scene")
            node_id = locator.get("node")
            json_field = locator.get("field")
            if not all(_string(value) for value in (scene_id, node_id, json_field)):
                add(
                    "DEC-05",
                    f"{field_loc}.locator",
                    "scene, node, and field must be non-empty strings",
                )
                continue
            if runtime is None:
                continue
            runtime_node = runtime.resolve_anchor(f"{scene_id}/{node_id}")
            if runtime_node is None:
                add(
                    "DEC-05",
                    f"{field_loc}.locator",
                    "references an unknown runtime scene/node",
                )
            elif runtime_node not in runtime.reachable:
                add(
                    "DEC-06",
                    f"{field_loc}.locator",
                    "evidence source exists but is unreachable from target startScene",
                )
            elif json_field not in runtime.nodes[runtime_node]:
                add(
                    "DEC-05",
                    f"{field_loc}.locator.field",
                    f"runtime node has no JSON field {json_field!r}",
                )
            else:
                evidence_nodes[(source_id, field_id)] = runtime_node
                if not _node_grants_evidence(
                    runtime.nodes[runtime_node],
                    source_id,
                ):
                    add(
                        "DEC-05",
                        f"{field_loc}.locator",
                        f"runtime node does not grant evidence id {source_id!r}",
                    )
        evidence[source_id] = fields
    return evidence, evidence_nodes


def _node_grants_evidence(node: dict[str, Any], source_id: str) -> bool:
    effects: list[Any] = []
    if isinstance(node.get("effects"), list):
        effects.extend(node["effects"])
    if isinstance(node.get("options"), list):
        for option in node["options"]:
            if isinstance(option, dict) and isinstance(option.get("effects"), list):
                effects.extend(option["effects"])
    return any(
        isinstance(effect, dict) and effect.get("evidence") == source_id
        for effect in effects
    )


def _validate_decisions(
    data: dict[str, Any],
    index: ContractIndex,
    add: Callable[[str, str, str], None],
) -> None:
    raw_decisions = data.get("decisions")
    if not isinstance(raw_decisions, list):
        add("DEC-01", "$.decisions", "must be an array")
        raw_decisions = []
    _validate_decision_exemption(data, raw_decisions, index, add)
    seen: set[str] = set()
    for decision_index, decision in enumerate(raw_decisions):
        loc = f"$.decisions[{decision_index}]"
        if not isinstance(decision, dict) or not _string(decision.get("id")):
            add("DEC-01", loc, "must be an object with a non-empty id")
            continue
        decision_id = decision["id"].strip()
        if decision_id in seen:
            add("DEC-01", f"{loc}.id", f"duplicate decision id {decision_id!r}")
            continue
        seen.add(decision_id)
        declared = index.registry.get(decision_id)
        if declared is None:
            add("DEC-01", f"{loc}.id", "is not declared in decisionRegistry")
        else:
            for field in ("kind", "segment", "anchor", "runtimeAnchor"):
                if decision.get(field) != declared.get(field):
                    add(
                        "DEC-01",
                        f"{loc}.{field}",
                        f"must match decisionRegistry value {declared.get(field)!r}",
                    )
        if decision.get("preselected") is not False:
            add("DEC-02", f"{loc}.preselected", "must be explicitly false")

        segment_id = decision.get("segment")
        anchor = decision.get("anchor")
        beat = index.beats.get(segment_id, {}).get(anchor)
        if beat is None:
            add("DEC-01", f"{loc}.anchor", "must reference a beat in the segment")
        elif beat.get("reachable") is not True or beat.get("authorship") != "player":
            add(
                "DEC-01",
                f"{loc}.anchor",
                "must reference a reachable player-authored beat",
            )
        runtime_node = _decision_runtime_node(decision, index)
        if index.runtime is not None and _string(decision.get("runtimeAnchor")):
            if runtime_node is None:
                add(
                    "BIND-02",
                    f"{loc}.runtimeAnchor",
                    "does not name a node in the canonical scenes target",
                )
            elif runtime_node not in index.runtime.reachable:
                add(
                    "BIND-02",
                    f"{loc}.runtimeAnchor",
                    "exists but is unreachable from target startScene",
                )
            else:
                if index.runtime.nodes[runtime_node].get("type") != "choice":
                    add(
                        "BIND-04",
                        f"{loc}.runtimeAnchor",
                        "must bind the exact runtime choice node",
                    )
                beat_nodes = index.beat_nodes.get(segment_id, {})
                question_node = beat_nodes.get("question")
                outcome_nodes = [
                    beat_nodes.get("success"),
                    beat_nodes.get("failure"),
                ]
                if question_node is not None and all(outcome_nodes):
                    in_scope = runtime_node in index.runtime.descendants(question_node)
                    in_scope = in_scope and any(
                        runtime_node in index.runtime.ancestors(outcome)
                        for outcome in outcome_nodes
                        if outcome is not None
                    )
                    if not in_scope:
                        add(
                            "DEC-01",
                            f"{loc}.runtimeAnchor",
                            "must lie on a question-to-outcome path in its segment",
                        )
        if (
            index.runtime is not None
            and runtime_node is not None
            and not _runtime_player_authored(index.runtime.nodes[runtime_node])
        ):
            add(
                "BIND-04",
                (
                    f"{loc}.runtimeAnchor"
                    if _string(decision.get("runtimeAnchor"))
                    else f"{loc}.anchor"
                ),
                "bound runtime decision node is not player-authored",
            )

        options = decision.get("options")
        if not isinstance(options, list) or not options:
            add("DEC-03", f"{loc}.options", "must be a non-empty array")
            options = []
        is_evidence = declared is not None and declared.get("kind") == "evidence_judgment"
        correct = distractors = 0
        if is_evidence and len(options) < 2:
            add("DEC-03", f"{loc}.options", "needs at least two options")
        option_ids: set[str] = set()
        for option_index, option in enumerate(options):
            option_loc = f"{loc}.options[{option_index}]"
            if not isinstance(option, dict) or not _string(option.get("id")):
                add("DEC-03", option_loc, "must be an object with a non-empty id")
                continue
            if option["id"] in option_ids:
                add("DEC-03", f"{option_loc}.id", "duplicates an option id")
            option_ids.add(option["id"])
            if option.get("preselected") is True:
                add("DEC-02", f"{option_loc}.preselected", "cannot be true")
            if not is_evidence:
                continue
            is_correct = option.get("isCorrect")
            if not isinstance(is_correct, bool):
                add("DEC-03", f"{option_loc}.isCorrect", "must be an explicit boolean")
            elif is_correct:
                correct += 1
                _validate_refs(
                    option.get("supportedBy"),
                    "supportedBy",
                    option_loc,
                    decision,
                    index,
                    add,
                )
            else:
                distractors += 1
                _validate_refs(
                    option.get("refutedBy"),
                    "refutedBy",
                    option_loc,
                    decision,
                    index,
                    add,
                )
        if is_evidence and correct == 0:
            add("DEC-03", f"{loc}.options", "needs an evidence-supported option")
        if is_evidence and distractors == 0:
            add("DEC-03", f"{loc}.options", "needs a refutable distractor")

    for decision_id in index.registry.keys() - seen:
        add(
            "DEC-01",
            "$.decisionRegistry",
            f"declared decision {decision_id!r} has no decisions[] entry",
        )
    _validate_registry_choice_coverage(index, add)


def _validate_registry_choice_coverage(
    index: ContractIndex,
    add: Callable[[str, str, str], None],
) -> None:
    if index.runtime is None:
        return
    covered: set[tuple[str, str]] = set()
    for entry in index.registry.values():
        runtime_node = _decision_runtime_node(entry, index)
        if runtime_node is not None:
            covered.add(runtime_node)
    for segment_id, beat_nodes in index.beat_nodes.items():
        question = beat_nodes.get("question")
        outcomes = (beat_nodes.get("success"), beat_nodes.get("failure"))
        if question is None or any(outcome is None for outcome in outcomes):
            continue
        from_question = index.runtime.descendants(question)
        to_outcome: set[tuple[str, str]] = set()
        for outcome in outcomes:
            if outcome is not None:
                to_outcome |= index.runtime.ancestors(outcome)
        scoped_choices = {
            node
            for node in from_question & to_outcome
            if index.runtime.nodes[node].get("type") == "choice"
        }
        for scene_id, node_id in sorted(scoped_choices - covered):
            add(
                "DEC-01",
                "$.decisionRegistry",
                f"segment {segment_id!r} omits runtime choice "
                f"{scene_id}/{node_id}",
            )


def _validate_decision_exemption(
    data: dict[str, Any],
    decisions: list[Any],
    index: ContractIndex,
    add: Callable[[str, str, str], None],
) -> None:
    exemption = data.get("decisionExemption")
    if index.registry or decisions:
        if exemption is not None:
            add(
                "DEC-07",
                "$.decisionExemption",
                "is only valid when decisionRegistry and decisions are both empty",
            )
        return
    if not isinstance(exemption, dict):
        add(
            "DEC-07",
            "$.decisionExemption",
            "zero decisions require a validated NOT_APPLICABLE exemption",
        )
        return
    if exemption.get("status") != "NOT_APPLICABLE":
        add(
            "DEC-07",
            "$.decisionExemption.status",
            "must equal NOT_APPLICABLE",
        )
    for field in ("reason", "decisionOwner"):
        if not _string(exemption.get(field)):
            add(
                "DEC-07",
                f"$.decisionExemption.{field}",
                "must be a non-empty string",
            )
    scope = exemption.get("scopeSegments")
    if (
        not isinstance(scope, list)
        or any(not _string(item) for item in scope)
        or set(scope) != set(index.segments)
        or len(scope) != len(set(scope))
    ):
        add(
            "DEC-07",
            "$.decisionExemption.scopeSegments",
            "must list every contracted segment exactly once",
        )
    basis = exemption.get("basis")
    if not isinstance(basis, dict):
        add(
            "DEC-07",
            "$.decisionExemption.basis",
            "must cite an existing repo file and exact locator text",
        )
    else:
        basis_path = _repo_path(index.repo_root, basis.get("targetPath"))
        locator = basis.get("locator")
        if basis_path is None or not basis_path.is_file() or not _string(locator):
            add(
                "DEC-07",
                "$.decisionExemption.basis",
                "targetPath must exist in repo and locator must be non-empty",
            )
        else:
            try:
                basis_text = basis_path.read_text(encoding="utf-8")
            except OSError:
                basis_text = ""
            if locator not in basis_text:
                add(
                    "DEC-07",
                    "$.decisionExemption.basis.locator",
                    "locator text was not found in the cited file",
                )

    if index.runtime is None:
        return
    for segment_id, beat_nodes in index.beat_nodes.items():
        question = beat_nodes.get("question")
        outcomes = [
            beat_nodes.get("success"),
            beat_nodes.get("failure"),
        ]
        if question is None or any(outcome is None for outcome in outcomes):
            continue
        from_question = index.runtime.descendants(question)
        to_outcome: set[tuple[str, str]] = set()
        for outcome in outcomes:
            if outcome is not None:
                to_outcome |= index.runtime.ancestors(outcome)
        scoped_nodes = from_question & to_outcome
        player_actions = [
            node
            for node in scoped_nodes
            if index.runtime.nodes[node].get("type") in {"choice", "embed"}
        ]
        if player_actions:
            rendered = ", ".join(
                f"{scene}/{node}" for scene, node in sorted(player_actions)[:3]
            )
            add(
                "DEC-07",
                "$.decisionExemption",
                f"segment {segment_id!r} contains unregistered player action(s): "
                f"{rendered}",
            )


def _validate_refs(
    refs: Any,
    ref_name: str,
    option_location: str,
    decision: dict[str, Any],
    index: ContractIndex,
    add: Callable[[str, str, str], None],
) -> None:
    location = f"{option_location}.{ref_name}"
    if not isinstance(refs, list) or not refs:
        add(
            "DEC-04" if ref_name == "refutedBy" else "DEC-05",
            location,
            "must be a non-empty array",
        )
        return
    for ref_index, ref in enumerate(refs):
        loc = f"{location}[{ref_index}]"
        if not isinstance(ref, dict) or not all(
            _string(ref.get(key)) for key in ("sourceId", "field")
        ):
            add("DEC-05", loc, "must name non-empty sourceId and field")
            continue
        fields = index.evidence.get(ref["sourceId"])
        if fields is None:
            add("DEC-05", f"{loc}.sourceId", "references an unknown evidence source")
            continue
        field = fields.get(ref["field"])
        if field is None:
            add("DEC-05", f"{loc}.field", "references an unknown evidence field")
            continue
        if "condition" in ref and not _string(ref.get("condition")):
            add("DEC-05", f"{loc}.condition", "must be non-empty when present")
        if ref_name == "refutedBy" and ref.get("relation") not in REFUTATION_RELATIONS:
            add(
                "DEC-04",
                f"{loc}.relation",
                "must be one of contradicts, confounded, out_of_scope, insufficient",
            )
        source_node = index.evidence_nodes.get((ref["sourceId"], ref["field"]))
        decision_node = _decision_runtime_node(decision, index)
        if (
            index.runtime is not None
            and source_node is not None
            and decision_node is not None
            and not index.runtime.dominates(source_node, decision_node)
        ):
            add(
                "DEC-06",
                loc,
                f"{ref['sourceId']}.{ref['field']} is later than the decision "
                "or exists only on a mutually exclusive path",
            )


def _manual_boundary() -> str:
    return (
        "MANUAL: the scenes-json binder proves static startScene reachability "
        "and dominance while conservatively over-approximating require/state "
        "gates; verify state-feasible paths, distractor plausibility, physical/"
        "historical validity of supportedBy/refutedBy, and whether restored "
        "narrative adds dramatic value without supplying the missing inference."
    )


def run_check(contract_path: Path) -> int:
    try:
        contract = load_contract(contract_path)
    except MechanicsInputError as exc:
        print(f"MECHANICS_INPUT_ERROR: {exc}")
        return 1
    issues = validate_contract(contract)
    if issues:
        print(f"MECHANICS_CONTRACT: FAIL ({len(issues)} issue(s))")
        for issue in issues:
            print(issue.render())
        print(_manual_boundary())
        return 2
    print(
        "MECHANICS_CONTRACT: PASS "
        f"chapter={contract.get('chapter')} "
        f"segments={len(contract.get('segments', []))} "
        f"decisions={len(contract.get('decisions', []))} "
        f"decisionStatus="
        f"{'NOT_APPLICABLE' if not contract.get('decisions') else 'VALIDATED'}"
    )
    print(_manual_boundary())
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check inquiry mechanics and evidence-judgment contracts."
    )
    parser.add_argument("--contract", required=True, type=Path)
    return run_check(parser.parse_args().contract)


if __name__ == "__main__":
    raise SystemExit(main())
