#!/bin/bash
# RAG Performance Analysis Script
# Analyzes response timing and provides optimization recommendations

ENDPOINT="https://func-rag-prod-3mktjtlolzx3q.azurewebsites.net/api/chat"
TEST_QUESTION="${1:-Alzheimer hastalığında connectome nasıl değişir?}"
RESPONSE_FILE="/tmp/rag_perf_$$.json"

echo "========================================================================"
echo "🧪 RAG PERFORMANCE ANALYZER"
echo "========================================================================"
echo ""
echo "📝 Testing with question:"
echo "   \"$TEST_QUESTION\""
echo ""
echo "⏳ Sending request to API..."

# Create JSON payload with proper escaping
PAYLOAD=$(python3 -c "import json; print(json.dumps({'message': '''$TEST_QUESTION''', 'conversation_history': []}))")

# Make API call
curl --max-time 30 -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -o "$RESPONSE_FILE"

# Analyze response
python3 << EOF
import json
import sys
import os

response_file = "$RESPONSE_FILE"

try:
    with open(response_file, 'r') as f:
        data = json.load(f)

    if 'error' in data:
        print(f"\n❌ ERROR: {data['error']}\n")
        sys.exit(1)

    # Timing analysis
    t = data['timing']
    total_s = t['total_ms'] / 1000
    openai_pct = (t['openai_search_ms'] / t['total_ms']) * 100

    print("\n" + "=" * 70)
    print("⏱️  TIMING BREAKDOWN")
    print("=" * 70)
    print(f"  Total time:          {t['total_ms']:,}ms ({total_s:.2f}s)")
    print(f"  OpenAI + Search:     {t['openai_search_ms']:,}ms ({openai_pct:.1f}% of total)")
    print(f"  Response processing: {t['processing_ms']:,}ms\n")

    # Performance verdict
    if t['total_ms'] < 3000:
        verdict = "🚀 EXCELLENT"
        color = "\033[92m"  # Green
    elif t['total_ms'] < 5000:
        verdict = "✅ GOOD"
        color = "\033[93m"  # Yellow
    else:
        verdict = "⚠️  SLOW"
        color = "\033[91m"  # Red

    print(f"  PERFORMANCE: {color}{verdict}\033[0m")

    # Token analysis
    u = data['usage']
    print("\n" + "=" * 70)
    print("📊 TOKEN USAGE")
    print("=" * 70)
    print(f"  Prompt tokens:       {u['prompt_tokens']:,}")
    print(f"  Completion tokens:   {u['completion_tokens']:,}")
    print(f"  Total tokens:        {u['total_tokens']:,}\n")

    # Token-based recommendations
    if u['prompt_tokens'] > 6000:
        print("  💡 High prompt tokens detected!")
        print("     → Consider reducing top_n_documents from 5 to 3")

    # Citations
    citations = len(data['citations'])
    print("\n" + "=" * 70)
    print(f"📚 CITATIONS: {citations} source(s) found")
    print("=" * 70)
    for i, c in enumerate(data['citations'][:3], 1):
        title = c.get('title', 'Unknown')[:60]
        print(f"  {i}. {title}...")

    if citations > 3:
        print(f"  ... and {citations - 3} more")

    # Answer preview
    answer_len = len(data['answer'])
    print("\n" + "=" * 70)
    print(f"💡 ANSWER ({answer_len} characters)")
    print("=" * 70)
    print(f"  {data['answer'][:250]}...")

    # Optimization recommendations
    print("\n" + "=" * 70)
    print("🔧 OPTIMIZATION RECOMMENDATIONS")
    print("=" * 70)

    if t['total_ms'] > 5000:
        print("  ⚠️  Response is slow (>5s). Try these optimizations:")
        print("")
        print("  1. Reduce retrieved documents:")
        print("     Edit api/function_app.py:")
        print("     'top_n_documents': 3  # Changed from 5")
        print("")
        print("  2. Lower strictness:")
        print("     'strictness': 2  # Changed from 3")
        print("")
        print("  3. Reduce max tokens:")
        print("     max_tokens=500  # Changed from 800")
    elif t['total_ms'] > 3000:
        print("  ✅ Performance is acceptable, but can be improved:")
        print("     Consider reducing top_n_documents to 3 for faster responses")
    else:
        print("  🚀 Excellent performance! No optimization needed.")

    print("\n" + "=" * 70)
    print("📈 DETAILED LOGS")
    print("=" * 70)
    print("  View Application Insights for detailed breakdown:")
    print("  → Portal: ai-rag-prod-3mktjtlolzx3q → Logs")
    print("  → Query: traces | where message contains '⏱️'")
    print("=" * 70 + "\n")

    # Cleanup
    os.remove(response_file)

except json.JSONDecodeError as e:
    print(f"\n❌ Failed to parse response: {e}\n")
    if os.path.exists(response_file):
        with open(response_file) as f:
            print(f"Raw response: {f.read()[:500]}")
        os.remove(response_file)
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Error: {e}\n")
    if os.path.exists(response_file):
        os.remove(response_file)
    sys.exit(1)
EOF

echo ""
echo "========================================================================"
echo "✅ Analysis complete!"
echo "========================================================================"
