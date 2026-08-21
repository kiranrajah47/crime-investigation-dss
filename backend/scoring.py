"""
scoring.py
----------
Handles evidence weight assignment and final score aggregation.
Called after tfidf_scorer.py in the pipeline.

This module answers:
    "Given the raw similarity scores, what is the final weighted
     relevance score for each suspect?"

Different types of evidence carry different investigative weight.
Physical forensic evidence is more reliable than an unverified alibi,
so it gets a higher weight in the final score.

Functions:
    compute_score(suspect_text, victim_text, evidence_text) -> dict
    score_all_suspects(suspects, victim_text, evidence_text) -> list of dicts
"""

from tfidf_scorer import score_suspect_against_docs
from nlp_engine import preprocess, extract_keywords
from validation_checks import check_document_coherence


# ── Evidence weights ───────────────────────────────────────────────────────────
#
# These weights control how much each evidence category contributes
# to the final suspect score.
#
# Rules:
#   - Physical evidence and witness statements are the strongest signals
#   - Past criminal history adds moderate suspicion
#   - A strong alibi REDUCES the score (negative weight)
#
# All weights should sum to approximately 1.0 for a clean 0–1 output range.
# You can tune these values based on the case type.

WEIGHTS = {
    "physical_evidence" : 0.50,   # Forensic items, CCTV, fingerprints
    "witness_statement" : 0.30,   # Eyewitness accounts linking suspect
    "past_history"      : 0.25,   # Prior criminal record or conflicts
    "alibi_penalty"     : -0.40,  # Verified alibi strongly reduces score
}

# ── Strong alibi phrases — these are specific multi-word phrases that clearly
# indicate a verified, independent alibi. Generic words like "confirmed" or
# "verified" are intentionally excluded to prevent false positives on
# suspects whose alibi claims are unverified.
ALIBI_KEYWORDS = [
    "strong verified alibi",
    "fully accounted for",
    "multiple independent witnesses confirm",
    "cctv confirms his presence",
    "cctv confirms her presence",
    "not present at scene",
    "independent witness confirms",
    "alibi confirmed by",
    "verified alibi",
    "no alibi needed",
    "confirmed attendance",
    "wedding reception",
    "hotel cctv confirms",
    "fully wired",
    "fully cooperative",
    "cooperating fully",
    "not implicated",
    "no evidence found",
    "cleared",
    "confirmed by",
    "corroborated",
    "verified by",
    "independent witnesses",
    "accounted for",
    "hotel records",
    "flight tickets",
    "check-in records",
    "travel tickets",
    "seminar attendance",
    "fully verified",
    "family confirms",
    "colleagues confirm",
    "multiple witnesses confirm",
]

HISTORY_KEYWORDS = [
    "prior", "previous", "criminal", "record", "arrested", "assault",
    "charged", "convicted", "case filed", "offence", "offense",
    "history of violence", "restraining order", "conflict",
    "absconding", "absconded", "warrant", "non-bailable warrant",
    "fled", "primary accused", "main accused", "switched off",
    "untraceable", "anticipatory bail", "lookout notice",
    "enforcement directorate", "attached", "provisional attachment",
    "threatened", "threat", "terminated", "fired", "dismissed",
    "grudge", "uninvited", "insider knowledge", "visited",
    "angry", "hostile", "prior complaint", "verbal threat",
    "public statement", "revenge", "made threats",
]

EVIDENCE_KEYWORDS = [
    "fingerprint", "cctv", "footage", "witness", "seen near",
    "phone records", "weapon", "blood", "dna", "forensic",
    "blue jacket", "debt", "dispute", "argument", "missed calls",
]


# ── Keyword detector helpers ───────────────────────────────────────────────────

def _contains_keywords(text: str, keyword_list: list) -> float:
    """
    Check how many keywords from a list appear in the text.
    Returns a normalized score between 0.0 and 1.0.

    Args:
        text         : Cleaned or raw suspect profile text
        keyword_list : List of keywords/phrases to search for

    Returns:
        Float — ratio of matched keywords to total keywords in list
    """
    text_lower = text.lower()
    matches = sum(1 for kw in keyword_list if kw in text_lower)
    return round(matches / len(keyword_list), 4)


def _detect_alibi_strength(suspect_text: str) -> float:
    """
    Estimate how strong the suspect's alibi is based on keyword presence.

    Returns:
        Float 0.0–1.0 where 1.0 = very strong alibi (many alibi keywords found)
    """
    return _contains_keywords(suspect_text, ALIBI_KEYWORDS)


def _detect_history_strength(suspect_text: str) -> float:
    """
    Estimate how much past criminal/conflict history is present in the profile.

    Returns:
        Float 0.0–1.0 where 1.0 = strong history of conflict or crime
    """
    return _contains_keywords(suspect_text, HISTORY_KEYWORDS)


# ── Main scoring function ──────────────────────────────────────────────────────

