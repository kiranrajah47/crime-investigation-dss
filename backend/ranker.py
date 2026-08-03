"""
ranker.py
---------
Handles final suspect ranking and human-readable explanation generation.
Called after scoring.py in the pipeline.

This module answers:
    "Given the scores, how do we present the ranked list to the investigator
     in a clear, transparent, and explainable way?"

Functions:
    rank_suspects(scored_suspects)              -> list of ranked dicts
    build_explanation(suspect_result)           -> str (plain English reasoning)
    classify_keywords(keywords, suspect_text,
                      evidence_text)            -> list of tagged signal dicts
    build_full_report(suspects, victim_text,
                      evidence_text)            -> final report list for Flask
"""

from scoring import score_all_suspects
from nlp_engine import extract_keywords


# ── Contextual signal phrase patterns ─────────────────────────────────────────
#
# Each entry is (phrase_to_match, display_label, type).
# Matched against suspect profile text AND evidence document text.
# More specific phrases produce more meaningful dashboard tags.

SIGNAL_PATTERNS = [
    # Physical forensic — against
    ("fingerprint",           "Fingerprint at scene",    "against"),
    ("partial fingerprint",   "Partial fingerprint",     "against"),
    ("dna",                   "DNA evidence",            "against"),
    ("blood",                 "Blood evidence",          "against"),
    ("weapon",                "Weapon recovered",        "against"),
    ("iron rod",              "Iron rod recovered",      "against"),
    ("broken glass",          "Broken glass at scene",   "against"),
    # CCTV — against
    ("cctv footage",          "CCTV footage match",      "against"),
    ("cctv",                  "CCTV evidence",           "against"),
    ("camera",                "Camera recording",        "against"),
    # Witness — against
    ("witness",               "Eyewitness account",      "against"),
    ("seen near",             "Placed near scene",       "against"),
    ("seen arguing",          "Witnessed arguing",       "against"),
    # Motive — against
    ("financial dispute",     "Financial dispute",       "against"),
    ("unpaid",                "Unpaid debt motive",      "against"),
    ("debt",                  "Debt motive",             "against"),
    ("argument",              "Prior argument",          "against"),
    ("conflict",              "Known conflict",          "against"),
    ("threatening",           "Threatening behaviour",   "against"),
    ("motive",                "Clear motive",            "against"),
    # History — against
    ("prior",                 "Prior criminal record",   "against"),
    ("assault",               "Prior assault case",      "against"),
    ("restraining order",     "Restraining order filed", "against"),
    ("criminal record",       "Criminal record",         "against"),
    # Alibi issues — against
    ("no alibi",              "No alibi",                "against"),
    ("unverified alibi",      "Unverified alibi",        "against"),
    ("no witness",            "No alibi witness",        "against"),
    # Phone/digital — against
    ("missed calls",          "Missed calls on phone",   "against"),
    ("phone records",         "Phone records match",     "against"),
    ("initials",              "Initials match",          "against"),
    # Strong alibi — for
    ("strong verified alibi", "Strong verified alibi",   "for"),
    ("fully accounted",       "Fully accounted for",     "for"),
    ("multiple independent",  "Multiple witnesses",      "for"),
    ("cctv confirms",         "CCTV confirms alibi",     "for"),
    ("not present",           "Not present at scene",    "for"),
    ("character witness",     "Character witnesses",     "for"),
    ("no prior",              "No prior record",         "for"),
    ("no criminal",           "No criminal history",     "for"),
    ("no conflict",           "No known conflict",       "for"),
    ("no evidence",           "No physical evidence",    "for"),
    ("no connection",         "No connection to victim", "for"),
    ("accounted for",         "Location confirmed",      "for"),
]


# ── Ranking ────────────────────────────────────────────────────────────────────

def rank_suspects(scored_suspects: list) -> list:
    """
    Assign rank numbers to an already-sorted list of scored suspects.

    The list coming from score_all_suspects() is already sorted by
    final_score descending. This function just adds a 'rank' field.

    Args:
        scored_suspects : List of score dicts from scoring.score_all_suspects()

    Returns:
        Same list with 'rank' key added (1 = highest suspicion)

    Example:
        >>> ranked = rank_suspects(results)
        >>> ranked[0]['rank']
        1
    """
    for i, suspect in enumerate(scored_suspects):
        suspect["rank"] = i + 1
    return scored_suspects


# ── Keyword signal classifier ──────────────────────────────────────────────────

