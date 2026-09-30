"""
evaluation/evaluate.py
======================
Evaluation harness for the Crime Investigation DSS scoring pipeline.

Usage
-----
    # From the project root:
    python evaluation/evaluate.py --version v1 --split test
    python evaluation/evaluate.py --version v1 --split dev
    python evaluation/evaluate.py --version v1 --split both

Inputs
------
- evaluation/labels/*.json       : Relevance labels (0-3) for each case
- backend/crime_dss.db           : SQLite database with stored cases
- PDF/TXT files in calibration/  : For cases without a DB record (see --pdf-dir)

Outputs
-------
- STDOUT          : Per-case tables
- evaluation/report.md : Full markdown report (appended/overwritten)

Metrics
-------
- NDCG@5          : Primary ranking quality metric
- Tier Agreement  : % of suspects whose V1 tier (Primary/Secondary/Low) matches
                    the expected tier derived from the label (3->Primary,
                    2->Secondary, 1/0->Low)
- Top-3 strong hits : How many label-3 suspects appear in the top-3 V1 ranks
- Label-0 ranks   : Actual rank of every label-0 suspect (lower = bad)
- Stability check : Drop one suspect at a time, recompute, report max score
                    change for remaining suspects

NOTE: This file reads from the existing scoring.py/tfidf_scorer.py WITHOUT
      modification. It is purely additive.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import sqlite3
import re
import copy
from datetime import datetime
from pathlib import Path
from typing import Optional

# ── Path setup ─────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent        # project root
BACKEND = ROOT / "backend"
EVAL_DIR = ROOT / "evaluation"
LABELS_DIR = EVAL_DIR / "labels"
REPORT_PATH = EVAL_DIR / "report.md"
DB_PATH = BACKEND / "crime_dss.db"

sys.path.insert(0, str(BACKEND))

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Scoring imports (read-only — no modifications) ────────────────────────────
from scoring import score_all_suspects, WEIGHTS


def parse_suspects_file(raw_text: str) -> list[dict]:
    suspects = []
    current_name = None
    current_lines = []

    for line in raw_text.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("SUSPECT:"):
            if current_name and current_lines:
                suspects.append({
                    "name": current_name,
                    "text": "\n".join(current_lines).strip()
                })
            current_name = stripped[len("SUSPECT:"):].strip()
            current_lines = []
        else:
            if current_name:
                current_lines.append(line)

    if current_name and current_lines:
        suspects.append({
            "name": current_name,
            "text": "\n".join(current_lines).strip()
        })

    return suspects


# ══════════════════════════════════════════════════════════════════════════════
# Label helpers
# ══════════════════════════════════════════════════════════════════════════════

DEV_CASES  = {"murder_arjun_nair", "kidnapping_rohan_mehta",
               "drugs_hyderabad", "fraud_chennai"}
TEST_CASES = {"murder_mysuru", "fraud_nagpur",
               "kidnap_hubballi", "drugs_goa"}


def load_all_labels() -> dict[str, dict]:
    """Return {case_id: label_json_dict} for every *.json in labels/."""
    labels = {}
    for p in sorted(LABELS_DIR.glob("*.json")):
        with open(p, encoding="utf-8") as fh:
            data = json.load(fh)
        labels[data["case_id"]] = data
    return labels


def label_to_tier(label: int) -> str:
    """Map 0-3 relevance label to expected V1 tier name."""
    if label == 3:
        return "Primary suspect"
    elif label == 2:
        return "Secondary suspect"
    else:
        return "Low concern"


# ══════════════════════════════════════════════════════════════════════════════
# Database helpers
# ══════════════════════════════════════════════════════════════════════════════

def load_case_from_db(db_case_id: int) -> Optional[dict]:
    """
    Fetch victim_text, evidence_text, suspects_text from the SQLite DB.
    Returns None if the case does not exist.
    """
    if not DB_PATH.exists():
        return None
    conn = sqlite3.connect(str(DB_PATH))
    cur  = conn.cursor()
    try:
        cur.execute(
            "SELECT title, victim_text, evidence_text, suspects_text "
            "FROM cases WHERE id = ?",
            (db_case_id,)
        )
        row = cur.fetchone()
    finally:
        conn.close()
    if row is None:
        return None
    title, victim_text, evidence_text, suspects_text = row
    suspects = parse_suspects_file(suspects_text or "")
    return {
        "title"        : title,
        "victim_text"  : victim_text  or "",
        "evidence_text": evidence_text or "",
        "suspects"     : suspects,
    }


def load_case_from_pdfs(pdf_dir: Path) -> Optional[dict]:
    """
    Load victim, evidence, and suspects documents from a directory.
    Expected filenames (any of):
        victim.pdf / victim.txt
        evidence.pdf / evidence.txt
        suspects.pdf / suspects.txt
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("WARNING: PyMuPDF not installed — PDF loading disabled.")
        return None

    def read_file(stem: str) -> str:
        for ext in (".pdf", ".txt", ".docx"):
            p = pdf_dir / (stem + ext)
            if p.exists():
                if ext == ".pdf":
                    doc  = fitz.open(str(p))
                    text = "\n".join(page.get_text() for page in doc)
                    doc.close()
                    return text
                else:
                    return p.read_text(encoding="utf-8")
        return ""

    victim_text   = read_file("victim")
    evidence_text = read_file("evidence")
    suspects_text = read_file("suspects")
    if not suspects_text:
        print(f"WARNING: No suspects file found in {pdf_dir}")
        return None

    suspects = parse_suspects_file(suspects_text)
    return {
        "title"        : pdf_dir.name,
        "victim_text"  : victim_text,
        "evidence_text": evidence_text,
        "suspects"     : suspects,
    }


