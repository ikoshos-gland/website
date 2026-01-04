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

  const [showSecondMessage, setShowSecondMessage] = useState(false);
  const [isTypingSecondMessage, setIsTypingSecondMessage] = useState(false);

  // Auto-scroll to bottom on new messages or status updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentStatus.statusMessage, showSecondMessage, isTypingSecondMessage]);

  // Handle welcome message sequence
  useEffect(() => {
    if (isReady && messages.length === 0 && !showSecondMessage && !isTypingSecondMessage) {
      const timer1 = setTimeout(() => {
        setIsTypingSecondMessage(true);
      }, 1000);

      const timer2 = setTimeout(() => {
        setIsTypingSecondMessage(false);
        setShowSecondMessage(true);
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isReady, messages.length]);

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
          bg-white text-black p-4 rounded-full shadow-2xl
          hover:scale-105 transition-all duration-300
          border border-black/5
          group relative overflow-hidden`}
        aria-label="Open chat"
      >
        <MessageSquare className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
        {!isReady && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50
        w-[calc(100%-2rem)] sm:w-[440px] max-h-[650px]
        bg-black
        border border-white/10 rounded-3xl shadow-2xl
        flex flex-col overflow-hidden
        backdrop-blur-xl
        animate-slideUp`}
      style={{
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
      }}
    >
      {/* Header - Elegant Black */}
      <div className="relative flex items-center justify-between p-4 border-b border-white/10 bg-black/50">

        <div className="flex items-center gap-3 relative z-10">
          {/* Avatar - Minimalist */}
          <div className="relative">
            <div className={`w-10 h-10 rounded-full bg-zinc-900 border border-white/10
              flex items-center justify-center overflow-hidden p-1
              ${agentStatus.isThinking ? 'animate-pulse' : ''}`}>
              <img src="/lundo-logo.png" alt="Lundo" className="w-full h-full object-contain filter invert" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black
              ${agentStatus.isThinking ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm tracking-wide">Lundo</span>
            </div>
            {agentStatus.isThinking ? (
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="inline-block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="inline-block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            ) : (
              <span className="text-xs text-zinc-500">Çevrimiçi</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={clearChat}
            className="text-zinc-500 hover:text-white p-2 transition-colors text-xs
              hover:bg-white/5 rounded-lg"
            title="Sohbeti temizle"
          >
            Temizle
          </button>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-white p-1.5 transition-colors
              hover:bg-white/5 rounded-lg group"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-black">
        {/* Loading health check */}
        {isCheckingHealth && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-white" />
            <p className="text-xs tracking-wider uppercase">Bağlanıyor...</p>
          </div>
        )}

        {/* Not ready state */}
        {!isCheckingHealth && !isReady && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-white font-medium mb-2">Yapılandırma Gerekli</h3>
            <p className="text-zinc-500 text-sm mb-4 px-4">
              Sohbet servisi henüz hazır değil. Lütfen daha sonra tekrar deneyin.
            </p>
            <button
              onClick={checkHealth}
              className="flex items-center gap-2 text-sm text-black bg-white px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Ready state - show messages */}
        {!isCheckingHealth && isReady && (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col gap-4 animate-messageSlideIn">
                <MessageBubble
                  message={{
                    role: 'assistant',
                    content: "Hi there! 👋 I’m **Lundo**, Mert’s personal assistant. I’ve been fed with everything Mert has ever read, written, or dreamed of (I even know about his childhood crushes!)."
                  }}
                />

                {isTypingSecondMessage && (
                  <div className="flex gap-2 items-start animate-messageSlideIn">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-white/10
                      flex items-center justify-center mt-1 overflow-hidden p-1 animate-pulse">
                      <img src="/lundo-logo.png" alt="Lundo" className="w-full h-full object-contain filter invert" />
                    </div>
                    <div className="bg-zinc-900 rounded-2xl rounded-bl-md
                      px-5 py-4 border border-white/5 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {showSecondMessage && (
                  <MessageBubble
                    message={{
                      role: 'assistant',
                      content: "Remember i am not just a simple chatbot rather an agentic entity capable of merging Mert’s personal archives with the vast knowledge of the web and has long-/short term memory. Feel free to explore his projects, his mind, and his world with me."
                    }}
                  />
                )}
              </div>
            )}

            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}

            {/* Agent Status Indicator */}
            {agentStatus.isThinking && agentStatus.statusMessage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-lg border border-white/5">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-sm text-zinc-400">{agentStatus.statusMessage}</span>
              </div>
            )}

            {/* Tool Pills - Minimalist Design */}
            {agentStatus.toolCalls.length > 0 && agentStatus.isThinking && (
              <div className="flex flex-wrap gap-2 animate-messageSlideIn">
                {agentStatus.toolCalls.map((tc, idx) => {
                  const display = getToolDisplay(tc.tool);
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                        font-medium transition-all duration-200 border
                        ${tc.status === 'completed'
                          ? 'bg-zinc-900 text-zinc-300 border-white/10'
                          : 'bg-black text-zinc-500 border-zinc-800 animate-pulse'
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

            {/* Typing indicator */}
            {isLoading && !agentStatus.statusMessage && (
              <div className="flex gap-2 items-start animate-messageSlideIn">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-white/10
                  flex items-center justify-center mt-1 animate-pulse">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-zinc-900 rounded-2xl rounded-bl-md
                  px-5 py-4 border border-white/5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                {error}
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Citations */}
      {
        citations.length > 0 && (
          <div className="px-4 py-2 border-t border-white/10 bg-black">
            <p className="text-xs text-zinc-500 mb-2">Kaynaklar:</p>
            <div className="flex flex-wrap gap-2">
              {citations.slice(0, 3).map((citation, index) => (
                <CitationChip key={index} citation={citation} />
              ))}
            </div>
          </div>
        )
      }

      {/* Input - Minimalist Design */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black">
        <div className="flex items-center gap-2 relative">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isReady ? "Bir şeyler sor..." : "Hazırlanıyor..."}
              className="w-full bg-zinc-900 text-white placeholder-zinc-500
                rounded-xl px-4 py-3.5 pr-12 outline-none
                focus:ring-1 focus:ring-white/20
                transition-all disabled:opacity-50
                border border-white/5 focus:border-white/10"
              disabled={isLoading || !isReady}
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white
                  transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading || !isReady}
            className="relative bg-white text-black p-3.5 rounded-xl
              hover:bg-zinc-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500
              transition-all duration-200 shadow-lg
              group overflow-hidden"
            aria-label="Send message"
          >
            <Send className={`w-5 h-5 relative z-10 transition-transform ${isLoading ? 'animate-pulse' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} />
          </button>
        </div>
      </form>
    </div >
  );
};

// Message bubble component with minimalist design
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

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
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-white hover:text-zinc-300 underline decoration-white/30 hover:decoration-white/60 transition-colors">
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
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-white/10
          flex items-center justify-center mt-1 overflow-hidden p-1">
          <img src="/lundo-logo.png" alt="Lundo" className="w-full h-full object-contain filter invert" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div
          className={`group relative rounded-2xl px-4 py-3 ${isUser
            ? 'bg-white text-black rounded-br-md shadow-sm'
            : 'bg-zinc-900 text-zinc-100 rounded-bl-md border border-white/5'
            }`}
        >
          {isUser ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            renderContent(message.content)
          )}

          {/* Timestamp tooltip */}
          <span className={`absolute -bottom-5 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity
            ${isUser ? 'right-0' : 'left-0'}`}>
            {timestamp}
          </span>
        </div>
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-zinc-200
          flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-black" />
        </div>
      )}
    </div>
  );
};

// Citation chip component - Minimalist design
const CitationChip: React.FC<{ citation: Citation }> = ({ citation }) => {
  return (
    <a
      href={citation.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 text-xs
        bg-zinc-900 border border-white/10
        text-zinc-500 px-3 py-1.5 rounded-lg
        hover:text-white hover:bg-zinc-800 hover:border-white/20
        transition-all duration-200
        hover:shadow-lg hover:shadow-white/5"
      title={citation.content}
    >
      <FileText className="w-3 h-3 group-hover:text-white transition-colors" />
      <span className="max-w-[100px] truncate">{citation.title}</span>
    </a>
  );
};

export default ChatWidget;
