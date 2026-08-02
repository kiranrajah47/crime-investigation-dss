"""
nlp_engine.py
-------------
Handles all text preprocessing for the Crime Investigation DSS.
Called first in the pipeline before TF-IDF vectorization.

Functions:
    preprocess(text)        -> cleaned string
    preprocess_file(path)   -> cleaned string (reads a .txt or .docx file)
    extract_keywords(text)  -> list of meaningful keywords
"""

import re
import string
import os

import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Download required NLTK data on first run
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)


# ── Constants ──────────────────────────────────────────────────────────────────

STOP_WORDS = set(stopwords.words("english"))

# Extra domain-specific words that carry no investigative meaning
CUSTOM_STOP_WORDS = {
    "said", "also", "would", "could", "one", "two", "three",
    "found", "known", "stated", "reported", "according",
}

ALL_STOP_WORDS = STOP_WORDS | CUSTOM_STOP_WORDS

stemmer = PorterStemmer()


# ── Core preprocessing ─────────────────────────────────────────────────────────

def preprocess(text: str, stem: bool = False) -> str:
    """
    Clean and normalize a raw text string.

    Steps:
        1. Lowercase
        2. Remove punctuation and special characters
        3. Tokenize into words
        4. Remove stop words
        5. Optionally stem each token (off by default for readability)

    Args:
        text : Raw input string
        stem : If True, applies Porter stemming (useful for TF-IDF matching)

    Returns:
        Single cleaned string with tokens joined by spaces
    
    Example:
        >>> preprocess("John was found near the victim's house at 10PM!")
        'john near victim house 10pm'
    """
    if not text or not isinstance(text, str):
        return ""

    # Step 1: Lowercase
    text = text.lower()

    # Step 2: Remove punctuation and non-alphanumeric characters
    #         Keep spaces and alphanumeric only
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Step 3: Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()

    # Step 4: Tokenize
    tokens = word_tokenize(text)

    # Step 5: Remove stop words and very short tokens (length <= 2)
    tokens = [t for t in tokens if t not in ALL_STOP_WORDS and len(t) > 2]

    # Step 6: Optional stemming
    if stem:
        tokens = [stemmer.stem(t) for t in tokens]

    return " ".join(tokens)


# ── File reader ────────────────────────────────────────────────────────────────

def preprocess_file(filepath: str, stem: bool = False) -> str:
    """
    Read a .txt or .docx file and return its preprocessed text.

    Args:
        filepath : Absolute or relative path to the file
        stem     : Passed through to preprocess()

    Returns:
        Cleaned string ready for TF-IDF vectorization

    Raises:
        ValueError if file type is unsupported
        FileNotFoundError if file does not exist
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    ext = os.path.splitext(filepath)[1].lower()

    if ext == ".txt":
        with open(filepath, "r", encoding="utf-8") as f:
            raw_text = f.read()

    elif ext == ".docx":
        # python-docx reads Word documents
        try:
            from docx import Document
        except ImportError:
            raise ImportError("python-docx is required to read .docx files. Run: pip install python-docx")
        doc = Document(filepath)
        raw_text = "\n".join([para.text for para in doc.paragraphs])

    else:
        raise ValueError(f"Unsupported file type '{ext}'. Please upload .txt or .docx files.")

    return preprocess(raw_text, stem=stem)


# ── Keyword extractor ──────────────────────────────────────────────────────────

def extract_keywords(text: str, top_n: int = 10) -> list:
    """
    Extract the most frequent meaningful words from a text.
    Used by ranker.py to generate the evidence signal tags
    shown on the investigator dashboard.

    Args:
        text  : Raw or already-preprocessed text
        top_n : Number of top keywords to return

    Returns:
        List of (word, frequency) tuples sorted by frequency descending

    Example:
        >>> extract_keywords("Rajan was near the victim house. Rajan had conflict.", top_n=3)
        [('rajan', 2), ('near', 1), ('victim', 1)]
    """
    cleaned = preprocess(text)
    tokens = cleaned.split()

    # Count word frequencies
    freq = {}
    for token in tokens:
        freq[token] = freq.get(token, 0) + 1

    # Sort by frequency descending
    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)

    return sorted_keywords[:top_n]


# ── Quick self-test ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    sample = """
    The victim, Priya Sharma, was found unconscious near the warehouse at 11 PM.
    A broken bottle was recovered at the scene. Witnesses reported seeing a man
    wearing a blue jacket arguing with the victim earlier that evening.
    The suspect Rajan Shetty had a prior conflict with the victim over a financial dispute.
    """

    print("=== preprocess() output ===")
    print(preprocess(sample))

    print("\n=== extract_keywords() output ===")
    for word, freq in extract_keywords(sample, top_n=8):
        print(f"  {word}: {freq}")