def classify_keywords(
    suspect_text: str,
    evidence_text: str,
    top_n: int = 6
) -> list:
    """
    Scan the suspect's profile and classify key signals as:
        - 'against'  (red tag  — increases suspicion)
        - 'for'      (green tag — supports innocence)
        - 'neutral'  (gray tag  — present but inconclusive)

    These become the coloured evidence tags on the dashboard.

    Args:
        suspect_text  : Raw suspect profile text
        evidence_text : Raw evidence document text
        top_n         : Max number of tags to return

    Returns:
        List of dicts: [{'label': 'Fingerprint at scene', 'type': 'against'}, ...]
    """
    text_lower     = suspect_text.lower()
    evidence_lower = evidence_text.lower()
    seen_labels    = set()
    signals        = []

    # Match contextual signal patterns against both suspect profile and evidence
    for phrase, label, sig_type in SIGNAL_PATTERNS:
        if label in seen_labels:
            continue
        # Check suspect profile first, then evidence doc for corroboration
        in_suspect  = phrase in text_lower
        in_evidence = phrase in evidence_lower
        if in_suspect or (in_evidence and sig_type == "against"):
            signals.append({"label": label, "type": sig_type})
            seen_labels.add(label)
        if len(signals) >= top_n:
            break

    # Fill remaining slots with neutral TF-IDF keywords if needed
    if len(signals) < top_n:
        top_kws = extract_keywords(suspect_text, top_n=top_n * 2)
        for word, _ in top_kws:
            already = any(word in s["label"].lower() for s in signals)
            if not already and len(word) > 3:
                signals.append({"label": word.capitalize(), "type": "neutral"})
            if len(signals) >= top_n:
                break

    return signals[:top_n]


# ── Explanation builder ────────────────────────────────────────────────────────

def build_explanation(suspect_result: dict, suspect_text: str) -> str:
    """
    Generate a plain English explanation paragraph for one suspect's ranking.
    This text appears under each suspect card on the investigator dashboard.

    The explanation is built from the actual score data — not hardcoded —
    so it reflects the real analysis output.

    Args:
        suspect_result : Dict returned by scoring.compute_score()
        suspect_text   : Raw profile text of the suspect

    Returns:
        Human-readable string explaining why this suspect got their score.

    Example output:
        "Suspect profile shows high similarity (0.84) with evidence document.
         Key matching terms include: fingerprint, blue jacket, financial dispute.
         Alibi claim was not strongly supported in the profile.
         Past conflict or criminal history detected, increasing suspicion score."
    """
    name          = suspect_result["name"]
    final_score   = suspect_result["final_score"]
    evidence_sim  = suspect_result["evidence_sim"]
    victim_sim    = suspect_result["victim_sim"]
    alibi_score   = suspect_result["alibi_score"]
    history_score = suspect_result["past_history_score"]
    keywords      = suspect_result["top_keywords"]
    priority      = suspect_result["priority"]

    lines = []

    # Line 1: Overall similarity with evidence
    if evidence_sim >= 0.60:
        lines.append(
            f"Suspect profile shows strong overlap ({evidence_sim}) with the evidence document."
        )
    elif evidence_sim >= 0.30:
        lines.append(
            f"Suspect profile shows moderate overlap ({evidence_sim}) with the evidence document."
        )
    else:
        lines.append(
            f"Suspect profile shows low overlap ({evidence_sim}) with the evidence document."
        )

    # Line 2: Victim document similarity
    if victim_sim >= 0.50:
        lines.append(
            f"Profile also closely matches the victim and incident details (similarity: {victim_sim})."
        )
    elif victim_sim >= 0.25:
        lines.append(
            f"Some connection found with victim and incident details (similarity: {victim_sim})."
        )
    else:
        lines.append(
            f"Little connection found with victim and incident details (similarity: {victim_sim})."
        )

    # Line 3: Top matching keywords
    if keywords:
        kw_str = ", ".join(keywords[:5])
        lines.append(f"Key matching terms include: {kw_str}.")

    # Line 4: Alibi assessment
    if alibi_score >= 0.20:
        lines.append(
            "A verifiable alibi was detected in the profile, which reduces the suspicion score."
        )
    else:
        lines.append(
            "No strong alibi was found in the suspect profile."
        )

    # Line 5: Past history
    if history_score >= 0.15:
        lines.append(
            "Past conflict or criminal history was detected, which increases the weighted score."
        )
    else:
        lines.append(
            "No significant past history or conflict was found in the profile."
        )

    # Line 6: Final note using the single priority classification
    lines.append(
        f"Final weighted score: {final_score} — classified as {priority}."
    )

    return " ".join(lines)


