"""
validation_checks.py
--------------------
Document coherence validation check for Crime Investigation DSS.
Provides additive validation checks to detect potential document mismatches
without affecting existing suspect scoring logic.
"""

from tfidf_scorer import preprocess, build_tfidf_matrix, cosine_similarity_score


def check_document_coherence(victim_text: str, evidence_text: str, suspect_scores: list) -> dict:
    """
    Returns a dict with warning flags:
    {
      "victim_evidence_mismatch": bool,
      "victim_evidence_similarity": float,
      "all_suspects_low_overlap": bool,
      "highest_suspect_score": float
    }

    Implementation:
    1. Compute cosine similarity between victim_text and evidence_text using the
       same preprocessing and TF-IDF approach in tfidf_scorer.py.
       If similarity < 0.10 -> victim_evidence_mismatch = True.
    2. Look at suspect_scores (already computed list of scored suspects).
       Find the highest final_score among all suspects.
       If highest final_score < 0.15 -> all_suspects_low_overlap = True.
    """
    clean_victim = preprocess(victim_text or "")
    clean_evidence = preprocess(evidence_text or "")

    matrix, _ = build_tfidf_matrix([clean_victim, clean_evidence])
    raw_sim = cosine_similarity_score(matrix[0], matrix[1])
    victim_evidence_sim = float(round(raw_sim, 4))

    victim_evidence_mismatch = bool(victim_evidence_sim < 0.10)

    if suspect_scores and len(suspect_scores) > 0:
        scores_list = [s.get("final_score", 0.0) for s in suspect_scores if isinstance(s, dict)]
        highest_suspect_score = float(max(scores_list)) if scores_list else 0.0
    else:
        highest_suspect_score = 0.0

    highest_suspect_score = float(round(highest_suspect_score, 4))
    all_suspects_low_overlap = bool(highest_suspect_score < 0.15)

    return {
        "victim_evidence_mismatch": victim_evidence_mismatch,
        "victim_evidence_similarity": victim_evidence_sim,
        "all_suspects_low_overlap": all_suspects_low_overlap,
        "highest_suspect_score": highest_suspect_score,
    }
