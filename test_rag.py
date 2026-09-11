"""Quick test of the RAG retrieval pipeline."""
import sys
sys.path.insert(0, '.')

print("=== Testing RAG Retrieval ===\n")

test_questions = [
    "How can I improve my resume?",
    "What skills should I learn for an AI/ML internship?",
    "How does internship matching work?",
    "What is Career Companion?",
    "What is the weather in Hyderabad tomorrow?",  # Should return low/no results
]

from app.rag.retriever import retrieve, is_index_available

print(f"Index available: {is_index_available()}\n")

for question in test_questions:
    results = retrieve(question, top_k=3)
    print(f"Q: {question}")
    print(f"   Retrieved {len(results)} chunks")
    for i, r in enumerate(results):
        print(f"   [{i+1}] score={r['score']:.3f} | {r['section'][:60]}")
    print()

print("=== Testing RAG Generator ===\n")
from app.rag.generator import generate_response

result = generate_response(
    question="What is Career Companion?",
    conversation_history=[],
    user_data={"name": "Test User", "skills": ["Python", "SQL"]}
)
print(f"Method: {result['generation_method']}")
print(f"Retrieval used: {result['retrieval_used']}")
print(f"Sources: {len(result['sources'])}")
print(f"Answer preview: {result['answer'][:200]}...")
print()

# Test conversation memory
result2 = generate_response(
    question="Which one should I learn first?",
    conversation_history=[
        {"role": "user", "content": "What skills should I learn for ML?"},
        {"role": "assistant", "content": "For ML, start with Python, then NumPy, Pandas, and Scikit-learn."}
    ],
    user_data={"name": "Test User"}
)
print("Conversation follow-up test:")
print(f"Method: {result2['generation_method']}")
print(f"Answer preview: {result2['answer'][:200]}...")
print()
print("=== All tests completed ===")
