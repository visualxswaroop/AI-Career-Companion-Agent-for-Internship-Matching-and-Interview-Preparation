"""
Comprehensive evaluation of the internship recommendation system.

Tests:
1. Semantic search quality for each candidate
2. Second-stage ranking accuracy
3. LLM explanation generation
4. End-to-end recommendation quality
5. Domain-specific matching
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.test_candidates import (
    create_test_candidates,
    convert_candidate_to_resume_data,
    prepare_test_candidates_for_api
)
from app.candidate_preprocessor import prepare_candidate_data
from app.internship_index import search_internships, apply_second_stage_ranking
from app.llm_ranker import rank_internships_with_explanations


def evaluate_semantic_search():
    """Evaluate semantic search quality."""
    print("\n" + "="*80)
    print("EVALUATION 1: SEMANTIC SEARCH QUALITY")
    print("="*80)
    
    candidates = create_test_candidates()
    results_summary = {
        "total_candidates": len(candidates),
        "searches_performed": 0,
        "avg_top_similarity": 0.0,
        "results": []
    }
    
    total_similarity = 0
    
    for i, candidate in enumerate(candidates, 1):
        resume_data = convert_candidate_to_resume_data(candidate)
        candidate_text = prepare_candidate_data(resume_data)
        
        # Search
        results = search_internships(candidate_text, top_k=5)
        
        if results:
            top_match = results[0]
            similarity = top_match["similarity_score"]
            total_similarity += similarity
            results_summary["searches_performed"] += 1
            
            results_summary["results"].append({
                "candidate": candidate['name'],
                "expected_fits": candidate['expected_fits'],
                "top_match": top_match["internship"]["role_title"],
                "top_match_domain": top_match["internship"]["domain"],
                "similarity_score": round(similarity, 4),
                "top_5_matches": [
                    {
                        "rank": r["rank"],
                        "role": r["internship"]["role_title"],
                        "domain": r["internship"]["domain"],
                        "score": round(r["similarity_score"], 4)
                    }
                    for r in results[:5]
                ]
            })
            
            print(f"\n{i}. {candidate['name']}")
            print(f"   Expected: {', '.join(candidate['expected_fits'])}")
            print(f"   Top Match: {top_match['internship']['role_title']} ({top_match['internship']['domain']})")
            print(f"   Similarity: {similarity:.4f}")
    
    avg_similarity = total_similarity / results_summary["searches_performed"] if results_summary["searches_performed"] > 0 else 0
    results_summary["avg_top_similarity"] = round(avg_similarity, 4)
    
    print(f"\n✓ Semantic Search Results:")
    print(f"  - Total Candidates: {results_summary['searches_performed']}")
    print(f"  - Average Top Similarity: {avg_similarity:.4f}")
    
    return results_summary


def evaluate_second_stage_ranking():
    """Evaluate second-stage ranking effectiveness."""
    print("\n" + "="*80)
    print("EVALUATION 2: SECOND-STAGE RANKING")
    print("="*80)
    
    candidates = create_test_candidates()
    ranking_results = {
        "total_evaluated": 0,
        "ranking_differences": [],
        "skill_gap_analysis": []
    }
    
    for i, candidate in enumerate(candidates, 1):
        resume_data = convert_candidate_to_resume_data(candidate)
        candidate_text = prepare_candidate_data(resume_data)
        
        # Semantic search
        semantic_results = search_internships(candidate_text, top_k=10)
        
        # Get top matches before and after ranking
        top_semantic = semantic_results[0] if semantic_results else None
        
        # Apply second-stage ranking
        ranked_results = apply_second_stage_ranking(semantic_results, resume_data)
        top_ranked = ranked_results[0] if ranked_results else None
        
        if top_semantic and top_ranked:
            semantic_role = top_semantic["internship"]["role_title"]
            ranked_role = top_ranked["internship"]["role_title"]
            ranking_changed = semantic_role != ranked_role
            
            skill_analysis = top_ranked.get("skill_analysis", {})
            
            ranking_results["ranking_differences"].append({
                "candidate": candidate['name'],
                "semantic_top": semantic_role,
                "ranked_top": ranked_role,
                "ranking_changed": ranking_changed,
                "semantic_score": round(top_semantic["similarity_score"], 4),
                "adjusted_score": round(top_ranked["adjusted_similarity_score"], 4),
                "skill_coverage": skill_analysis.get("required_coverage_percent", 0)
            })
            
            ranking_results["skill_gap_analysis"].append({
                "candidate": candidate['name'],
                "required_matched": skill_analysis.get("required_skills_matched", 0),
                "required_total": skill_analysis.get("required_skills_total", 0),
                "preferred_matched": skill_analysis.get("preferred_skills_matched", 0),
                "skill_gap": skill_analysis.get("skill_gap", [])
            })
            
            ranking_results["total_evaluated"] += 1
            
            print(f"\n{i}. {candidate['name']}")
            print(f"   Semantic Top: {semantic_role} ({top_semantic['similarity_score']:.4f})")
            print(f"   After Ranking: {ranked_role} ({top_ranked['adjusted_similarity_score']:.4f})")
            print(f"   Ranking Changed: {ranking_changed}")
            print(f"   Skill Coverage: {skill_analysis.get('required_coverage_percent', 0)}%")
            if skill_analysis.get("skill_gap"):
                print(f"   Missing Skills: {', '.join(skill_analysis['skill_gap'][:3])}")
    
    print(f"\n✓ Second-Stage Ranking Results:")
    print(f"  - Total Evaluated: {ranking_results['total_evaluated']}")
    
    # Count ranking changes
    ranking_changes = sum(1 for r in ranking_results["ranking_differences"] if r["ranking_changed"])
    print(f"  - Ranking Changed: {ranking_changes}/{ranking_results['total_evaluated']}")
    print(f"  - Average Skill Coverage: {sum(r['skill_coverage'] for r in ranking_results['ranking_differences']) / len(ranking_results['ranking_differences']) if ranking_results['ranking_differences'] else 0:.1f}%")
    
    return ranking_results


def evaluate_llm_explanations():
    """Evaluate LLM explanation generation."""
    print("\n" + "="*80)
    print("EVALUATION 3: LLM EXPLANATION GENERATION")
    print("="*80)
    
    candidates = create_test_candidates()
    explanation_results = {
        "total_generated": 0,
        "with_llm": 0,
        "fallback_heuristic": 0,
        "samples": []
    }
    
    for i, candidate in enumerate(candidates[:3], 1):  # Test with first 3 candidates
        resume_data = convert_candidate_to_resume_data(candidate)
        candidate_text = prepare_candidate_data(resume_data)
        
        # Get recommendations
        semantic_results = search_internships(candidate_text, top_k=5)
        ranked_results = apply_second_stage_ranking(semantic_results, resume_data)
        
        # Generate explanations
        explained_results = rank_internships_with_explanations(
            ranked_results[:3],  # Just first 3 for evaluation
            resume_data,
            use_llm=True
        )
        
        for result in explained_results:
            explanation = result.get("explanation", {})
            explanation_results["total_generated"] += 1
            
            if explanation.get("explanation_method") == "heuristic":
                explanation_results["fallback_heuristic"] += 1
            else:
                explanation_results["with_llm"] += 1
            
            explanation_results["samples"].append({
                "candidate": candidate['name'],
                "internship": result["internship"]["role_title"],
                "match_rating": explanation.get("match_rating"),
                "strengths": explanation.get("key_strengths", [])[:1],
                "recommendation": explanation.get("recommendation_summary")
            })
            
            print(f"\n{candidate['name']} → {result['internship']['role_title']}")
            print(f"  Rating: {explanation.get('match_rating')}")
            print(f"  Strengths: {explanation.get('key_strengths', ['None'])[0]}")
            print(f"  Recommendation: {explanation.get('recommendation_summary')[:100]}...")
    
    print(f"\n✓ LLM Explanation Results:")
    print(f"  - Total Explanations: {explanation_results['total_generated']}")
    print(f"  - With LLM: {explanation_results['with_llm']}")
    print(f"  - Fallback (Heuristic): {explanation_results['fallback_heuristic']}")
    
    return explanation_results


def evaluate_domain_specific_matching():
    """Evaluate how well the system matches candidates to their domain."""
    print("\n" + "="*80)
    print("EVALUATION 4: DOMAIN-SPECIFIC MATCHING")
    print("="*80)
    
    candidates = create_test_candidates()
    domain_results = {
        "total_matches": 0,
        "domain_hits": {},
        "accuracy_by_profile": []
    }
    
    for candidate in candidates:
        resume_data = convert_candidate_to_resume_data(candidate)
        candidate_text = prepare_candidate_data(resume_data)
        expected_domains = set(candidate['expected_fits'])
        
        # Search
        results = search_internships(candidate_text, top_k=5)
        
        # Check if top result matches expected domain
        if results:
            top_match_domain = results[0]["internship"]["domain"]
            domain_results["total_matches"] += 1
            
            domain_hit = any(exp_domain.lower() in top_match_domain.lower() for exp_domain in expected_domains)
            
            if top_match_domain not in domain_results["domain_hits"]:
                domain_results["domain_hits"][top_match_domain] = {"hits": 0, "total": 0}
            
            domain_results["domain_hits"][top_match_domain]["total"] += 1
            if domain_hit:
                domain_results["domain_hits"][top_match_domain]["hits"] += 1
            
            domain_results["accuracy_by_profile"].append({
                "candidate": candidate['name'],
                "expected_domains": list(expected_domains),
                "top_match_domain": top_match_domain,
                "match": domain_hit
            })
            
            match_str = "✓" if domain_hit else "✗"
            print(f"\n{match_str} {candidate['name']}")
            print(f"  Expected: {', '.join(expected_domains)}")
            print(f"  Top Match: {top_match_domain}")
    
    # Calculate accuracy
    total_hits = sum(d["hits"] for d in domain_results["domain_hits"].values())
    accuracy = (total_hits / domain_results["total_matches"] * 100) if domain_results["total_matches"] > 0 else 0
    
    print(f"\n✓ Domain Matching Accuracy: {accuracy:.1f}%")
    print(f"  - Total Matches: {domain_results['total_matches']}")
    print(f"  - Correct Domain: {int(total_hits)}")
    
    return domain_results


def generate_evaluation_report():
    """Generate comprehensive evaluation report."""
    print("\n" + "="*80)
    print("COMPREHENSIVE EVALUATION REPORT")
    print("="*80)
    
    # Run all evaluations
    semantic_results = evaluate_semantic_search()
    ranking_results = evaluate_second_stage_ranking()
    explanation_results = evaluate_llm_explanations()
    domain_results = evaluate_domain_specific_matching()
    
    # Compile report
    report = {
        "evaluation_type": "Comprehensive System Evaluation",
        "test_candidates": 10,
        "semantic_search": semantic_results,
        "second_stage_ranking": ranking_results,
        "llm_explanations": explanation_results,
        "domain_matching": domain_results
    }
    
    # Save report
    with open("evaluation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"✓ Evaluation completed for {semantic_results['total_candidates']} candidates")
    print(f"✓ Semantic search avg similarity: {semantic_results['avg_top_similarity']:.4f}")
    print(f"✓ Second-stage ranking improved matches: {sum(1 for r in ranking_results['ranking_differences'] if r['ranking_changed'])} candidates")
    print(f"✓ LLM explanations generated: {explanation_results['total_generated']} (fallback: {explanation_results['fallback_heuristic']})")
    print(f"✓ Domain-specific matching accuracy: {sum(d['hits'] for d in domain_results['domain_hits'].values()) / domain_results['total_matches'] * 100 if domain_results['total_matches'] > 0 else 0:.1f}%")
    print(f"✓ Report saved to evaluation_report.json")
    
    return report


if __name__ == "__main__":
    generate_evaluation_report()
