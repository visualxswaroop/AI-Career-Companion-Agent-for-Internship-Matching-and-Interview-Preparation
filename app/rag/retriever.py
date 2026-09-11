"""
RAG Retriever for Career Companion Career Assistant.

Loads the FAISS index and metadata at module level (lazy singleton).
Provides `retrieve(query, top_k)` to get relevant knowledge chunks.
"""

import json
from pathlib import Path
from typing import Any

import faiss
import numpy as np

# ──────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
INDEX_PATH = PROJECT_ROOT / "data" / "rag" / "index.faiss"
METADATA_PATH = PROJECT_ROOT / "data" / "rag" / "metadata.json"

EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension
DEFAULT_TOP_K = 5
SIMILARITY_THRESHOLD = 0.35  # Minimum cosine similarity score to include


# ──────────────────────────────────────────────────────────────────
# Lazy Singletons
# ──────────────────────────────────────────────────────────────────

_index: faiss.IndexFlatIP | None = None
_metadata: list[dict[str, Any]] | None = None
_embedding_model = None


def _load_index() -> tuple[faiss.IndexFlatIP, list[dict[str, Any]]]:
    """Load FAISS index and metadata (call once per process)."""
    global _index, _metadata

    if _index is not None and _metadata is not None:
        return _index, _metadata

    if not INDEX_PATH.exists():
        raise FileNotFoundError(
            f"RAG index not found at {INDEX_PATH}. "
            "Run: python -m app.rag.ingest"
        )

    if not METADATA_PATH.exists():
        raise FileNotFoundError(
            f"RAG metadata not found at {METADATA_PATH}. "
            "Run: python -m app.rag.ingest"
        )

    _index = faiss.read_index(str(INDEX_PATH))
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        _metadata = json.load(f)

    return _index, _metadata


def _get_embedding_model():
    """Load embedding model (lazy singleton)."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _embedding_model


# ──────────────────────────────────────────────────────────────────
# Retrieval
# ──────────────────────────────────────────────────────────────────

def embed_query(query: str) -> np.ndarray:
    """
    Embed a query string using the shared embedding model.
    Returns L2-normalized embedding for cosine similarity.
    """
    model = _get_embedding_model()
    embedding = model.encode([query], show_progress_bar=False).astype(np.float32)

    # L2-normalize for cosine similarity via inner product
    norm = np.linalg.norm(embedding, axis=1, keepdims=True)
    if norm[0, 0] > 0:
        embedding = embedding / norm

    return embedding


def retrieve(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    threshold: float = SIMILARITY_THRESHOLD,
) -> list[dict[str, Any]]:
    """
    Retrieve the top-k most relevant knowledge chunks for a query.

    Args:
        query: User's question or statement
        top_k: Maximum number of chunks to return
        threshold: Minimum cosine similarity score (0-1) to include

    Returns:
        List of dicts with keys: chunk_id, source, section, topic, text, score
    """
    index, metadata = _load_index()

    if index.ntotal == 0:
        return []

    # Embed the query
    query_embedding = embed_query(query)

    # Search
    actual_k = min(top_k, index.ntotal)
    scores, indices = index.search(query_embedding, actual_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue  # FAISS returns -1 for unfilled slots
        if float(score) < threshold:
            continue  # Below similarity threshold

        chunk = metadata[idx].copy()
        chunk["score"] = float(score)
        results.append(chunk)

    return results


def is_index_available() -> bool:
    """Check if the RAG index exists and is readable."""
    return INDEX_PATH.exists() and METADATA_PATH.exists()
