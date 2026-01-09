#!/bin/bash
# Azure Application Insights - Timing Logs Query
# Son 1 saatteki tüm timing loglarını gösterir

APP_ID="06b22d03-ff7d-4848-9117-59c3097d3c55"

echo "📊 Querying Application Insights for timing logs..."
echo "=================================================="
echo ""

# Query: Son 1 saatteki tüm requests + timing breakdown
az monitor app-insights query \
  --app "$APP_ID" \
  --analytics-query '
traces
| where timestamp > ago(1h)
| where message contains "⏱️" or message contains "📊"
| project
    timestamp,
    message,
    operation_Id
| order by timestamp desc
| take 50
' \
  --output table

echo ""
echo "=================================================="
echo "💡 Daha detaylı analiz için Azure Portal'ı kullanın:"
echo "   Portal > Application Insights > Logs"