# ══════════════════════════════════════════════════════════════════════════════
# Metrics
# ══════════════════════════════════════════════════════════════════════════════

def dcg_at_k(ranked_labels: list[int], k: int = 5) -> float:
    """Compute DCG@k given a list of relevance labels in ranked order."""
    dcg = 0.0
    for i, rel in enumerate(ranked_labels[:k]):
        dcg += (2**rel - 1) / math.log2(i + 2)   # i+2 because log2(1)=0
    return dcg


def ideal_dcg_at_k(labels: list[int], k: int = 5) -> float:
    """Compute ideal DCG@k (best possible ordering)."""
    return dcg_at_k(sorted(labels, reverse=True), k)


def ndcg_at_k(ranked_labels: list[int], k: int = 5) -> float:
    """Compute NDCG@k."""
    idcg = ideal_dcg_at_k(ranked_labels, k)
    if idcg == 0:
        return 1.0   # no positive labels → trivially perfect
    return round(dcg_at_k(ranked_labels, k) / idcg, 4)


def compute_tier_agreement(scored: list[dict], label_map: dict[str, int]) -> dict:
    """
    For every suspect in `scored` that has a label, check if the scored tier
    matches the expected tier from the label.

    Returns:
        {
          "agreement_pct": float,
          "mismatches": [(name, expected_tier, actual_tier, label, score)]
        }
    """
    total, agree = 0, 0
    mismatches = []
    for s in scored:
        name = s["name"]
        # Try exact match first, then case-insensitive
        lbl = label_map.get(name)
        if lbl is None:
            for k, v in label_map.items():
                if k.lower() == name.lower():
                    lbl = v
                    break
        if lbl is None:
            continue
        expected = label_to_tier(lbl)
        actual   = s.get("priority", "Low concern")
        total += 1
        if expected == actual:
            agree += 1
        else:
            mismatches.append((name, expected, actual, lbl, s["final_score"]))
    pct = round(agree / total * 100, 1) if total > 0 else 0.0
    return {"agreement_pct": pct, "total": total, "mismatches": mismatches}


