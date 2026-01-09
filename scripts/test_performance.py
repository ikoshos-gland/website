#!/usr/bin/env python3
"""
Performance Test Script for RAG and Web Search APIs
Tests response times and provides detailed timing breakdown.
"""

import sys
import time
import json
import statistics
import argparse
from dataclasses import dataclass
from typing import Optional

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import requests


@dataclass
class TimingResult:
    """Container for timing results."""
    endpoint: str
    query: str
    total_time_ms: float
    server_time_ms: Optional[float] = None
    openai_search_ms: Optional[float] = None
    processing_ms: Optional[float] = None
    status_code: int = 0
    error: Optional[str] = None
    answer_preview: Optional[str] = None
    tool_calls: Optional[list] = None


def test_rag_endpoint(base_url: str, query: str, timeout: int = 30) -> TimingResult:
    """Test the RAG /api/chat endpoint."""
    endpoint = f"{base_url}/api/chat"
    payload = {
        "message": query,
        "conversation_history": []
    }
    
    start_time = time.perf_counter()
    
    try:
        response = requests.post(
            endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=timeout
        )
        
        total_time = (time.perf_counter() - start_time) * 1000  # ms
        
        if response.status_code == 200:
            data = response.json()
            timing = data.get("timing", {})
            return TimingResult(
                endpoint="RAG (chat)",
                query=query,
                total_time_ms=total_time,
                server_time_ms=timing.get("total_ms"),
                openai_search_ms=timing.get("openai_search_ms"),
                processing_ms=timing.get("processing_ms"),
                status_code=response.status_code,
                answer_preview=data.get("answer", "")[:200] if data.get("answer") else None
            )
        else:
            error_msg = response.json().get("error", response.text[:200])
            return TimingResult(
                endpoint="RAG (chat)",
                query=query,
                total_time_ms=total_time,
                status_code=response.status_code,
                error=error_msg
            )
            
    except requests.exceptions.Timeout:
        return TimingResult(
            endpoint="RAG (chat)",
            query=query,
            total_time_ms=timeout * 1000,
            error="Request timed out"
        )
    except requests.exceptions.RequestException as e:
        return TimingResult(
            endpoint="RAG (chat)",
            query=query,
            total_time_ms=0,
            error=str(e)
        )


def test_agent_endpoint(base_url: str, query: str, timeout: int = 60) -> TimingResult:
    """Test the Agent /api/agent endpoint (RAG + Web Search orchestration)."""
    endpoint = f"{base_url}/api/agent"
    payload = {
        "message": query,
        "conversation_history": []
    }
    
    start_time = time.perf_counter()
    
    try:
        response = requests.post(
            endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=timeout
        )
        
        total_time = (time.perf_counter() - start_time) * 1000  # ms
        
        if response.status_code == 200:
            data = response.json()
            return TimingResult(
                endpoint="Agent (RAG + Web)",
                query=query,
                total_time_ms=total_time,
                status_code=response.status_code,
                answer_preview=data.get("answer", "")[:200] if data.get("answer") else None,
                tool_calls=data.get("tool_calls", [])
            )
        else:
            error_msg = response.json().get("error", response.text[:200])
            return TimingResult(
                endpoint="Agent (RAG + Web)",
                query=query,
                total_time_ms=total_time,
                status_code=response.status_code,
                error=error_msg
            )
            
    except requests.exceptions.Timeout:
        return TimingResult(
            endpoint="Agent (RAG + Web)",
            query=query,
            total_time_ms=timeout * 1000,
            error="Request timed out"
        )
    except requests.exceptions.RequestException as e:
        return TimingResult(
            endpoint="Agent (RAG + Web)",
            query=query,
            total_time_ms=0,
            error=str(e)
        )


