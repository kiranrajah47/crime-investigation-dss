"""
suspect_tracker.py
------------------
Utility module to track repeat suspects across multiple cases.
"""

from models import Case


def _normalize_name(name: str) -> str:
    """
    Normalize suspect name for case-insensitive matching,
    collapsing multiple whitespace characters into single spaces.
    """
    if not name:
        return ""
    return " ".join(name.strip().lower().split())


def find_repeat_suspects(current_case_id, suspect_names, top_n=4):
    """
    Searches all past cases (excluding current_case_id)
    for any suspect name that appeared in the top N
    ranked positions of the report_json field.

    Returns a list of dicts:
    [{
      "name": suspect_name,
      "appeared_in_cases": [
        {"case_id": ..., "title": ..., "rank": ..., "score": ..., "date": ...}
      ],
      "total_appearances": int
    }]

    Match suspect names case-insensitively, allowing
    for minor whitespace differences.
    """
    if not suspect_names:
        return []

    # Fetch all cases excluding current_case_id (comparing both integer primary key and case_id string)
    all_cases = Case.query.filter(
        Case.id != current_case_id,
        Case.case_id != str(current_case_id)
    ).all()

    repeat_results = []

    for suspect_name in suspect_names:
        norm_target = _normalize_name(suspect_name)
        if not norm_target:
            continue

        appeared_in_cases = []

        for case in all_cases:
            try:
                report = case.get_report()
            except Exception:
                continue

            if not report or not isinstance(report, list):
                continue

            top_entries = report[:top_n]
            for idx, entry in enumerate(top_entries):
                entry_name = entry.get("name", "")
                if _normalize_name(entry_name) == norm_target:
                    rank = entry.get("rank", idx + 1)
                    score = entry.get("final_score", 0.0)
                    appeared_in_cases.append({
                        "case_id": case.case_id,
                        "title": case.title or case.case_id,
                        "rank": rank,
                        "score": score,
                        "date": case.formatted_date()
                    })
                    break

        total_appearances = len(appeared_in_cases) + 1  # Including current case

        repeat_results.append({
            "name": suspect_name,
            "appeared_in_cases": appeared_in_cases,
            "total_appearances": total_appearances
        })

    return repeat_results
