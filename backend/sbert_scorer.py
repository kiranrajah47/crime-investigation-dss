"""
sbert_scorer.py
---------------
Optional Sentence-BERT similarity scorer using sentence-transformers.
Completely isolated feature — does not affect main TF-IDF pipeline.
"""

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def sbert_similarity(text_a: str, text_b: str) -> float:
    if not text_a or not text_b:
        return 0.0
    model = get_model()
    embeddings = model.encode([text_a, text_b])
    return float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
