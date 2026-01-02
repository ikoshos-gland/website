/**
 * React Hook for RAG Chat API
 * Supports both simple RAG chat and agent-based chat with tool orchestration.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// Configure the API endpoint
const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:7071';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Citation {
  title: string;
  content: string;
  url?: string;
  filepath?: string;
}

export interface ToolCall {
  tool: string;
  status: 'calling' | 'completed' | 'error';
  message?: string;
}

export interface AgentStatus {
  isThinking: boolean;
  currentTool: string | null;
  statusMessage: string | null;
  toolCalls: ToolCall[];
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  tool_calls?: ToolCall[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AgentEvent {
  type: 'status' | 'response' | 'error';
  tool?: string;
  message?: string;
  answer?: string;
  tool_calls?: ToolCall[];
  citations?: Citation[];
  error?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface UseRagChatReturn {
  messages: Message[];
  citations: Citation[];
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
  isCheckingHealth: boolean;
  isRateLimited: boolean;
  rateLimitInfo: RateLimitInfo | null;
  agentStatus: AgentStatus;
  useAgent: boolean;
  setUseAgent: (value: boolean) => void;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  checkHealth: () => Promise<void>;
}

// Parse rate limit headers from response
const parseRateLimitHeaders = (headers: Headers): RateLimitInfo | null => {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');
  const retryAfter = headers.get('Retry-After');

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      resetTime: parseInt(reset, 10),
      retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
    };
  }
  return null;
};

export function useRagChat(): UseRagChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [useAgent, setUseAgent] = useState(true); // Default to agent mode
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isThinking: false,
    currentTool: null,
    statusMessage: null,
    toolCalls: [],
  });

  // Track retry timeout
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear rate limit after retry period
  useEffect(() => {
    if (isRateLimited && rateLimitInfo?.retryAfter) {
      retryTimeoutRef.current = setTimeout(() => {
        setIsRateLimited(false);
        setError(null);
      }, rateLimitInfo.retryAfter * 1000);
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isRateLimited, rateLimitInfo]);

  // Health check on mount
  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch(`${RAG_API_URL}/api/health`, {
        method: 'GET',
      });

      const rateInfo = parseRateLimitHeaders(response.headers);
      if (rateInfo) {
        setRateLimitInfo(rateInfo);
      }

      if (response.status === 429) {
        setIsRateLimited(true);
        setError('Too many requests. Please wait.');
        setIsReady(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setIsReady(data.status === 'healthy');
        setIsRateLimited(false);
        if (data.status !== 'healthy') {
          setError('Chat service is not fully configured.');
        }
      } else {
        setIsReady(false);
        setError('Cannot connect to server.');
      }
    } catch {
      setIsReady(false);
      setError('Cannot connect to server. Please try again later.');
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // Check health on first render
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Send message using agent endpoint with status updates
  const sendMessageWithAgent = useCallback(async (userMessage: string) => {
    setAgentStatus({
      isThinking: true,
      currentTool: null,
      statusMessage: 'Thinking...',
      toolCalls: [],
    });

    const response = await fetch(`${RAG_API_URL}/api/agent-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        conversation_history: messages,
      }),
    });

    // Parse rate limit info
    const rateInfo = parseRateLimitHeaders(response.headers);
    if (rateInfo) {
      setRateLimitInfo(rateInfo);
    }

    if (response.status === 429) {
      setIsRateLimited(true);
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) : 60;
      throw new Error(`Too many requests. Please wait ${waitTime} seconds.`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    const events: AgentEvent[] = data.events || [];

    // Process events
    const allToolCalls: ToolCall[] = [];
    let finalAnswer = '';
    let finalCitations: Citation[] = [];

    for (const event of events) {
      if (event.type === 'status') {
        const toolCall: ToolCall = {
          tool: event.tool || 'unknown',
          status: 'completed',
          message: event.message,
        };
        allToolCalls.push(toolCall);

        setAgentStatus(prev => ({
          ...prev,
          currentTool: event.tool || null,
          statusMessage: event.message || null,
          toolCalls: [...prev.toolCalls, toolCall],
        }));
      } else if (event.type === 'response') {
        finalAnswer = event.answer || '';
        finalCitations = event.citations || [];
      } else if (event.type === 'error') {
        throw new Error(event.error || 'Agent error');
      }
    }

    return { answer: finalAnswer, citations: finalCitations, toolCalls: allToolCalls };
  }, [messages]);

  // Send message using simple chat endpoint
  const sendMessageSimple = useCallback(async (userMessage: string) => {
    const response = await fetch(`${RAG_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        conversation_history: messages,
      }),
    });

    // Parse rate limit info
    const rateInfo = parseRateLimitHeaders(response.headers);
    if (rateInfo) {
      setRateLimitInfo(rateInfo);
    }

    if (response.status === 429) {
      setIsRateLimited(true);
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) : 60;
      throw new Error(`Too many requests. Please wait ${waitTime} seconds.`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return { answer: data.answer, citations: data.citations || [], toolCalls: [] };
  }, [messages]);

  // Main send message function
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;
    if (isRateLimited) {
      setError('Too many requests. Please wait.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      let result: { answer: string; citations: Citation[]; toolCalls: ToolCall[] };

      if (useAgent) {
        result = await sendMessageWithAgent(userMessage);
      } else {
        result = await sendMessageSimple(userMessage);
      }

      // Add assistant response
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);

      // Update citations
      if (result.citations && result.citations.length > 0) {
        setCitations(result.citations);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setAgentStatus({
        isThinking: false,
        currentTool: null,
        statusMessage: null,
        toolCalls: [],
      });
    }
  }, [useAgent, isRateLimited, sendMessageWithAgent, sendMessageSimple]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCitations([]);
    setError(null);
    setAgentStatus({
      isThinking: false,
      currentTool: null,
      statusMessage: null,
      toolCalls: [],
    });
  }, []);

  return {
    messages,
    citations,
    isLoading,
    error,
    isReady,
    isCheckingHealth,
    isRateLimited,
    rateLimitInfo,
    agentStatus,
    useAgent,
    setUseAgent,
    sendMessage,
    clearChat,
    checkHealth,
  };
}

/**
 * Hook for direct document search (without chat)
 */
export interface SearchResult {
  title: string;
  content: string;
  url: string;
  score: number;
}

export function useRagSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    if (isRateLimited) {
      setSearchError('Too many requests. Please wait.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`${RAG_API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.status === 429) {
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), 60000);
        throw new Error('Too many requests. Please wait.');
      }

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isRateLimited]);

  return {
    results,
    isSearching,
    searchError,
    isRateLimited,
    search,
    clearResults: () => setResults([]),
  };
}