def top_k_strong_hits(ranked: list[dict], label_map: dict[str, int], k: int = 3) -> dict:
    """
    Count how many label-3 suspects appear in the top-k ranked positions.

    Returns dict with hit_count, total_label3, hit_names, missed_names.
    """
    label3_names = {n.lower() for n, l in label_map.items() if l == 3}
    top_k_names  = [r["name"].lower() for r in ranked[:k]]
    hits   = [n for n in top_k_names if n in label3_names]
    missed = [n for n in label3_names if n not in set(top_k_names)]
    return {
        "hit_count"   : len(hits),
        "total_label3": len(label3_names),
        "hit_names"   : hits,
        "missed_names": list(missed),
    }


def label0_ranks(ranked: list[dict], label_map: dict[str, int]) -> list[dict]:
    """
    Return the rank of every label-0 suspect.
    Low ranks (1, 2, 3) are bad — they indicate false positives.
    """
    label0_names = {n.lower() for n, l in label_map.items() if l == 0}
    results = []
    for r in ranked:
        if r["name"].lower() in label0_names:
            results.append({
                "name" : r["name"],
                "rank" : r["rank"],
                "score": r["final_score"],
                "tier" : r.get("priority", "?"),
            })
    return sorted(results, key=lambda x: x["rank"])


def stability_check(
    suspects  : list[dict],
    victim    : str,
    evidence  : str,
    weights   : dict,
) -> dict:
    """
    For each suspect i, remove them, re-score the rest, and record the
    maximum absolute score change for any remaining suspect.

    Returns { suspect_removed: max_delta } for all i.
    """
    baseline_scored = score_all_suspects(suspects, victim, evidence, custom_weights=weights)
    baseline_map    = {s["name"]: s["final_score"] for s in baseline_scored}

    deltas = {}
    for i, dropped in enumerate(suspects):
        reduced = [s for j, s in enumerate(suspects) if j != i]
        if not reduced:
            continue
        new_scored  = score_all_suspects(reduced, victim, evidence, custom_weights=weights)
        new_map     = {s["name"]: s["final_score"] for s in new_scored}
        max_delta   = max(
            abs(new_map.get(n, 0) - baseline_map[n])
            for n in new_map
        )
        deltas[dropped["name"]] = round(max_delta, 4)
    return deltas


# ══════════════════════════════════════════════════════════════════════════════
# Per-case evaluation
# ══════════════════════════════════════════════════════════════════════════════

def evaluate_case(
    case_data  : dict,
    label_json : dict,
    version    : str = "v1",
    pdf_dir    : Optional[Path] = None,
) -> dict:
    """
    Run the full evaluation for one case.

    Returns a structured result dict.
    """
    label_map = label_json["labels"]
    suspects  = case_data["suspects"]
    victim    = case_data["victim_text"]
    evidence  = case_data["evidence_text"]

    if not suspects:
        return {"error": "No suspects parsed", "case_id": label_json["case_id"]}

    # ── Score all suspects ─────────────────────────────────────────────────────
    if version == "v1":
        scored = score_all_suspects(suspects, victim, evidence)
    else:
        raise NotImplementedError(f"Version '{version}' not yet implemented.")

    # Assign ranks
    for i, s in enumerate(scored):
        s["rank"] = i + 1

    # ── Build label list in ranked order ───────────────────────────────────────
    ranked_labels = []
    name_to_label = {k.lower(): v for k, v in label_map.items()}
    for s in scored:
        lbl = name_to_label.get(s["name"].lower(), -1)
        ranked_labels.append(lbl)

    # Filter to only labelled suspects for NDCG
    labelled_ranked = [l for l in ranked_labels if l >= 0]

    # ── Metrics ────────────────────────────────────────────────────────────────
    ndcg5        = ndcg_at_k(labelled_ranked, k=5)
    tier_result  = compute_tier_agreement(scored, label_map)
    hits3        = top_k_strong_hits(scored, label_map, k=3)
    l0_ranks     = label0_ranks(scored, label_map)
    stab         = stability_check(suspects, victim, evidence, WEIGHTS)

    return {
        "case_id"       : label_json["case_id"],
        "title"         : case_data.get("title", label_json["case_id"]),
        "version"       : version,
        "n_suspects"    : len(suspects),
        "ndcg5"         : ndcg5,
        "tier_agreement": tier_result,
        "top3_hits"     : hits3,
        "label0_ranks"  : l0_ranks,
        "stability"     : stab,
        "scored"        : scored,
        "label_map"     : label_map,
    }


