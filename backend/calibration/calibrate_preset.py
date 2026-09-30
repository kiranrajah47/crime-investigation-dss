#!/usr/bin/env python3
"""
calibrate_preset.py
-------------------
Weight-calibration tool for the Crime Investigation DSS.

Derives optimal evidence weights (physical_evidence, witness_statement,
past_history, alibi_penalty) by grid-searching over weight combinations
and measuring how well each combination ranks suspects against
graded relevance labels (0-3).

Usage:
    python calibrate_preset.py --category murder

The script is category-agnostic: --category reads labels/<category>_*.json
and cases/<category>_*/, so the same tool works for fraud, kidnapping, etc.
"""

import argparse
import glob
import json
import math
import os
import sys
import random
import datetime

import numpy as np

# ── Ensure backend is importable ──────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)      # backend/
sys.path.insert(0, BACKEND_DIR)

# ── Reuse the app's own modules (DO NOT rewrite them) ─────────────────────────
from api import read_uploaded_file, parse_suspects_file          # file reader + suspect parser
from scoring import (
    score_all_suspects, compute_score, WEIGHTS as DEFAULT_WEIGHTS,
    _detect_alibi_strength, _detect_history_strength,
)
from tfidf_scorer import score_suspect_against_docs              # TF-IDF similarities


# ── Thresholds from scoring.py (lines 214-219) ───────────────────────────────
PRIMARY_THRESHOLD   = 0.55
SECONDARY_THRESHOLD = 0.30


