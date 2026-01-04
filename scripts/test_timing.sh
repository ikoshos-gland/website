#!/bin/bash
# Test RAG endpoint and view timing logs

FUNCTION_URL="https://func-rag-prod-3mktjtlolzx3q.azurewebsites.net/api/chat"

echo "🧪 Testing RAG endpoint..."
echo "=================================================="

# Send test request
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Alzheimer hastalığında connectome nasıl değişir?",
    "conversation_history": []
  }')

# Extract timing from response
echo "$RESPONSE" | jq -r '
  "✅ Response received!",
  "",
  "⏱️  TIMING BREAKDOWN:",
  "  Total time:         \(.timing.total_ms)ms",
  "  OpenAI + Search:    \(.timing.openai_search_ms)ms",
  "  Response processing: \(.timing.processing_ms)ms",
  "",
  "📊 TOKEN USAGE:",
  "  Prompt tokens:      \(.usage.prompt_tokens)",
  "  Completion tokens:  \(.usage.completion_tokens)",
  "  Total tokens:       \(.usage.total_tokens)",
  "",
  "💡 Answer preview:",
  "  \(.answer[:150])..."
'

echo ""
echo "=================================================="
echo "📝 Full response saved to: timing_test_result.json"
echo "$RESPONSE" | jq '.' > timing_test_result.json

echo ""
echo "🔍 Checking Application Insights logs in 10 seconds..."
sleep 10

# Query Application Insights
APP_ID="06b22d03-ff7d-4848-9117-59c3097d3c55"
az monitor app-insights query \
  --app "$APP_ID" \
  --analytics-query '
traces
| where timestamp > ago(5m)
| where message contains "⏱️" or message contains "📊"
| project timestamp, message
| order by timestamp desc
| take 10
' \
  --output table