# ══════════════════════════════════════════════════════════════════════════════
# Formatting helpers
# ══════════════════════════════════════════════════════════════════════════════

def _rank_table(scored: list[dict], label_map: dict[str, int]) -> str:
    """Return a markdown table of all ranked suspects with their labels."""
    name_to_label = {k.lower(): v for k, v in label_map.items()}
    header = "| Rank | Suspect | Score | Tier | Label | Match? |\n"
    sep    = "|------|---------|-------|------|-------|--------|\n"
    rows   = []
    for s in scored:
        lbl   = name_to_label.get(s["name"].lower(), "?")
        tier  = s.get("priority", "?")
        if lbl == "?":
            match = "—"
        else:
            expected = label_to_tier(int(lbl))
            match    = "✅" if expected == tier else "❌"
        rows.append(
            f"| {s['rank']} | {s['name']} | {s['final_score']:.4f} | "
            f"{tier} | {lbl} | {match} |"
        )
    return header + sep + "\n".join(rows)


def _stability_table(stab: dict) -> str:
    """Markdown table of stability check results, sorted by delta descending."""
    rows = sorted(stab.items(), key=lambda x: x[1], reverse=True)
    header = "| Suspect removed | Max Δ score for others |\n"
    sep    = "|-----------------|------------------------|\n"
    lines  = [f"| {name} | {delta:.4f} |" for name, delta in rows]
    return header + sep + "\n".join(lines)


def _tier_mismatch_table(mismatches: list) -> str:
    if not mismatches:
        return "_No tier mismatches._\n"
    header = "| Suspect | Expected tier | Actual tier | Label | Score |\n"
    sep    = "|---------|---------------|-------------|-------|-------|\n"
    lines  = [
        f"| {name} | {exp} | {act} | {lbl} | {score:.4f} |"
        for name, exp, act, lbl, score in mismatches
    ]
    return header + sep + "\n".join(lines)


def format_case_section(result: dict) -> str:
    """Format one case result as a markdown section."""
    cid   = result["case_id"]
    title = result["title"]
    ver   = result["version"].upper()

    s = f"## Case: `{cid}` — {title}\n\n"
    s += f"**Version:** {ver}  |  **Suspects scored:** {result['n_suspects']}\n\n"

    if "error" in result:
        s += f"> ⚠️ Error: {result['error']}\n"
        return s

    # ── Key metrics ─────────────────────────────────────────────────────────────
    ndcg  = result["ndcg5"]
    ta    = result["tier_agreement"]
    hits  = result["top3_hits"]
    s += "### Key Metrics\n\n"
    s += f"| Metric | Value |\n|--------|-------|\n"
    s += f"| NDCG@5 | **{ndcg:.4f}** |\n"
    s += f"| Tier agreement | {ta['agreement_pct']}% ({ta['total']} labelled suspects) |\n"
    s += (
        f"| Label-3 in top-3 | {hits['hit_count']}/{hits['total_label3']} "
        f"({', '.join(hits['hit_names']) or 'none'}) |\n"
    )
    if hits["missed_names"]:
        s += f"| Label-3 missed from top-3 | {', '.join(hits['missed_names'])} |\n"
    s += "\n"

    # ── Full ranking table ────────────────────────────────────────────────────
    s += "### Full Ranking\n\n"
    s += _rank_table(result["scored"], result["label_map"])
    s += "\n\n"

    # ── Label-0 ranks ─────────────────────────────────────────────────────────
    s += "### Label-0 Suspect Ranks (should be low ranks / high numbers)\n\n"
    l0 = result["label0_ranks"]
    if not l0:
        s += "_No label-0 suspects in this case._\n"
    else:
        header = "| Suspect | Rank | Score | Tier |\n|---------|------|-------|------|\n"
        rows   = "\n".join(
            f"| {r['name']} | {r['rank']} | {r['score']:.4f} | {r['tier']} |"
            for r in l0
        )
        bad    = [r for r in l0 if r["rank"] <= 3]
        s += header + rows + "\n"
        if bad:
            bnames = ", ".join(r["name"] for r in bad)
            s += f"\n> ⚠️ **False positive alert:** {bnames} rank in top-3 despite label=0\n"
    s += "\n"

    # ── Tier mismatches ───────────────────────────────────────────────────────
    s += "### Tier Mismatches\n\n"
    s += _tier_mismatch_table(ta["mismatches"])
    s += "\n"

    # ── Stability check ───────────────────────────────────────────────────────
    s += "### Stability Check (score change when one suspect is removed)\n\n"
    s += _stability_table(result["stability"])
    max_name  = max(result["stability"], key=result["stability"].get, default="—")
    max_delta = result["stability"].get(max_name, 0)
    s += (
        f"\n> Largest instability: removing **{max_name}** shifts "
        f"other scores by up to **{max_delta:.4f}**.\n"
    )
    s += "\n---\n\n"
    return s


