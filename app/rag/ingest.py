"""
RAG Document Ingestion Pipeline for Career Companion Career Assistant.

This module loads the Markdown knowledge base, splits it into semantic chunks,
generates embeddings, and saves a FAISS index with metadata.

Usage:
    python -m app.rag.ingest

The index is saved to:
    data/rag/index.faiss
    data/rag/metadata.json
"""

import json
import re
import uuid
from pathlib import Path
from typing import Any

import faiss
import numpy as np

# ──────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
KNOWLEDGE_BASE_DIR = PROJECT_ROOT / "knowledge_base"
INDEX_DIR = PROJECT_ROOT / "data" / "rag"
INDEX_PATH = INDEX_DIR / "index.faiss"
METADATA_PATH = INDEX_DIR / "metadata.json"

EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension

CHUNK_SIZE = 600        # max characters per chunk
CHUNK_OVERLAP = 100     # character overlap between consecutive chunks


# ──────────────────────────────────────────────────────────────────
# Step 1: Load Documents
# ──────────────────────────────────────────────────────────────────

def load_documents() -> list[dict[str, str]]:
    """Load all Markdown documents from knowledge_base directory."""
    docs = []
    for md_file in sorted(KNOWLEDGE_BASE_DIR.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        docs.append({
            "source": md_file.name,
            "text": text,
        })
    print(f"[ingest] Loaded {len(docs)} document(s)")
    return docs


# ──────────────────────────────────────────────────────────────────
# Step 2: Clean Text
# ──────────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Clean Markdown text for embedding."""
    # Remove HTML comments
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    # Remove code fences (keep content inside)
    text = re.sub(r"```[a-zA-Z]*\n?", "", text)
    # Remove Markdown link syntax but keep text
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    # Remove horizontal rules
    text = re.sub(r"^---+$", "", text, flags=re.MULTILINE)
    # Remove excessive blank lines (keep at most 2)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ──────────────────────────────────────────────────────────────────
# Step 3: Section-Aware Chunking
# ──────────────────────────────────────────────────────────────────

def _extract_sections(text: str) -> list[dict[str, str]]:
    """
    Split document into sections by ## headings.
    Returns list of {heading, content} dicts.
    """
    # Split on ## headings (level 2 and below)
    pattern = re.compile(r"^(#{1,3} .+)$", re.MULTILINE)
    parts = pattern.split(text)

    sections = []
    current_heading = "Introduction"
    buffer = []

    for part in parts:
        part = part.strip()
        if not part:
            continue
        if re.match(r"^#{1,3} ", part):
            # Save previous section
            if buffer:
                sections.append({
                    "heading": current_heading,
                    "content": "\n".join(buffer).strip(),
                })
                buffer = []
            current_heading = re.sub(r"^#+\s*", "", part).strip()
        else:
            buffer.append(part)

    # Don't forget the last section
    if buffer:
        sections.append({
            "heading": current_heading,
            "content": "\n".join(buffer).strip(),
        })

    return sections


def chunk_text(text: str, source: str) -> list[dict[str, Any]]:
    """
    Split a document into chunks, preserving section metadata.
    Uses section-aware splitting first, then character-level chunking
    within each section to keep chunk size bounded.
    """
    sections = _extract_sections(text)
    chunks = []

    for section in sections:
        heading = section["heading"]
        content = clean_text(section["content"])

        if not content:
            continue

        # Determine top-level section number/name from heading
        # e.g. "15. Frequently Asked Questions" -> "Frequently Asked Questions"
        topic = re.sub(r"^\d+\.\s*", "", heading).strip()

        # Subsplit long sections with overlap
        start = 0
        while start < len(content):
            end = min(start + CHUNK_SIZE, len(content))

            # Try to break at sentence boundary
            if end < len(content):
                # Look for last period, newline within a window
                boundary = content.rfind("\n", start, end)
                if boundary == -1 or boundary <= start:
                    boundary = content.rfind(". ", start, end)
                if boundary > start:
                    end = boundary + 1

            chunk_text_str = content[start:end].strip()

            if chunk_text_str:
                chunks.append({
                    "chunk_id": str(uuid.uuid4()),
                    "source": source,
                    "section": heading,
                    "topic": topic,
                    "text": chunk_text_str,
                })

            if end >= len(content):
                break

            # Advance with overlap
            start = max(start + 1, end - CHUNK_OVERLAP)

    return chunks


# ──────────────────────────────────────────────────────────────────
# Step 4: Embedding Generation
# ──────────────────────────────────────────────────────────────────

def generate_embeddings(texts: list[str]) -> np.ndarray:
    """
    Generate L2-normalized embeddings using the shared model.
    Using normalized vectors enables cosine similarity via inner product in FAISS.
    """
    # Import lazily to avoid slow startup when this module is imported elsewhere
    from sentence_transformers import SentenceTransformer
    print(f"[ingest] Loading embedding model...")
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    print(f"[ingest] Encoding {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
    embeddings = embeddings.astype(np.float32)

    # L2-normalize for cosine similarity via inner product
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)  # Avoid division by zero
    embeddings = embeddings / norms

    return embeddings


# ──────────────────────────────────────────────────────────────────
# Step 5: Build and Save FAISS Index
# ──────────────────────────────────────────────────────────────────

def build_index(embeddings: np.ndarray) -> faiss.IndexFlatIP:
    """
    Build a FAISS Inner Product index.
    Since embeddings are L2-normalized, inner product == cosine similarity.
    """
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(embeddings)
    print(f"[ingest] FAISS index built with {index.ntotal} vectors")
    return index


def save_index(index: faiss.IndexFlatIP, metadata: list[dict[str, Any]]) -> None:
    """Save FAISS index and metadata to disk."""
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_PATH))
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"[ingest] Index saved to {INDEX_PATH}")
    print(f"[ingest] Metadata saved to {METADATA_PATH} ({len(metadata)} chunks)")


# ──────────────────────────────────────────────────────────────────
# Main Ingestion Pipeline
# ──────────────────────────────────────────────────────────────────

def run_ingestion() -> None:
    """Full ingestion pipeline: load → clean → chunk → embed → index → save."""
    print("[ingest] Starting RAG ingestion pipeline...")

    # 1. Load documents
    docs = load_documents()
    if not docs:
        print("[ingest] ERROR: No documents found in knowledge_base/")
        return

    # 2. Chunk all documents
    all_chunks: list[dict[str, Any]] = []
    for doc in docs:
        chunks = chunk_text(doc["text"], doc["source"])
        all_chunks.extend(chunks)
        print(f"[ingest] '{doc['source']}' -> {len(chunks)} chunks")

    if not all_chunks:
        print("[ingest] ERROR: No chunks generated. Check knowledge base content.")
        return

    print(f"[ingest] Total chunks: {len(all_chunks)}")

    # 3. Generate embeddings
    texts = [chunk["text"] for chunk in all_chunks]
    embeddings = generate_embeddings(texts)

    # 4. Build FAISS index
    index = build_index(embeddings)

    # 5. Prepare metadata (strip embedding from stored metadata)
    metadata = [
        {
            "chunk_id": c["chunk_id"],
            "source": c["source"],
            "section": c["section"],
            "topic": c["topic"],
            "text": c["text"],
        }
        for c in all_chunks
    ]

    # 6. Save
    save_index(index, metadata)
    print("[ingest] SUCCESS: Ingestion complete!")


if __name__ == "__main__":
    run_ingestion()