def test_agent_stream_endpoint(base_url: str, query: str, timeout: int = 60) -> TimingResult:
    """Test the Agent Stream /api/agent-stream endpoint."""
    endpoint = f"{base_url}/api/agent-stream"
    payload = {
        "message": query,
        "conversation_history": []
    }
    
    start_time = time.perf_counter()
    
    try:
        response = requests.post(
            endpoint,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=timeout
        )
        
        total_time = (time.perf_counter() - start_time) * 1000  # ms
        
        if response.status_code == 200:
            data = response.json()
            events = data.get("events", [])
            
            # Extract tool calls from events
            tool_calls = [e for e in events if e.get("type") == "tool_call"]
            final_event = next((e for e in events if e.get("type") == "final"), None)
            
            return TimingResult(
                endpoint="Agent Stream",
                query=query,
                total_time_ms=total_time,
                status_code=response.status_code,
                answer_preview=final_event.get("answer", "")[:200] if final_event else None,
                tool_calls=tool_calls
            )
        else:
            error_msg = response.json().get("error", response.text[:200])
            return TimingResult(
                endpoint="Agent Stream",
                query=query,
                total_time_ms=total_time,
                status_code=response.status_code,
                error=error_msg
            )
            
    except requests.exceptions.Timeout:
        return TimingResult(
            endpoint="Agent Stream",
            query=query,
            total_time_ms=timeout * 1000,
            error="Request timed out"
        )
    except requests.exceptions.RequestException as e:
        return TimingResult(
            endpoint="Agent Stream",
            query=query,
            total_time_ms=0,
            error=str(e)
        )


def check_health(base_url: str) -> bool:
    """Check if the API is healthy."""
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("status") == "healthy"
        return False
    except Exception:
        return False


def print_result(result: TimingResult, verbose: bool = False):
    """Print a single timing result."""
    status_emoji = "✅" if result.status_code == 200 else "❌"
    
    print(f"\n{'='*70}")
    print(f"{status_emoji} {result.endpoint}")
    print(f"{'='*70}")
    print(f"  Query: \"{result.query[:50]}...\"" if len(result.query) > 50 else f"  Query: \"{result.query}\"")
    
    if result.error:
        print(f"  ❌ Error: {result.error}")
    else:
        # Timing breakdown
        print(f"\n  ⏱️  TIMING:")
        print(f"     Total (client):    {result.total_time_ms:,.0f}ms ({result.total_time_ms/1000:.2f}s)")
        
        if result.server_time_ms:
            print(f"     Total (server):    {result.server_time_ms:,.0f}ms")
        if result.openai_search_ms:
            print(f"     OpenAI + Search:   {result.openai_search_ms:,.0f}ms")
        if result.processing_ms:
            print(f"     Processing:        {result.processing_ms:,.0f}ms")
        
        # Performance verdict
        if result.total_time_ms < 3000:
            verdict = "🚀 EXCELLENT"
        elif result.total_time_ms < 5000:
            verdict = "✅ GOOD"
        elif result.total_time_ms < 10000:
            verdict = "⚠️  SLOW"
        else:
            verdict = "🐌 VERY SLOW"
        
        print(f"\n     Performance: {verdict}")
        
        # Tool calls (for agent endpoints)
        if result.tool_calls:
            print(f"\n  🔧 TOOL CALLS ({len(result.tool_calls)}):")
            for tc in result.tool_calls[:5]:
                if isinstance(tc, dict):
                    tool_name = tc.get("tool", tc.get("name", "unknown"))
                    print(f"     - {tool_name}")
        
        # Answer preview
        if verbose and result.answer_preview:
            print(f"\n  💡 ANSWER PREVIEW:")
            print(f"     {result.answer_preview}...")