# ── Known presets from Dashboard.jsx ──────────────────────────────────────────
DASHBOARD_PRESETS = {
    "Default": {
        "physical_evidence": 0.55,
        "witness_statement": 0.35,
        "past_history":      0.25,
        "alibi_penalty":    -0.25,
    },
    "Physical assault": {
        "physical_evidence": 0.75,
        "witness_statement": 0.35,
        "past_history":      0.25,
        "alibi_penalty":    -0.35,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 1.  Case loading helpers
# ═══════════════════════════════════════════════════════════════════════════════

def discover_cases(category: str):
    """
    Find all case folders matching calibration/cases/<category>_*/.
    Returns list of dicts: { 'slug': ..., 'dir': ..., 'label_file': ... }.
    """
    cases_dir  = os.path.join(SCRIPT_DIR, "cases")
    labels_dir = os.path.join(SCRIPT_DIR, "labels")

    pattern = os.path.join(cases_dir, f"{category}_*")
    case_dirs = sorted(glob.glob(pattern))

    if not case_dirs:
        print(f"\n[ERROR] No case folders found matching: {pattern}")
        print(f"        Expected folders like: cases/{category}_<name>/")
        sys.exit(1)

    cases = []
    for d in case_dirs:
        if not os.path.isdir(d):
            continue
        slug = os.path.basename(d)
        label_file = os.path.join(labels_dir, f"{slug}.json")
        if not os.path.isfile(label_file):
            print(f"\n[ERROR] Label file missing for case '{slug}':")
            print(f"        Expected: {label_file}")
            sys.exit(1)
        cases.append({"slug": slug, "dir": d, "label_file": label_file})

    if not cases:
        print(f"\n[ERROR] No valid case directories found for category '{category}'.")
        sys.exit(1)

    return cases


def load_case(case_info: dict):
    """
    Load one case from disk.  Verifies that victim.pdf, evidence.pdf,
    suspects.pdf exist; reads them with the app's own reader; parses suspects.

    Returns dict:
        slug, labels, suspects, victim_text, evidence_text
    """
    d = case_info["dir"]
    slug = case_info["slug"]

    # Check required files
    required = ["victim.pdf", "evidence.pdf", "suspects.pdf"]
    missing = [f for f in required if not os.path.isfile(os.path.join(d, f))]
    if missing:
        print(f"\n[ERROR] Case '{slug}' is missing required PDF files:")
        for f in missing:
            print(f"        - {os.path.join(d, f)}")
        print(f"\n        Please copy the PDFs into: {d}")
        print(f"        Expected files: {', '.join(required)}")
        sys.exit(1)

    # Read documents using the app's own read_uploaded_file
    victim_text   = read_uploaded_file(os.path.join(d, "victim.pdf"))
    evidence_text = read_uploaded_file(os.path.join(d, "evidence.pdf"))
    suspects_text = read_uploaded_file(os.path.join(d, "suspects.pdf"))

    for label, text in [("victim.pdf", victim_text),
                        ("evidence.pdf", evidence_text),
                        ("suspects.pdf", suspects_text)]:
        if not text.strip():
            print(f"\n[ERROR] Document '{label}' in case '{slug}' is empty.")
            sys.exit(1)

    # Parse suspects using the app's own parser
    suspects = parse_suspects_file(suspects_text)
    if not suspects:
        print(f"\n[ERROR] No suspects parsed from suspects.pdf in case '{slug}'.")
        print("        Each suspect section must start with: SUSPECT: Name")
        sys.exit(1)

    # Load labels
    with open(case_info["label_file"], "r", encoding="utf-8") as f:
        labels = json.load(f)

    # Verify label names match parsed suspect names
    parsed_names = {s["name"] for s in suspects}
    label_names  = set(labels.keys())
    extra_labels  = label_names - parsed_names
    missing_labels = parsed_names - label_names
    if extra_labels:
        print(f"\n[WARNING] Labels for suspects not found in PDF ({slug}): {extra_labels}")
    if missing_labels:
        print(f"\n[WARNING] Suspects in PDF without labels ({slug}): {missing_labels}")
        print("          These suspects will be excluded from evaluation.")

    return {
        "slug":          slug,
        "labels":        labels,
        "suspects":      suspects,
        "victim_text":   victim_text,
        "evidence_text": evidence_text,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 2.  Pre-compute per-suspect components (TF-IDF similarities + keyword scores)
# ═══════════════════════════════════════════════════════════════════════════════

def precompute_components(case_data: dict) -> list:
    """
    Call score_all_suspects() ONCE with default weights to extract
    each suspect's raw component values (evidence_sim, victim_sim,
    past_history_score, alibi_score).

    These do NOT depend on the weights, so we cache them.
    """
    suspects      = case_data["suspects"]
    victim_text   = case_data["victim_text"]
    evidence_text = case_data["evidence_text"]

    results = score_all_suspects(suspects, victim_text, evidence_text)

    components = []
    for r in results:
        components.append({
            "name":               r["name"],
            "evidence_sim":       r["evidence_sim"],
            "victim_sim":         r["victim_sim"],
            "past_history_score": r["past_history_score"],
            "alibi_score":        r["alibi_score"],
        })
    return components


# ═══════════════════════════════════════════════════════════════════════════════
# 3.  Analytic scoring (vectorized over the weight grid)
# ═══════════════════════════════════════════════════════════════════════════════

def analytic_raw_score(components: list, phys, wit, hist, alibi_pen):
    """
    Compute raw score = phys*evidence_sim + wit*victim_sim
                       + hist*past_history_score + alibi_pen*alibi_score

    Note: alibi_pen is already NEGATIVE (mirroring api.py's -float(w_alibi)).
    """
    scores = {}
    for c in components:
        raw = (phys      * c["evidence_sim"]
             + wit       * c["victim_sim"]
             + hist      * c["past_history_score"]
             + alibi_pen * c["alibi_score"])
        scores[c["name"]] = raw
    return scores


def verify_analytic_scoring(components: list, case_data: dict, n_checks: int = 3):
    """
    Verify on n_checks random weight combinations that our analytic score
    equals compute_score(...)['final_score'] from scoring.py BEFORE clamping.
    Abort with error if they disagree.
    """
    random.seed(42)
    suspects      = case_data["suspects"]
    victim_text   = case_data["victim_text"]
    evidence_text = case_data["evidence_text"]

    for trial in range(n_checks):
        p = round(random.uniform(0.10, 1.00), 2)
        w = round(random.uniform(0.10, 1.00), 2)
        h = round(random.uniform(0.05, 0.80), 2)
        a = round(random.uniform(0.05, 0.60), 2)

        custom_weights = {
            "physical_evidence": p,
            "witness_statement": w,
            "past_history":      h,
            "alibi_penalty":    -a,   # negative, like api.py
        }

        # Analytic scores
        analytic = analytic_raw_score(components, p, w, h, -a)

        # scoring.py scores (before clamp)
        for suspect in suspects:
            name = suspect["name"]
            result = compute_score(
                suspect_name   = name,
                suspect_text   = suspect["text"],
                victim_text    = victim_text,
                evidence_text  = evidence_text,
                custom_weights = custom_weights,
            )
            # Reconstruct pre-clamp score from breakdown
            breakdown = result["score_breakdown"]
            scoring_raw = (breakdown["physical_evidence"]
                         + breakdown["witness_statement"]
                         + breakdown["past_history"]
                         + breakdown["alibi_penalty"])

            analytic_val = analytic.get(name)
            if analytic_val is None:
                continue

            if abs(analytic_val - scoring_raw) > 1e-3:
                print(f"\n[FATAL] Analytic verification FAILED for '{name}'")
                print(f"        Trial {trial+1}, weights: p={p}, w={w}, h={h}, a={a}")
                print(f"        Analytic raw  = {analytic_val:.6f}")
                print(f"        scoring.py raw= {scoring_raw:.6f}")
                print(f"        Difference    = {abs(analytic_val - scoring_raw):.6f}")
                sys.exit(1)

    print(f"  [OK] Analytic scoring verified on {n_checks} random weight combinations.")


# ═══════════════════════════════════════════════════════════════════════════════
# 4.  Evaluation metrics
# ═══════════════════════════════════════════════════════════════════════════════

def _clamp(x):
    return max(0.0, min(1.0, x))


def _tier(score):
    if score >= PRIMARY_THRESHOLD:
        return "Primary"
    elif score >= SECONDARY_THRESHOLD:
        return "Secondary"
    else:
        return "Low"


def _expected_tier(rel):
    if rel >= 3:
        return "Primary"
    elif rel >= 1:
        return "Secondary"
    else:
        return "Low"


def ndcg_at_k(ranked_rels: list, k: int = 5) -> float:
    """
    NDCG@k using gain = 2^rel - 1.
    ranked_rels: list of relevance labels in predicted rank order.
    """
    def dcg(rels, k):
        return sum(
            (2**rels[i] - 1) / math.log2(i + 2)
            for i in range(min(k, len(rels)))
        )

    actual_dcg = dcg(ranked_rels, k)
    ideal_rels = sorted(ranked_rels, reverse=True)
    ideal_dcg  = dcg(ideal_rels, k)
    if ideal_dcg == 0:
        return 0.0
    return actual_dcg / ideal_dcg


def evaluate(components: list, labels: dict, phys, wit, hist, alibi_pen):
    """
    Evaluate a single weight combination against one case.
    Returns dict with ndcg5, tier_agreement, rel0_in_top5, objective.
    """
    raw_scores = analytic_raw_score(components, phys, wit, hist, alibi_pen)

    # Build list of (name, clamped_score) sorted desc
    scored = []
    for c in components:
        name = c["name"]
        if name not in labels:
            continue
        clamped = _clamp(raw_scores[name])
        scored.append((name, clamped))
    scored.sort(key=lambda x: x[1], reverse=True)

    if not scored:
        return {"ndcg5": 0, "tier_agreement": 0, "rel0_in_top5": 0, "objective": 0}

    # NDCG@5
    ranked_rels = [labels[name] for name, _ in scored]
    n5 = ndcg_at_k(ranked_rels, k=5)

    # Tier agreement
    tier_matches = 0
    total = 0
    for name, sc in scored:
        pred_tier = _tier(sc)
        exp_tier  = _expected_tier(labels[name])
        if pred_tier == exp_tier:
            tier_matches += 1
        total += 1
    tier_ag = tier_matches / total if total > 0 else 0

    # Rel-0 in top 5
    top5 = scored[:5]
    rel0_count = sum(1 for name, _ in top5 if labels[name] == 0)

    # Objective
    objective = 0.7 * n5 + 0.3 * tier_ag

    return {
        "ndcg5":         round(n5, 4),
        "tier_agreement": round(tier_ag, 4),
        "rel0_in_top5":  rel0_count,
        "objective":     round(objective, 4),
    }


def evaluate_multi(all_components: list, all_labels: list, phys, wit, hist, alibi_pen):
    """Evaluate across multiple cases (average objective)."""
    results = []
    for comps, labs in zip(all_components, all_labels):
        results.append(evaluate(comps, labs, phys, wit, hist, alibi_pen))

    avg_ndcg5    = np.mean([r["ndcg5"] for r in results])
    avg_tier     = np.mean([r["tier_agreement"] for r in results])
    avg_rel0     = np.mean([r["rel0_in_top5"] for r in results])
    avg_obj      = 0.7 * avg_ndcg5 + 0.3 * avg_tier

    return {
        "ndcg5":         round(float(avg_ndcg5), 4),
        "tier_agreement": round(float(avg_tier), 4),
        "rel0_in_top5":  round(float(avg_rel0), 2),
        "objective":     round(float(avg_obj), 4),
        "per_case":      results,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 5.  Grid search
# ═══════════════════════════════════════════════════════════════════════════════

def build_grid():
    """Build the weight grid as numpy arrays for fast iteration."""
    phys_range  = np.arange(0.10, 1.01, 0.05)
    wit_range   = np.arange(0.10, 1.01, 0.05)
    hist_range  = np.arange(0.05, 0.81, 0.05)
    alibi_range = np.arange(0.05, 0.61, 0.05)

    # Round to avoid float artefacts
    phys_range  = np.round(phys_range,  2)
    wit_range   = np.round(wit_range,   2)
    hist_range  = np.round(hist_range,  2)
    alibi_range = np.round(alibi_range, 2)

    return phys_range, wit_range, hist_range, alibi_range


def grid_search(all_components, all_labels, reference_weights=None):
    """
    Exhaustive grid search.
    Returns sorted list of (phys, wit, hist, alibi, result_dict).
    """
    phys_range, wit_range, hist_range, alibi_range = build_grid()
    total = len(phys_range) * len(wit_range) * len(hist_range) * len(alibi_range)
    print(f"  Grid size: {total:,} combinations")

    candidates = []
    count = 0
    for p in phys_range:
        for w in wit_range:
            for h in hist_range:
                for a in alibi_range:
                    result = evaluate_multi(
                        all_components, all_labels,
                        p, w, h, -a   # alibi_penalty is negative
                    )
                    candidates.append((float(p), float(w), float(h), float(a), result))
                    count += 1
                    if count % 50000 == 0:
                        print(f"    ... {count:,}/{total:,} evaluated")

    candidates.sort(key=lambda x: x[4]["objective"], reverse=True)
    print(f"  Grid search complete. Best objective: {candidates[0][4]['objective']:.4f}")
    return candidates


def select_best(candidates, reference_preset_name="Physical assault"):
    """
    Among candidates within 0.01 of the best objective,
    pick the one closest (L2) to the reference preset.
    """
    ref = DASHBOARD_PRESETS[reference_preset_name]
    ref_vec = np.array([
        ref["physical_evidence"],
        ref["witness_statement"],
        ref["past_history"],
        abs(ref["alibi_penalty"]),   # stored positive for comparison
    ])

    best_obj = candidates[0][4]["objective"]
    threshold = best_obj - 0.01

    near_best = [c for c in candidates if c[4]["objective"] >= threshold]
    print(f"  Candidates within 0.01 of best ({best_obj:.4f}): {len(near_best)}")

    def l2_dist(c):
        vec = np.array([c[0], c[1], c[2], c[3]])
        return float(np.linalg.norm(vec - ref_vec))

    near_best.sort(key=l2_dist)
    chosen = near_best[0]
    print(f"  Chosen weights (L2-closest to {reference_preset_name}): "
          f"phys={chosen[0]:.2f}, wit={chosen[1]:.2f}, "
          f"hist={chosen[2]:.2f}, alibi={chosen[3]:.2f}")
    print(f"  L2 distance from {reference_preset_name}: {l2_dist(chosen):.4f}")
    return chosen


# ═══════════════════════════════════════════════════════════════════════════════
# 6.  Validation (2-fold cross-check)
# ═══════════════════════════════════════════════════════════════════════════════

def two_fold_validation(all_components, all_labels, case_slugs):
    """
    2-fold: train on case 0, test on case 1; then swap.
    Returns results dict.
    """
    if len(all_components) < 2:
        print("  [SKIP] Only one case; skipping 2-fold validation.")
        return None

    results = {}
    for train_idx, test_idx in [(0, 1), (1, 0)]:
        print(f"\n  Fold: train on '{case_slugs[train_idx]}', test on '{case_slugs[test_idx]}'")
        candidates = grid_search(
            [all_components[train_idx]], [all_labels[train_idx]]
        )
        chosen = select_best(candidates)
        # Evaluate chosen on held-out case
        held_out = evaluate(
            all_components[test_idx], all_labels[test_idx],
            chosen[0], chosen[1], chosen[2], -chosen[3]
        )
        results[f"train_{case_slugs[train_idx]}"] = {
            "weights": {"physical_evidence": chosen[0], "witness_statement": chosen[1],
                        "past_history": chosen[2], "alibi_penalty": chosen[3]},
            "train_result": chosen[4],
            "heldout_case": case_slugs[test_idx],
            "heldout_result": held_out,
        }
        print(f"    Train objective : {chosen[4]['objective']:.4f}")
        print(f"    Held-out NDCG@5 : {held_out['ndcg5']:.4f}")
        print(f"    Held-out Tier   : {held_out['tier_agreement']:.4f}")
        print(f"    Held-out Obj    : {held_out['objective']:.4f}")

    return results


# ═══════════════════════════════════════════════════════════════════════════════
# 7.  Preset evaluation
# ═══════════════════════════════════════════════════════════════════════════════

def evaluate_preset(name, weights, all_components, all_labels, case_slugs):
    """Evaluate a known preset across all cases."""
    p = weights["physical_evidence"]
    w = weights["witness_statement"]
    h = weights["past_history"]
    a = weights["alibi_penalty"]  # already negative

    result = evaluate_multi(all_components, all_labels, p, w, h, a)
    print(f"  {name}: NDCG@5={result['ndcg5']:.4f}  "
          f"Tier={result['tier_agreement']:.4f}  Obj={result['objective']:.4f}")
    for i, slug in enumerate(case_slugs):
        pc = result["per_case"][i]
        print(f"    {slug}: NDCG@5={pc['ndcg5']:.4f}  "
              f"Tier={pc['tier_agreement']:.4f}  rel0_top5={pc['rel0_in_top5']}")
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# 8.  Ranking table for report
# ═══════════════════════════════════════════════════════════════════════════════

def build_ranking_table(components, labels, phys, wit, hist, alibi_pen):
    """Build a ranking table for one case with given weights."""
    raw_scores = analytic_raw_score(components, phys, wit, hist, alibi_pen)
    rows = []
    for c in components:
        name = c["name"]
        rel = labels.get(name, "?")
        clamped = _clamp(raw_scores[name])
        tier = _tier(clamped)
        rows.append({
            "rank": 0,
            "name": name,
            "score": round(clamped, 4),
            "tier": tier,
            "rel": rel,
        })
    rows.sort(key=lambda x: x["score"], reverse=True)
    for i, row in enumerate(rows):
        row["rank"] = i + 1
    return rows


# ═══════════════════════════════════════════════════════════════════════════════
# 9.  Report generation
# ═══════════════════════════════════════════════════════════════════════════════

def write_report(
    category, case_slugs,
    top10, joint_chosen, joint_result,
    fold_results, preset_results,
    all_components, all_labels,
    heldout_better_than_preset
):
    """Write the Markdown calibration report."""
    report_path = os.path.join(SCRIPT_DIR, f"{category}_calibration_report.md")

    lines = []
    lines.append(f"# Calibration Report — {category.title()} Preset")
    lines.append(f"\n_Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_\n")

    # ── Top 10 candidates ──
    lines.append("## Top 10 Weight Candidates (Joint Optimum)\n")
    lines.append("| Rank | Physical | Witness | History | Alibi | NDCG@5 | Tier Agr. | Objective |")
    lines.append("|------|----------|---------|---------|-------|--------|-----------|-----------|")
    for i, (p, w, h, a, res) in enumerate(top10[:10], 1):
        lines.append(f"| {i} | {p:.2f} | {w:.2f} | {h:.2f} | {a:.2f} | "
                     f"{res['ndcg5']:.4f} | {res['tier_agreement']:.4f} | {res['objective']:.4f} |")

    # ── Chosen weights ──
    p, w, h, a = joint_chosen[0], joint_chosen[1], joint_chosen[2], joint_chosen[3]
    lines.append(f"\n## Chosen Weights\n")
    lines.append(f"| Parameter | Value |")
    lines.append(f"|-----------|-------|")
    lines.append(f"| Physical evidence | {p:.2f} |")
    lines.append(f"| Witness statement | {w:.2f} |")
    lines.append(f"| Past history | {h:.2f} |")
    lines.append(f"| Alibi penalty | {a:.2f} |")
    lines.append(f"\n**Joint objective**: {joint_result['objective']:.4f} "
                 f"(NDCG@5={joint_result['ndcg5']:.4f}, "
                 f"Tier={joint_result['tier_agreement']:.4f})\n")

    # ── 2-Fold held-out results ──
    if fold_results:
        lines.append("## 2-Fold Cross-Validation\n")
        for key, val in fold_results.items():
            wt = val["weights"]
            tr = val["train_result"]
            ho = val["heldout_result"]
            lines.append(f"### {key.replace('train_', 'Train: ')}\n")
            lines.append(f"- **Train weights**: phys={wt['physical_evidence']:.2f}, "
                         f"wit={wt['witness_statement']:.2f}, "
                         f"hist={wt['past_history']:.2f}, "
                         f"alibi={wt['alibi_penalty']:.2f}")
            lines.append(f"- **Train objective**: {tr['objective']:.4f} "
                         f"(NDCG@5={tr['ndcg5']:.4f}, Tier={tr['tier_agreement']:.4f})")
            lines.append(f"- **Held-out case**: {val['heldout_case']}")
            lines.append(f"- **Held-out NDCG@5**: {ho['ndcg5']:.4f}")
            lines.append(f"- **Held-out Tier agreement**: {ho['tier_agreement']:.4f}")
            lines.append(f"- **Held-out Objective**: {ho['objective']:.4f}")
            lines.append("")

    # ── Existing preset comparison ──
    lines.append("## Existing Preset Performance\n")
    lines.append("| Preset | NDCG@5 | Tier Agr. | Objective |")
    lines.append("|--------|--------|-----------|-----------|")
    for name, res in preset_results.items():
        lines.append(f"| {name} | {res['ndcg5']:.4f} | {res['tier_agreement']:.4f} | {res['objective']:.4f} |")
    chosen_res = joint_result
    lines.append(f"| **{category.title()} (calibrated)** | "
                 f"{chosen_res['ndcg5']:.4f} | {chosen_res['tier_agreement']:.4f} | "
                 f"{chosen_res['objective']:.4f} |")
    lines.append("")

    # ── Per-case rankings: chosen vs Physical assault ──
    pa_weights = DASHBOARD_PRESETS["Physical assault"]
    for i, slug in enumerate(case_slugs):
        lines.append(f"## Rankings — {slug}\n")

        lines.append(f"### Calibrated {category.title()} Preset\n")
        table = build_ranking_table(all_components[i], all_labels[i], p, w, h, -a)
        lines.append("| Rank | Name | Score | Tier | Relevance |")
        lines.append("|------|------|-------|------|-----------|")
        for row in table:
            lines.append(f"| {row['rank']} | {row['name']} | {row['score']:.4f} | "
                         f"{row['tier']} | {row['rel']} |")
        lines.append("")

        lines.append(f"### Physical Assault Preset\n")
        table_pa = build_ranking_table(
            all_components[i], all_labels[i],
            pa_weights["physical_evidence"],
            pa_weights["witness_statement"],
            pa_weights["past_history"],
            pa_weights["alibi_penalty"]    # already negative
        )
        lines.append("| Rank | Name | Score | Tier | Relevance |")
        lines.append("|------|------|-------|------|-----------|")
        for row in table_pa:
            lines.append(f"| {row['rank']} | {row['name']} | {row['score']:.4f} | "
                         f"{row['tier']} | {row['rel']} |")
        lines.append("")

    # ── Held-out comparison note ──
    if not heldout_better_than_preset:
        lines.append("> **Note**: The held-out NDCG@5 of the chosen weights is NOT better ")
        lines.append("> than the current Physical assault preset on both cases. The preset ")
        lines.append("> is still added but may not generalise beyond these two cases.\n")

    # ── Caveat ──
    lines.append("---\n")
    lines.append("**Caveat**: Calibrated on 2 synthetic, developer-authored cases. "
                 "This is calibration, not evidence of generalisation.\n")

    report_text = "\n".join(lines)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"\n  Report written to: {report_path}")
    return report_path


def write_preset_json(category, chosen):
    """Save the chosen weights to calibration/<category>_preset.json."""
    preset_path = os.path.join(SCRIPT_DIR, f"{category}_preset.json")
    preset = {
        "physical_evidence": chosen[0],
        "witness_statement": chosen[1],
        "past_history":      chosen[2],
        "alibi_penalty":     chosen[3],    # positive number (Dashboard convention)
    }
    with open(preset_path, "w", encoding="utf-8") as f:
        json.dump(preset, f, indent=2)
    print(f"  Preset JSON written to: {preset_path}")
    return preset_path, preset


# ═══════════════════════════════════════════════════════════════════════════════
# 10.  Main entry point
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Calibrate evidence weights for a Crime DSS preset."
    )
    parser.add_argument(
        "--category", required=True,
        help="Category name (e.g. murder, fraud, kidnapping). "
             "Reads labels/<category>_*.json and cases/<category>_*/."
    )
    args = parser.parse_args()
    category = args.category.lower().strip()

    print(f"=" * 70)
    print(f"  Crime Investigation DSS — Weight Calibration Tool")
    print(f"  Category: {category}")
    print(f"=" * 70)

    # ── Step 1: Discover and load cases ──
    print(f"\n[1/8] Discovering cases for category '{category}'...")
    case_infos = discover_cases(category)
    print(f"  Found {len(case_infos)} case(s): {[c['slug'] for c in case_infos]}")

    cases = []
    for ci in case_infos:
        print(f"\n  Loading '{ci['slug']}'...")
        cases.append(load_case(ci))

    case_slugs = [c["slug"] for c in cases]

    # ── Step 2: Precompute component scores ──
    print(f"\n[2/8] Precomputing TF-IDF similarities and keyword scores...")
    all_components = []
    all_labels = []
    for case in cases:
        print(f"  Processing '{case['slug']}'...")
        comps = precompute_components(case)
        all_components.append(comps)
        all_labels.append(case["labels"])
        print(f"    {len(comps)} suspects scored.")

    # ── Step 3: Verify analytic scoring ──
    print(f"\n[3/8] Verifying analytic scoring against scoring.py...")
    for i, case in enumerate(cases):
        print(f"  Verifying '{case['slug']}'...")
        verify_analytic_scoring(all_components[i], case)

    # ── Step 4: Grid search (joint optimum) ──
    print(f"\n[4/8] Running grid search (joint optimum across all cases)...")
    candidates = grid_search(all_components, all_labels)
    joint_chosen = select_best(candidates)
    joint_result = joint_chosen[4]
    top10 = candidates[:10]

    # ── Step 5: 2-fold validation ──
    print(f"\n[5/8] Running 2-fold cross-validation...")
    fold_results = two_fold_validation(all_components, all_labels, case_slugs)

    # ── Step 6: Evaluate existing presets ──
    print(f"\n[6/8] Evaluating existing presets...")
    preset_results = {}
    for name, weights in DASHBOARD_PRESETS.items():
        preset_results[name] = evaluate_preset(
            name, weights, all_components, all_labels, case_slugs
        )

    # ── Step 7: Check held-out vs Physical assault ──
    heldout_better = True
    if fold_results:
        pa_result = preset_results.get("Physical assault")
        if pa_result:
            for key, val in fold_results.items():
                ho = val["heldout_result"]
                # Check per-case PA NDCG@5
                heldout_case = val["heldout_case"]
                case_idx = case_slugs.index(heldout_case)
                pa_case_ndcg = pa_result["per_case"][case_idx]["ndcg5"]
                if ho["ndcg5"] < pa_case_ndcg:
                    heldout_better = False
                    print(f"\n  [!] Held-out NDCG@5 ({ho['ndcg5']:.4f}) < "
                          f"Physical assault ({pa_case_ndcg:.4f}) on '{heldout_case}'")

    if heldout_better:
        print(f"\n  [OK] Held-out NDCG@5 is better than Physical assault on both cases.")
    else:
        print(f"\n  [WARNING] Held-out NDCG@5 is NOT better than Physical assault on both cases.")

    # ── Step 8: Write outputs ──
    print(f"\n[7/8] Writing calibration report...")
    write_report(
        category, case_slugs,
        top10, joint_chosen, joint_result,
        fold_results, preset_results,
        all_components, all_labels,
        heldout_better
    )

    print(f"\n[8/8] Writing preset JSON...")
    preset_path, preset = write_preset_json(category, joint_chosen)

    # ── Summary ──
    print(f"\n{'=' * 70}")
    print(f"  CALIBRATION COMPLETE")
    print(f"{'=' * 70}")
    print(f"  Category       : {category}")
    print(f"  Physical       : {preset['physical_evidence']:.2f}")
    print(f"  Witness        : {preset['witness_statement']:.2f}")
    print(f"  History        : {preset['past_history']:.2f}")
    print(f"  Alibi penalty  : {preset['alibi_penalty']:.2f}")
    print(f"  Joint NDCG@5   : {joint_result['ndcg5']:.4f}")
    print(f"  Joint Tier     : {joint_result['tier_agreement']:.4f}")
    print(f"  Joint Objective: {joint_result['objective']:.4f}")
    if not heldout_better:
        print(f"\n  [!] NOTE: Held-out performance does not beat Physical assault preset")
        print(f"          on both cases. See report for details.")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    main()
