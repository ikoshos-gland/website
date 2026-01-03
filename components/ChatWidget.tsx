/**
 * ChatWidget - Premium AI Agent Chat Component
 * Features: Agent orchestration, smooth animations, glassmorphism design, typing indicators
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2, FileText, AlertCircle, RefreshCw, Search, Globe, User, Clock, Sparkles, Bot } from 'lucide-react';
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
          bg-gradient-to-br from-white to-gray-100 text-[#0E0F11] p-4 rounded-full shadow-2xl
          hover:scale-110 hover:shadow-white/20 transition-all duration-300
          ring-4 ring-white/10 hover:ring-white/30
          group relative overflow-hidden`}
        aria-label="Open chat"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <MessageSquare className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
        {!isReady && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50
        w-[calc(100%-2rem)] sm:w-[440px] max-h-[650px]
        bg-gradient-to-b from-[#1a1b1e] to-[#141517]
        border border-white/10 rounded-3xl shadow-2xl
        flex flex-col overflow-hidden
        backdrop-blur-xl
        animate-slideUp`}
      style={{
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      {/* Header with Gradient */}
      <div className="relative flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />

        <div className="flex items-center gap-3 relative z-10">
          {/* Avatar with animation */}
          <div className="relative">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center ring-2 ring-white/20
              ${agentStatus.isThinking ? 'animate-pulse' : ''}`}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1b1e]
              ${agentStatus.isThinking ? 'bg-blue-400 animate-pulse' : 'bg-green-500'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Lundo</span>
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </div>
            {agentStatus.isThinking ? (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="inline-block w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="inline-block w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            ) : (
              <span className="text-xs text-green-400">Online</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={clearChat}
            className="text-[#A1A1A6] hover:text-white p-2 transition-colors text-xs
              hover:bg-white/5 rounded-lg"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={handleClose}
            className="text-[#A1A1A6] hover:text-white p-1.5 transition-colors
              hover:bg-white/5 rounded-lg group"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
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
              <div className="animate-messageSlideIn">
                <MessageBubble
                  message={{
                    role: 'assistant',
                    content: "Hey there! 👋 I'm **Lundo**, Mert's AI assistant.\n\n✨ I can help you:\n- 📚 Search through his research papers\n- 🌐 Browse the web for information\n- 💼 Learn about his projects and work\n\nWhat would you like to know?"
                  }}
                />
              </div>
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

            {/* Tool Pills - Premium design with animations */}
            {agentStatus.toolCalls.length > 0 && agentStatus.isThinking && (
              <div className="flex flex-wrap gap-2 animate-messageSlideIn">
                {agentStatus.toolCalls.map((tc, idx) => {
                  const display = getToolDisplay(tc.tool);
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                        font-medium transition-all duration-200
                        ${tc.status === 'completed'
                          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/40 shadow-lg shadow-green-500/10'
                          : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                        }`}
                    >
                      {display.icon}
                      <span>{display.name}</span>
                      {tc.status === 'completed' && (
                        <span className="text-[10px]">✓</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Premium typing indicator when loading */}
            {isLoading && !agentStatus.statusMessage && (
              <div className="flex gap-2 items-start animate-messageSlideIn">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
                  flex items-center justify-center ring-2 ring-white/10 mt-1 animate-pulse">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gradient-to-br from-[#2a2b2e] to-[#252628] rounded-2xl rounded-bl-md
                  px-5 py-4 border border-white/10 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
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

      {/* Input - Premium Design */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-gradient-to-b from-transparent to-black/20">
        <div className="flex items-center gap-2 relative">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isReady ? "Ask me anything..." : "Not ready..."}
              className="w-full bg-[#2a2b2e] text-white placeholder-[#A1A1A6]
                rounded-xl px-4 py-3.5 pr-12 outline-none
                focus:ring-2 focus:ring-blue-500/50 focus:bg-[#2f3032]
                transition-all disabled:opacity-50
                border border-transparent focus:border-blue-500/30"
              disabled={isLoading || !isReady}
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1A6] hover:text-white
                  transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading || !isReady}
            className="relative bg-gradient-to-br from-blue-500 to-purple-600 text-white p-3.5 rounded-xl
              hover:from-blue-600 hover:to-purple-700
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500
              transition-all duration-200 shadow-lg hover:shadow-blue-500/50
              group overflow-hidden"
            aria-label="Send message"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Send className={`w-5 h-5 relative z-10 transition-transform ${isLoading ? 'animate-pulse' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} />
          </button>
        </div>

        {/* Character count hint (optional) */}
        {input.length > 100 && (
          <div className="text-right mt-2 text-xs text-[#A1A1A6]">
            {input.length} characters
          </div>
        )}
      </form>
    </div>
  );
};

// Message bubble component with premium design
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const renderContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-[15px] leading-relaxed whitespace-pre-wrap mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <span className="font-bold text-inherit">{children}</span>,
          ul: ({ children }) => <ul className="list-disc list-inside text-sm mb-2 space-y-1.5 ml-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-sm mb-2 space-y-1.5 ml-2">{children}</ol>,
          li: ({ children }) => <li className="text-[14px] leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-1">{children}</h3>,
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
            }
            return (
              <pre className="bg-black/30 p-3 rounded-lg text-xs overflow-x-auto mb-2 border border-white/10 font-mono">
                <code>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300 transition-colors">
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
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-messageSlideIn`}>
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
          flex items-center justify-center ring-2 ring-white/10 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`group relative rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-br from-white to-gray-50 text-[#0E0F11] rounded-br-md shadow-lg'
              : 'bg-gradient-to-br from-[#2a2b2e] to-[#252628] text-white rounded-bl-md border border-white/10'
          }`}
        >
          {isUser ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            renderContent(message.content)
          )}

          {/* Timestamp tooltip */}
          <span className={`absolute -bottom-5 text-[10px] text-[#A1A1A6] opacity-0 group-hover:opacity-100 transition-opacity
            ${isUser ? 'right-0' : 'left-0'}`}>
            {timestamp}
          </span>
        </div>
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300
          flex items-center justify-center ring-2 ring-white/20 mt-1">
          <User className="w-4 h-4 text-[#0E0F11]" />
        </div>
      )}
    </div>
  );
};

// Citation chip component - Premium design
const CitationChip: React.FC<{ citation: Citation }> = ({ citation }) => {
  return (
    <a
      href={citation.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 text-xs
        bg-gradient-to-br from-[#2a2b2e] to-[#252628]
        text-[#A1A1A6] px-3 py-1.5 rounded-lg
        hover:text-white hover:from-[#2f3032] hover:to-[#2a2b2e]
        transition-all duration-200
        border border-white/10 hover:border-white/20
        hover:shadow-lg hover:shadow-blue-500/10"
      title={citation.content}
    >
      <FileText className="w-3 h-3 group-hover:text-blue-400 transition-colors" />
      <span className="max-w-[100px] truncate">{citation.title}</span>
    </a>
  );
};

export default ChatWidget;
