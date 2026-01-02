/**
 * ChatWidget - AI Agent Chat Component
 * Features agent orchestration with tool status display.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2, FileText, AlertCircle, RefreshCw, Search, Globe, User, Clock } from 'lucide-react';
import { useRagChat, Message, Citation } from '../hooks/useRagChat';

interface ChatWidgetProps {
  /** Check if the chat is open (controlled) */
  isOpen?: boolean;
  /** Callback to close the chat */
  onClose?: () => void;
  /** Initial collapsed state (uncontrolled mode) */
  defaultOpen?: boolean;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left';
}

// Map tool names to icons and display names
const TOOL_DISPLAY: Record<string, { icon: React.ReactNode; name: string }> = {
  'RAG-search_documents': { icon: <Search className="w-3 h-3" />, name: 'Documents' },
  'WebSearch-search_web': { icon: <Globe className="w-3 h-3" />, name: 'Web' },
  'AboutMe-get_profile': { icon: <User className="w-3 h-3" />, name: 'Profile' },
  'DateTime-get_current_time': { icon: <Clock className="w-3 h-3" />, name: 'Time' },
  'DateTime-calculate_date': { icon: <Clock className="w-3 h-3" />, name: 'Date' },
  'DateTime-days_until': { icon: <Clock className="w-3 h-3" />, name: 'Days' },
};

const getToolDisplay = (toolName: string) => {
  return TOOL_DISPLAY[toolName] || { icon: <Search className="w-3 h-3" />, name: toolName.split('-').pop() || 'Tool' };
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  defaultOpen = false,
  position = 'bottom-right',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    citations,
    isLoading,
    error,
    isReady,
    isCheckingHealth,
    agentStatus,
    sendMessage,
    clearChat,
    checkHealth
  } = useRagChat();

  // Auto-scroll to bottom on new messages or status updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentStatus.statusMessage]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  const positionClasses = position === 'bottom-right'
    ? 'right-4 sm:right-6'
    : 'left-4 sm:left-6';

  if (!isOpen) {
    if (isControlled) {
      return null;
    }

    return (
      <button
        onClick={() => setInternalIsOpen(true)}
        className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50
          bg-white text-[#0E0F11] p-4 rounded-full shadow-lg
          hover:scale-105 transition-transform duration-200`}
        aria-label="Open chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50
        w-[calc(100%-2rem)] sm:w-96 max-h-[600px]
        bg-[#1a1b1e] border border-[#2a2b2e] rounded-2xl shadow-2xl
        flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2b2e]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agentStatus.isThinking ? 'bg-blue-400 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-white font-medium">Lundo</span>
          {agentStatus.isThinking && (
            <span className="text-xs text-blue-400">thinking...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-[#A1A1A6] hover:text-white p-1 transition-colors text-sm"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={handleClose}
            className="text-[#A1A1A6] hover:text-white p-1 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
        {/* Loading health check */}
        {isCheckingHealth && (
          <div className="flex flex-col items-center justify-center py-12 text-[#A1A1A6]">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p>Connecting...</p>
          </div>
        )}

        {/* Not ready state */}
        {!isCheckingHealth && !isReady && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-white font-medium mb-2">Configuration Required</h3>
            <p className="text-[#A1A1A6] text-sm mb-4 px-4">
              The chat service is not ready yet. Please try again later.
            </p>
            <button
              onClick={checkHealth}
              className="flex items-center gap-2 text-sm text-white bg-[#2a2b2e] px-4 py-2 rounded-lg hover:bg-[#3a3b3e] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Ready state - show messages */}
        {!isCheckingHealth && isReady && (
          <>
            {messages.length === 0 && (
              <MessageBubble
                message={{
                  role: 'assistant',
                  content: "Hey there! I'm **Lundo**, Mert's personalized AI assistant.\n\nI can search through his documents, browse the web, and tell you about his work. What would you like to know?"
                }}
              />
            )}

            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}

            {/* Agent Status Indicator */}
            {agentStatus.isThinking && agentStatus.statusMessage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-sm text-blue-400">{agentStatus.statusMessage}</span>
              </div>
            )}

            {/* Tool Pills - Show what tools were used during this interaction */}
            {agentStatus.toolCalls.length > 0 && agentStatus.isThinking && (
              <div className="flex flex-wrap gap-1.5">
                {agentStatus.toolCalls.map((tc, idx) => {
                  const display = getToolDisplay(tc.tool);
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
                        ${tc.status === 'completed'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                    >
                      {display.icon}
                      <span>{display.name}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Simple loading indicator when not showing agent status */}
            {isLoading && !agentStatus.statusMessage && (
              <div className="flex items-center gap-2 text-[#A1A1A6]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="px-4 py-2 border-t border-[#2a2b2e]">
          <p className="text-xs text-[#A1A1A6] mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {citations.slice(0, 3).map((citation, index) => (
              <CitationChip key={index} citation={citation} />
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#2a2b2e]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? "Ask me anything..." : "Not ready..."}
            className="flex-1 bg-[#2a2b2e] text-white placeholder-[#A1A1A6]
              rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-white/20
              transition-all disabled:opacity-50"
            disabled={isLoading || !isReady}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !isReady}
            className="bg-white text-[#0E0F11] p-2.5 rounded-lg
              hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

// Message bubble component
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  const renderContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-sm whitespace-pre-wrap mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <span className="font-bold text-inherit">{children}</span>,
          ul: ({ children }) => <ul className="list-disc list-inside text-sm mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="bg-white/10 px-1 py-0.5 rounded text-xs">{children}</code>;
            }
            return (
              <pre className="bg-white/5 p-2 rounded text-xs overflow-x-auto mb-2">
                <code>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser
          ? 'bg-white text-[#0E0F11] rounded-br-md'
          : 'bg-[#2a2b2e] text-white rounded-bl-md'
          }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          renderContent(message.content)
        )}
      </div>
    </div>
  );
};

// Citation chip component
const CitationChip: React.FC<{ citation: Citation }> = ({ citation }) => {
  return (
    <a
      href={citation.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs bg-[#2a2b2e]
        text-[#A1A1A6] px-2 py-1 rounded hover:text-white transition-colors"
      title={citation.content}
    >
      <FileText className="w-3 h-3" />
      <span className="max-w-[100px] truncate">{citation.title}</span>
    </a>
  );
};

export default ChatWidget;