def run_performance_tests(base_url: str, verbose: bool = False):
    """Run all performance tests."""
    
    print("\n" + "="*70)
    print("🧪 RAG & WEB SEARCH PERFORMANCE TESTER")
    print("="*70)
    print(f"  Target: {base_url}")
    print(f"  Time:   {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    # Health check
    print("\n⏳ Checking API health...")
    is_healthy = check_health(base_url)
    if is_healthy:
        print("  ✅ API is healthy")
    else:
        print("  ⚠️  API health check failed - continuing anyway...")
    
    # Test queries
    test_queries = [
        # RAG-focused query (should use document search)
        {
            "query": "Mert hakkında bilgi ver",
            "type": "rag",
            "description": "RAG Query - Personal docs"
        },
        # Web search query (should trigger web search)
        {
            "query": "What are the latest developments in AI in 2024?",
            "type": "web",
            "description": "Web Search Query - Current events"
        },
        # Mixed query (might use both)
        {
            "query": "Connectome nedir ve güncel araştırmalar neler?",
            "type": "mixed",
            "description": "Mixed Query - RAG + Web"
        }
    ]
    
    all_results = []
    
    # Test RAG endpoint
    print("\n" + "="*70)
    print("📚 TESTING RAG ENDPOINT (/api/chat)")
    print("="*70)
    
    for test in test_queries:
        print(f"\n⏳ Testing: {test['description']}...")
        result = test_rag_endpoint(base_url, test["query"])
        all_results.append(result)
        print_result(result, verbose)
    
    # Test Agent endpoint
    print("\n" + "="*70)
    print("🤖 TESTING AGENT ENDPOINT (/api/agent)")
    print("="*70)
    
    for test in test_queries:
        print(f"\n⏳ Testing: {test['description']}...")
        result = test_agent_endpoint(base_url, test["query"])
        all_results.append(result)
        print_result(result, verbose)
    
    # Summary
    print("\n" + "="*70)
    print("📊 SUMMARY")
    print("="*70)
    
    successful_results = [r for r in all_results if r.status_code == 200]
    if successful_results:
        rag_times = [r.total_time_ms for r in successful_results if "RAG" in r.endpoint and "Agent" not in r.endpoint]
        agent_times = [r.total_time_ms for r in successful_results if "Agent" in r.endpoint]
        
        if rag_times:
            print(f"\n  RAG Endpoint:")
            print(f"     Average: {statistics.mean(rag_times):,.0f}ms")
            print(f"     Min:     {min(rag_times):,.0f}ms")
            print(f"     Max:     {max(rag_times):,.0f}ms")
        
        if agent_times:
            print(f"\n  Agent Endpoint:")
            print(f"     Average: {statistics.mean(agent_times):,.0f}ms")
            print(f"     Min:     {min(agent_times):,.0f}ms")
            print(f"     Max:     {max(agent_times):,.0f}ms")
    
    failed_count = len([r for r in all_results if r.status_code != 200])
    if failed_count:
        print(f"\n  ⚠️  Failed requests: {failed_count}/{len(all_results)}")
    
    print("\n" + "="*70)
    print("✅ Performance test complete!")
    print("="*70 + "\n")
    
    return all_results


def main():
    parser = argparse.ArgumentParser(description="Test RAG and Web Search API performance")
    parser.add_argument(
        "--url",
        default="https://func-rag-prod-3mktjtlolzx3q.azurewebsites.net",
        help="Base URL of the API (default: production)"
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Use local development URL (http://localhost:7071)"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Show answer previews"
    )
    parser.add_argument(
        "--query",
        type=str,
        help="Custom query to test (runs only this query)"
    )
    
    args = parser.parse_args()
    
    base_url = "http://localhost:7071" if args.local else args.url
    
    if args.query:
        # Run single query on both endpoints
        print(f"\n🧪 Testing custom query: \"{args.query}\"")
        print(f"   Target: {base_url}\n")
        
        result_rag = test_rag_endpoint(base_url, args.query)
        print_result(result_rag, verbose=True)
        
        result_agent = test_agent_endpoint(base_url, args.query)
        print_result(result_agent, verbose=True)
    else:
        run_performance_tests(base_url, verbose=args.verbose)


if __name__ == "__main__":
    main()
