"""
FAISS-based internship semantic search index.

Handles:
- Loading internship dataset
- Generating embeddings for all internships
- Creating and persisting FAISS index
- Performing semantic similarity searches
"""

import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
import faiss

from app.internship_preprocessor import prepare_internship_data
from app.embeddings import generate_embedding


# Default paths for index and metadata
DATA_DIR = Path("data")
INTERNSHIP_INDEX_PATH = DATA_DIR / "internship_index.faiss"
INTERNSHIP_METADATA_PATH = DATA_DIR / "internship_metadata.json"
# Use the authoritative internships.json from app directory
INTERNSHIPS_JSON_PATH = Path("app") / "internships.json"


class InternshipIndex:
    """FAISS index for semantic search over internships."""
    
    def __init__(self):
        """Initialize the index manager."""
        self.index = None
        self.internships = []
        self.metadata = []
        self.embedding_dim = 384  # all-MiniLM-L6-v2 produces 384-dim vectors
    
    def load_or_create_index(self, force_rebuild=False):
        """
        Load existing FAISS index or create new one.
        
        Args:
            force_rebuild: If True, rebuild the index even if it exists.
        
        Returns:
            True if index loaded successfully, False otherwise.
        """
        # Check if index files exist
        if (INTERNSHIP_INDEX_PATH.exists() and 
            INTERNSHIP_METADATA_PATH.exists() and 
            not force_rebuild):
            try:
                self._load_index()
                print(f"[OK] Loaded existing FAISS index: {len(self.internships)} internships")
                return True
            except Exception as e:
                print(f"[ERROR] Error loading index: {e}")
                print("Rebuilding index...")
                return self.build_index()
        
        # Build new index
        return self.build_index()
    
    def build_index(self):
        """Build FAISS index from scratch."""
        try:
            # Load internships from dataset
            with open(INTERNSHIPS_JSON_PATH, 'r') as f:
                self.internships = json.load(f)
            
            if not self.internships:
                raise ValueError("No internships loaded")
            
            print(f"[OK] Loaded {len(self.internships)} internships")
            
            # Generate embeddings
            print("Generating embeddings...")
            embeddings = []
            
            for i, internship in enumerate(self.internships):
                # Prepare internship text
                internship_text = prepare_internship_data(internship)
                
                # Generate embedding
                embedding = generate_embedding(internship_text)
                embeddings.append(embedding)
                
                # Store metadata
                self.metadata.append({
                    "index": i,
                    "internship_id": internship["id"],
                    "company": internship["company"],
                    "role_title": internship["role_title"],
                })
                
                if (i + 1) % 50 == 0:
                    print(f"  Generated embeddings for {i + 1}/{len(self.internships)}")
            
            print(f"[OK] Generated embeddings for {len(embeddings)} internships")
            
            # Convert to numpy array and ensure proper shape
            embeddings_array = np.array(embeddings, dtype=np.float32)
            
            if embeddings_array.shape[0] != len(self.internships):
                raise ValueError("Embedding count mismatch")
            
            if embeddings_array.shape[1] != self.embedding_dim:
                raise ValueError(
                    f"Unexpected embedding dimension: {embeddings_array.shape[1]}, "
                    f"expected {self.embedding_dim}"
                )
            
            # Normalize embeddings for cosine similarity
            # FAISS IndexFlatIP with normalized vectors = cosine similarity
            faiss.normalize_L2(embeddings_array)
            print(f"[OK] Normalized embeddings to unit vectors")
            
            # Create FAISS index
            # IndexFlatIP: Inner product index
            # With normalized vectors, inner product = cosine similarity
            self.index = faiss.IndexFlatIP(self.embedding_dim)
            self.index.add(embeddings_array)
            
            print(f"[OK] Created FAISS index with {self.index.ntotal} vectors")
            
            # Save index and metadata
            self._save_index()
            
            return True
            
        except Exception as e:
            print(f"[ERROR] Error building index: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def search(self, candidate_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for top-K internships matching candidate profile.
        
        Args:
            candidate_text: Prepared candidate text (from prepare_candidate_data)
            top_k: Number of results to return
        
        Returns:
            List of dicts with internship info and similarity scores
        """
        if self.index is None:
            raise RuntimeError("Index not loaded. Call load_or_create_index() first.")
        
        if not candidate_text or not candidate_text.strip():
            raise ValueError("Candidate text cannot be empty")
        
        # Handle top_k larger than available
        actual_k = min(top_k, self.index.ntotal)
        
        # Generate embedding for candidate
        candidate_embedding = generate_embedding(candidate_text)
        
        # Normalize for cosine similarity
        candidate_array = np.array([candidate_embedding], dtype=np.float32)
        faiss.normalize_L2(candidate_array)
        
        # Search FAISS
        distances, indices = self.index.search(candidate_array, actual_k)
        
        # Build results with internship info and scores
        results = []
        for rank, (idx, distance) in enumerate(zip(indices[0], distances[0]), 1):
            idx = int(idx)
            
            if idx < 0 or idx >= len(self.internships):
                continue
            
            internship = self.internships[idx]
            
            # distance is already cosine similarity (inner product of normalized vectors)
            similarity_score = float(distance)
            
            results.append({
                "rank": rank,
                "internship": internship,
                "similarity_score": similarity_score,
            })
        
        return results
    
    def _save_index(self):
        """Save FAISS index and metadata to disk."""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, str(INTERNSHIP_INDEX_PATH))
            
            # Save metadata
            with open(INTERNSHIP_METADATA_PATH, "w") as f:
                json.dump(self.metadata, f)
            
            print(f"[OK] Saved FAISS index to {INTERNSHIP_INDEX_PATH}")
            print(f"[OK] Saved metadata to {INTERNSHIP_METADATA_PATH}")
            
        except Exception as e:
            print(f"[ERROR] Error saving index: {e}")
            raise
    
    def _load_index(self):
        """Load FAISS index and metadata from disk."""
        # Load FAISS index
        self.index = faiss.read_index(str(INTERNSHIP_INDEX_PATH))
        
        # Load metadata
        with open(INTERNSHIP_METADATA_PATH, "r") as f:
            self.metadata = json.load(f)
        
        # Load internships
        with open(INTERNSHIPS_JSON_PATH, 'r') as f:
            self.internships = json.load(f)
        
        if len(self.internships) != self.index.ntotal:
            raise ValueError(
                f"Internship count mismatch: {len(self.internships)} internships, "
                f"but index has {self.index.ntotal} vectors"
            )


# Global index instance
_index_instance = None


def get_index(force_rebuild=False) -> InternshipIndex:
    """Get or create the global internship index."""
    global _index_instance
    
    if _index_instance is None:
        _index_instance = InternshipIndex()
        _index_instance.load_or_create_index(force_rebuild=force_rebuild)
    
    return _index_instance


def search_internships(candidate_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Convenience function to search internships.
    
    Args:
        candidate_text: Prepared candidate text (from prepare_candidate_data)
        top_k: Number of results to return (default: 5)
    
    Returns:
        List of dicts with internship info and similarity scores
    
    Example:
        >>> from app.candidate_preprocessor import prepare_candidate_data
        >>> from app.resume_parser import parse_resume
        >>> from app.internship_index import search_internships
        >>> 
        >>> resume_text = "..."
        >>> parsed = parse_resume(resume_text)
        >>> candidate_text = prepare_candidate_data(parsed)
        >>> results = search_internships(candidate_text, top_k=5)
        >>> 
        >>> for result in results:
        ...     print(f"{result['rank']}. {result['internship']['role_title']}")
        ...     print(f"   Company: {result['internship']['company']}")
        ...     print(f"   Similarity: {result['similarity_score']:.4f}")
    """
    index = get_index()
    return index.search(candidate_text, top_k)


def apply_second_stage_ranking(
    results: List[Dict[str, Any]],
    candidate_data: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Apply lightweight second-stage ranking to refine semantic search results.
    
    Considers:
    - Skill overlap (required and preferred)
    - Education compatibility
    - Domain relevance
    
    Args:
        results: Results from semantic search
        candidate_data: Parsed candidate resume data
    
    Returns:
        Re-ranked results with additional metadata
    """
    candidate_skills = set(candidate_data.get("skills", []))
    candidate_education = candidate_data.get("education", [])
    
    # Convert to lowercase for comparison
    candidate_skills_lower = {s.lower() for s in candidate_skills}
    
    ranked_results = []
    
    for result in results:
        internship = result["internship"]
        similarity = result["similarity_score"]
        
        # Calculate skill overlap
        required_skills = internship.get("required_skills", [])
        preferred_skills = internship.get("preferred_skills", [])
        
        required_overlap = sum(
            1 for skill in required_skills
            if skill.lower() in candidate_skills_lower
        )
        preferred_overlap = sum(
            1 for skill in preferred_skills
            if skill.lower() in candidate_skills_lower
        )
        
        required_coverage = (
            required_overlap / len(required_skills)
            if required_skills else 0.0
        )
        preferred_coverage = (
            preferred_overlap / len(preferred_skills)
            if preferred_skills else 0.0
        )
        
        # Boost score based on skill coverage
        # Primary score is semantic similarity, secondary boost from skill alignment
        adjusted_score = similarity * 0.7 + (
            required_coverage * 0.25 + preferred_coverage * 0.05
        )
        
        ranked_results.append({
            **result,
            "adjusted_similarity_score": adjusted_score,
            "skill_analysis": {
                "required_skills_matched": required_overlap,
                "required_skills_total": len(required_skills),
                "preferred_skills_matched": preferred_overlap,
                "preferred_skills_total": len(preferred_skills),
                "required_coverage_percent": int(required_coverage * 100),
                "skill_gap": [
                    s for s in required_skills
                    if s.lower() not in candidate_skills_lower
                ][:3]  # Top 3 missing skills
            }
        })
    
    # Re-rank by adjusted score
    ranked_results.sort(
        key=lambda x: x["adjusted_similarity_score"],
        reverse=True
    )
    
    # Re-number ranks
    for idx, result in enumerate(ranked_results, 1):
        result["rank"] = idx
    
    return ranked_results


def rebuild_index():
    """Rebuild the FAISS index from scratch."""
    global _index_instance
    
    _index_instance = InternshipIndex()
    _index_instance.load_or_create_index(force_rebuild=True)
    
    print("[OK] Index rebuilt successfully")