# ── Full report builder (called by app.py) ────────────────────────────────────

def build_full_report(
    suspects: list,
    victim_text: str,
    evidence_text: str,
    custom_weights: dict = None
) -> list:
    """
    Master function that runs the complete pipeline for all suspects
    and returns a fully enriched report list ready for Flask to render.

    This is the ONLY function app.py needs to call from this module.

    Args:
        suspects      : List of dicts [{'name': ..., 'text': ...}, ...]
        victim_text   : Raw text of Document 1 (victim + incident)
        evidence_text : Raw text of Document 2 (evidence recovered)

    Returns:
        List of fully enriched suspect dicts, each containing:
            - rank, name, final_score, priority
            - score_breakdown (for the bar charts)
            - explanation (plain English paragraph)
            - signals (list of coloured evidence tags)
            - top_keywords
    """

    # Step 1: Score all suspects and sort by final_score
    scored = score_all_suspects(suspects, victim_text, evidence_text, custom_weights=custom_weights)

    # Step 2: Assign rank numbers
    ranked = rank_suspects(scored)

    # Step 3: Enrich each suspect with explanation and signal tags
    report = []
    for suspect_result in ranked:

        # Find the original raw text for this suspect
        original = next(
            (s for s in suspects if s["name"] == suspect_result["name"]),
            {"text": ""}
        )
        suspect_text = original["text"]

        # Build plain English explanation
        explanation = build_explanation(suspect_result, suspect_text)

        # Build coloured evidence signal tags
        signals = classify_keywords(suspect_text, evidence_text)

        # Combine everything into one dict for the template
        enriched = {
            **suspect_result,          # All score fields
            "explanation" : explanation,
            "signals"     : signals,
        }
        report.append(enriched)

    return report


# ── Quick self-test ────────────────────────────────────────────────────────────

if __name__ == "__main__":

    victim_doc = """
    Victim: Priya Sharma, age 32.
    She was found unconscious near the old warehouse on MG Road at 11 PM on Friday.
    A broken glass bottle was recovered at the scene.
    Witnesses reported seeing a man in a blue jacket arguing with her earlier that evening.
    The victim had a known financial dispute with a colleague.
    """

    evidence_doc = """
    Evidence recovered at scene:
    1. Broken glass bottle with partial fingerprint — sent for forensic analysis.
    2. CCTV footage from nearby shop shows a man in blue jacket near warehouse at 10:45 PM.
    3. Witness statement: Kavitha saw suspect arguing loudly with victim at 9 PM.
    4. Victim's phone shows 3 missed calls from contact saved as R.S. between 8-10 PM.
    5. Financial records show an unpaid debt of Rs. 50,000 between victim and a male colleague.
    """

    suspects = [
        {
            "name": "Rajan Shetty",
            "text": """
            Rajan Shetty, age 35. Colleague of the victim. Had an ongoing financial dispute
            over an unpaid amount of Rs. 50,000. Witnesses confirm he was seen arguing with
            the victim that evening. He owns a blue jacket. Claims he was at home but has
            no alibi witness to confirm this. His initials R.S. match missed calls on
            victim's phone. Prior assault case in 2019, charges dropped.
            History of conflict with colleagues.
            """
        },
        {
            "name": "Meera Nair",
            "text": """
            Meera Nair, age 29. Former friend of the victim. Had a minor financial dispute
            over shared rent. One witness says she was seen near the area that evening but
            could not confirm the exact time. No physical evidence directly links her to
            the scene. Partial alibi — was at a restaurant but left early. No prior
            criminal record.
            """
        },
        {
            "name": "Suresh Kamath",
            "text": """
            Suresh Kamath, age 41. Distant acquaintance of the victim. No known conflict.
            Strong verified alibi — multiple independent witnesses confirm he was at a
            family wedding in Udupi the entire evening. CCTV confirms his presence there.
            No prior criminal record. No financial connection to the victim. Not present
            at scene. Fully accounted for.
            """
        },
    ]

    print("=== Full Investigation Report ===\n")
    report = build_full_report(suspects, victim_doc, evidence_doc)

    for r in report:
        print(f"Rank #{r['rank']}: {r['name']}  |  Score: {r['final_score']}  |  {r['priority']}")
        print(f"  Signals     : {[s['label'] + ' (' + s['type'] + ')' for s in r['signals']]}")
        print(f"  Explanation : {r['explanation']}")
        print()