# ══════════════════════════════════════════════════════════════════════════════
# Report builder
# ══════════════════════════════════════════════════════════════════════════════

def build_summary_table(results: list[dict]) -> str:
    """One-line-per-case summary table for the report header."""
    header = (
        "| Case | Version | N | NDCG@5 | Tier Agree | L3 in Top-3 |\n"
        "|------|---------|---|--------|------------|-------------|\n"
    )
    rows = []
    for r in results:
        if "error" in r:
            rows.append(f"| {r['case_id']} | {r['version']} | — | ERROR | — | — |")
            continue
        hits = r["top3_hits"]
        rows.append(
            f"| {r['case_id']} | {r['version'].upper()} | {r['n_suspects']} "
            f"| {r['ndcg5']:.4f} | {r['tier_agreement']['agreement_pct']}% "
            f"| {hits['hit_count']}/{hits['total_label3']} |"
        )
    return header + "\n".join(rows) + "\n"


def write_report(results: list[dict], split: str, version: str) -> None:
    """Write full markdown report to evaluation/report.md."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    title = f"# Crime Investigation DSS — Evaluation Report\n\n"
    meta  = (
        f"**Generated:** {now}  \n"
        f"**Version evaluated:** {version.upper()}  \n"
        f"**Split:** {split}  \n\n"
    )
    freeze_note = (
        "> [!IMPORTANT]\n"
        "> All TEST set labels were frozen **before** any V2 scoring code was written.\n"
        "> Any post-freeze changes to scoring rules will be noted in a `CHANGE LOG` section.\n\n"
    )

    body = title + meta + freeze_note
    body += "## Summary\n\n"
    body += build_summary_table(results)
    body += "\n---\n\n"
    body += "## Per-Case Details\n\n"
    for r in results:
        body += format_case_section(r)

    with open(REPORT_PATH, "w", encoding="utf-8") as fh:
        fh.write(body)
    print(f"\n[OK] Report written to {REPORT_PATH}")


# ══════════════════════════════════════════════════════════════════════════════
# Case loader — ties label JSON to actual case data
# ══════════════════════════════════════════════════════════════════════════════

def _find_pdf_dir(case_id: str, pdf_base: Optional[Path]) -> Optional[Path]:
    """
    Search for a PDF directory matching the case_id slug.
    Checks:
      - pdf_base / case_id
      - calibration/cases / case_id (relative to project root)
    """
    calib_cases = BACKEND / "calibration" / "cases"
    candidates  = []
    if pdf_base:
        candidates.append(pdf_base / case_id)
    candidates.append(calib_cases / case_id)
    # Also try partial match (e.g. "murder_mysuru" matches "murder_mysuru/")
    if calib_cases.exists():
        for d in calib_cases.iterdir():
            if d.is_dir() and case_id in d.name:
                candidates.append(d)
    for c in candidates:
        if c.exists() and c.is_dir():
            return c
    return None


def load_case_for_label(label_json: dict, pdf_base: Optional[Path] = None) -> Optional[dict]:
    """
    Load a case using db_case_id first, then fall back to PDF directory.
    """
    db_id = label_json.get("db_case_id")
    if db_id is not None:
        case_data = load_case_from_db(db_id)
        if case_data:
            return case_data

    # Try PDF directory
    pdf_dir = _find_pdf_dir(label_json["case_id"], pdf_base)
    if pdf_dir:
        return load_case_from_pdfs(pdf_dir)

    print(
        f"WARNING: Cannot load case '{label_json['case_id']}' "
        f"(no DB record, no PDF dir). Skipping."
    )
    return None


# ══════════════════════════════════════════════════════════════════════════════
# Main entry point
# ══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Evaluate Crime Investigation DSS suspect ranking quality."
    )
    parser.add_argument(
        "--version", choices=["v1"], default="v1",
        help="Scoring version to evaluate (default: v1)"
    )
    parser.add_argument(
        "--split", choices=["dev", "test", "both"], default="test",
        help="Which label split to evaluate (default: test)"
    )
    parser.add_argument(
        "--pdf-dir", type=Path, default=None,
        help="Optional base directory for PDF case folders "
             "(overrides calibration/cases lookup)"
    )
    parser.add_argument(
        "--no-report", action="store_true",
        help="Skip writing evaluation/report.md"
    )
    args = parser.parse_args()

    all_labels = load_all_labels()
    if not all_labels:
        print(f"ERROR: No label files found in {LABELS_DIR}")
        sys.exit(1)

    # Filter by split
    if args.split == "dev":
        selected = {k: v for k, v in all_labels.items() if k in DEV_CASES}
    elif args.split == "test":
        selected = {k: v for k, v in all_labels.items() if k in TEST_CASES}
    else:
        selected = all_labels

    if not selected:
        print(
            f"WARNING: No label files matched split '{args.split}'.\n"
            f"Available cases: {list(all_labels)}"
        )
        sys.exit(0)

    results = []
    for case_id, label_json in sorted(selected.items()):
        print(f"\n{'='*60}")
        print(f"Evaluating: {case_id}  (version={args.version})")
        print("="*60)

        case_data = load_case_for_label(label_json, args.pdf_base if hasattr(args, "pdf_base") else args.pdf_dir)
        if case_data is None:
            results.append({
                "error"  : "Case data not found",
                "case_id": case_id,
                "version": args.version,
            })
            continue

        result = evaluate_case(case_data, label_json, version=args.version)
        results.append(result)

        # ── Print to stdout ─────────────────────────────────────────────────
        if "error" not in result:
            print(f"\nNDCG@5:         {result['ndcg5']:.4f}")
            print(f"Tier agreement: {result['tier_agreement']['agreement_pct']}%")
            hits = result["top3_hits"]
            print(f"Label-3 top-3:  {hits['hit_count']}/{hits['total_label3']}")
            print("\n--- Full ranking ---")
            name_to_label = {k.lower(): v for k, v in label_json["labels"].items()}
            for s in result["scored"]:
                lbl = name_to_label.get(s["name"].lower(), "?")
                print(
                    f"  #{s['rank']:>2}  {s['name']:<22} "
                    f"score={s['final_score']:.4f}  tier={s.get('priority','?'):<20}  "
                    f"label={lbl}"
                )
            if result["label0_ranks"]:
                bad = [r for r in result["label0_ranks"] if r["rank"] <= 5]
                if bad:
                    print("\n[!] Label-0 suspects appearing in top-5:")
                    for r in bad:
                        print(f"     {r['name']} rank={r['rank']} score={r['score']:.4f}")
        else:
            print(f"ERROR: {result['error']}")

    # ── Write report ──────────────────────────────────────────────────────────
    if not args.no_report and results:
        write_report(results, args.split, args.version)


if __name__ == "__main__":
    main()
