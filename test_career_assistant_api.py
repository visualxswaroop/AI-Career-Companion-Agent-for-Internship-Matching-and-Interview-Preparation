"""
End-to-End Test for Career Companion Phase 3C (RAG Career Assistant)
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("Running Career Assistant End-to-End API Tests")
    print("==================================================")

    # 1. Test Root
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[PASS] Root API endpoint is active")

    # 2. Test Unauthenticated Access to Career Assistant
    res = client.post("/career-assistant/chat", json={"message": "Hello"})
    assert res.status_code == 403 or res.status_code == 401, f"Expected auth failure: {res.status_code}"
    print("[PASS] Unauthenticated access blocked correctly")

    # 3. Create mock authenticated user token
    token = create_access_token({"sub": "1"})
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Check status endpoint
    res = client.get("/career-assistant/status", headers=headers)
    assert res.status_code == 200, f"Status check failed: {res.text}"
    status_data = res.json()
    assert status_data.get("ready") is True, f"Index not ready: {status_data}"
    print(f"[PASS] Status endpoint check: {status_data}")

    # 5. Test empty message validation
    res = client.post("/career-assistant/chat", json={"message": "   "}, headers=headers)
    assert res.status_code == 422, f"Expected 422 for empty message: {res.status_code}"
    print("[PASS] Empty message validation handled correctly (422)")

    # 6. Test Career Assistant Chat with Grounded Platform Question
    q1 = "What is Career Companion?"
    print(f"\nSending Query: '{q1}'...")
    res = client.post("/career-assistant/chat", json={"message": q1}, headers=headers)
    assert res.status_code == 200, f"Chat failed: {res.text}"
    data1 = res.json()
    assert "answer" in data1 and len(data1["answer"]) > 20
    assert data1["retrieval_used"] is True
    snippet1 = data1['answer'][:150].encode('ascii', 'replace').decode('ascii')
    print(f"[PASS] Response received ({data1['generation_method']})")
    print(f"       Sources returned: {len(data1['sources'])}")
    print(f"       Answer snippet: {snippet1}...\n")

    # 7. Test Conversation Context (Follow-up)
    q2 = "How does internship matching work?"
    print(f"Sending Query: '{q2}'...")
    res = client.post("/career-assistant/chat", json={
        "message": q2,
        "conversation_history": [
            {"role": "user", "content": q1},
            {"role": "assistant", "content": data1["answer"]}
        ]
    }, headers=headers)
    assert res.status_code == 200, f"Follow-up failed: {res.text}"
    data2 = res.json()
    assert data2["retrieval_used"] is True
    snippet2 = data2['answer'][:150].encode('ascii', 'replace').decode('ascii')
    print(f"[PASS] Follow-up response received ({data2['generation_method']})")
    print(f"       Sources returned: {len(data2['sources'])}")
    print(f"       Answer snippet: {snippet2}...\n")

    # 8. Test Career Advice Question
    q3 = "How can I improve my resume for ATS systems?"
    print(f"Sending Query: '{q3}'...")
    res = client.post("/career-assistant/chat", json={"message": q3}, headers=headers)
    assert res.status_code == 200
    data3 = res.json()
    snippet3 = data3['answer'][:150].encode('ascii', 'replace').decode('ascii')
    print(f"[PASS] ATS Advice response received ({data3['generation_method']})")
    print(f"       Sources returned: {len(data3['sources'])}")
    print(f"       Answer snippet: {snippet3}...\n")

    # 9. Test Domain Restriction (Irrelevant question)
    q_irrel = "What is the capital of India?"
    print(f"Sending Irrelevant Query: '{q_irrel}'...")
    res = client.post("/career-assistant/chat", json={"message": q_irrel}, headers=headers)
    assert res.status_code == 200
    data_irrel = res.json()
    assert data_irrel["generation_method"] in ("domain_refusal", "rag_llm")
    assert "Career Companion" in data_irrel["answer"] or "knowledge base" in data_irrel["answer"]
    print(f"[PASS] Domain restriction response: {data_irrel['answer']}\n")

    # 10. Test Unsupported Platform Question (Anti-Hallucination)
    q_unsupp = "Does Career Companion automatically apply for jobs?"
    print(f"Sending Unsupported Platform Query: '{q_unsupp}'...")
    res = client.post("/career-assistant/chat", json={"message": q_unsupp}, headers=headers)
    assert res.status_code == 200
    data_unsupp = res.json()
    print(f"[ANSWER]: {data_unsupp['answer']}")
    assert len(data_unsupp["answer"]) > 10
    print(f"[PASS] Unsupported platform response: {data_unsupp['answer']}\n")

    print("==================================================")
    print("ALL API TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