def compute_score(
    suspect_name: str,
    suspect_text: str,
    victim_text: str,
    evidence_text: str,
    custom_weights: dict = None
) -> dict:
    """
    Compute the final weighted relevance score for one suspect.

    Pipeline:
        1. Get raw TF-IDF similarity scores from tfidf_scorer
        2. Detect alibi strength and past history from profile keywords
        3. Apply weights to each component
        4. Sum into a final score (clamped to 0.0–1.0)
        5. Return full breakdown for the dashboard

    Args:
        suspect_name  : Display name of the suspect (e.g. "Rajan Shetty")
        suspect_text  : Full text of this suspect's profile section
        victim_text   : Full text of Document 1
        evidence_text : Full text of Document 2

    Returns:
        Dictionary with:
            'name'               : suspect name
            'final_score'        : float 0.0–1.0 (used for ranking)
            'evidence_sim'       : raw evidence similarity score
            'victim_sim'         : raw victim similarity score
            'past_history_score' : detected history strength
            'alibi_score'        : detected alibi strength (higher = stronger alibi)
            'top_keywords'       : list of top matching terms
            'score_breakdown'    : dict of each component's weighted contribution
    """

    # Step 1: Get TF-IDF based similarity scores
    tfidf_scores = score_suspect_against_docs(suspect_text, victim_text, evidence_text)

    evidence_sim = tfidf_scores["evidence_similarity"]
    victim_sim   = tfidf_scores["victim_similarity"]
    top_keywords = tfidf_scores["top_keywords"]

    # Use custom weights from sliders if provided, else fall back to defaults
    w = custom_weights if custom_weights else WEIGHTS

    # Step 2: Detect alibi and history from profile text
    alibi_strength   = _detect_alibi_strength(suspect_text)
    history_strength = _detect_history_strength(suspect_text)

    # Step 3: Compute weighted contributions using selected weights
    physical_contribution = evidence_sim     * w["physical_evidence"]
    witness_contribution  = victim_sim       * w["witness_statement"]
    history_contribution  = history_strength * w["past_history"]
    alibi_contribution    = alibi_strength   * w["alibi_penalty"]  # negative

    # Step 4: Sum all weighted components
    raw_score = (
        physical_contribution
        + witness_contribution
        + history_contribution
        + alibi_contribution
    )

    # Step 5: Clamp final score to [0.0, 1.0]
    final_score = round(max(0.0, min(1.0, raw_score)), 4)

    # Step 6: Determine priority label for dashboard
    if final_score >= 0.55:
        priority = "Primary suspect"
    elif final_score >= 0.30:
        priority = "Secondary suspect"
    else:
        priority = "Low concern"

    return {
        "name"               : suspect_name,
        "final_score"        : final_score,
        "priority"           : priority,
        "evidence_sim"       : evidence_sim,
        "victim_sim"         : victim_sim,
        "past_history_score" : round(history_strength, 4),
        "alibi_score"        : round(alibi_strength, 4),
        "top_keywords"       : top_keywords,
        "score_breakdown"    : {
            "physical_evidence" : round(physical_contribution, 4),
            "witness_statement" : round(witness_contribution, 4),
            "past_history"      : round(history_contribution, 4),
            "alibi_penalty"     : round(alibi_contribution, 4),
        },
        "weights_used" : w,
    }


# ── Batch scoring for all suspects ────────────────────────────────────────────

def score_all_suspects(
    suspects: list,
    victim_text: str,
    evidence_text: str,
    custom_weights: dict = None
) -> list:
    """
    Score every suspect in the list and return results sorted by final_score.

    Args:
        suspects       : List of dicts, each with keys 'name' and 'text'
        victim_text    : Full text of Document 1
        evidence_text  : Full text of Document 2
        custom_weights : Optional weights dict from the upload form sliders

    Returns:
        List of score dicts sorted by final_score descending (highest first)
    """
    results = []

    for suspect in suspects:
        score = compute_score(
            suspect_name   = suspect["name"],
            suspect_text   = suspect["text"],
            victim_text    = victim_text,
            evidence_text  = evidence_text,
            custom_weights = custom_weights,
        )
        results.append(score)

    # Sort by final_score descending — highest suspicion first
    results.sort(key=lambda x: x["final_score"], reverse=True)

    return results


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
    3. Witness statement: Kavitha (neighbour) saw suspect arguing loudly with victim at 9 PM.
    4. Victim's phone shows 3 missed calls from contact saved as 'R.S.' between 8–10 PM.
    5. Financial records show an unpaid debt of Rs. 50,000 between victim and a male colleague.
    """

    suspects = [
        {
            "name": "Rajan Shetty",
            "text": """
            Rajan Shetty, age 35. Colleague of the victim. Had an ongoing financial dispute
            over an unpaid amount of Rs. 50,000. Witnesses confirm he was seen arguing with
            the victim that evening. He owns a blue jacket. Claims he was at home but has
            no alibi witness. His initials R.S. match missed calls on victim's phone.
            Prior assault case in 2019, charges dropped. History of conflict with colleagues.
            """
        },
        {
            "name": "Meera Nair",
            "text": """
            Meera Nair, age 29. Former friend of the victim. Had a minor financial dispute
            over shared rent. One witness says she was seen near the area that evening but
            could not confirm the exact time. No physical evidence directly links her to
            the scene. Partially confirmed alibi — was at a restaurant but left early.
            No prior criminal record.
            """
        },
        {
            "name": "Suresh Kamath",
            "text": """
            Suresh Kamath, age 41. Distant acquaintance of the victim. No known conflict.
            Strong verified alibi — multiple independent witnesses confirm he was at a
            family wedding in Udupi the entire evening. CCTV confirms his presence there.
            No prior criminal record. No financial connection to the victim. Not present
            at scene. Fully accounted for during the time of the incident.
            """
        },
    ]

    print("=== Scoring all suspects ===\n")
    results = score_all_suspects(suspects, victim_doc, evidence_doc)

    for rank, r in enumerate(results, start=1):
        print(f"Rank #{rank}: {r['name']}")
        print(f"  Final score  : {r['final_score']}  ({r['priority']})")
        print(f"  Breakdown    : {r['score_breakdown']}")
        print(f"  Top keywords : {r['top_keywords']}")
        print()
