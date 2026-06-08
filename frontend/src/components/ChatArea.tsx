import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { NewsCard } from './NewsCard';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '../hooks/useTranslation';

interface Message {
    role: 'user' | 'agent';
    content?: string;
    type?: 'status' | 'response' | 'error';
    data?: {
        greeting?: string;
        message?: string;
        articles?: any[];
    };
}

interface ChatAreaProps {
    messages: Message[];
    sendMessage: (msg: string) => void;
    status: string;
    conversationId?: string | null;
    agentType?: string;
}

export function ChatArea({ messages, sendMessage, status, conversationId, agentType = 'general' }: ChatAreaProps) {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && status === 'connected') {
            sendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full relative z-10">
            {/* Header */}
            <div className="flex-shrink-0 h-16 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center px-6 justify-between bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-b-3xl mx-4 mt-2 shadow-sm z-20 border border-slate-200/50 dark:border-slate-700/50 border-t-0">
                <div className="font-bold text-xl flex items-center gap-3 capitalize text-slate-900 dark:text-white tracking-tight">
                    {agentType} Agent
                    <span className={`w-2 h-2 rounded-full shadow-sm ${status === 'connected' ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-red-500 shadow-red-500/50'}`}></span>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 animate-in fade-in duration-700">
                        <div className="bg-white/50 dark:bg-slate-800/30 p-8 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-xl max-w-md backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{t('chat.welcome')} {agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t('chat.askAbout')}
                            </p>
                        </div>
                    </div>
                )}
                
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-none shadow-indigo-500/20' 
                                : 'glass-panel-light dark:!bg-slate-800/80 rounded-tl-none text-slate-800 dark:text-slate-100'
                        }`}>
                            {msg.role === 'user' ? (
                                <p>{msg.content}</p>
                            ) : (
                                <div>
                                    {msg.type === 'status' && <p className="text-slate-500 italic text-sm animate-pulse">{msg.content}</p>}
                                    {msg.type === 'error' && <p className="text-red-500">{msg.content}</p>}
                                    {msg.type === 'response' && msg.data && (
                                        <div>
                                            {msg.data.greeting && <p className="font-medium mb-2">{msg.data.greeting}</p>}
                                            <div className="mb-4 space-y-2 [&_a]:text-agentBlue [&_a]:underline [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_p]:leading-relaxed">
                                                <ReactMarkdown>{msg.data.message || ''}</ReactMarkdown>
                                            </div>
                                            {msg.data.articles && msg.data.articles.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                    {msg.data.articles.map((article: any, idx: number) => (
                                                        <NewsCard key={idx} article={article} conversationId={conversationId} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-6 pb-6 pt-2">
                <div className="flex items-center gap-3 glass-panel-light dark:!bg-white/[0.03] rounded-full p-2 pl-6 shadow-2xl border border-white/40 dark:border-white/10 mx-auto max-w-4xl focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all backdrop-blur-xl">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t('chat.placeholder')}
                        className="flex-1 bg-transparent border-none focus:outline-none text-base text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                        disabled={status !== 'connected'}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || status !== 'connected'}
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-3 rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none hover:scale-105 active:scale-95 flex-shrink-0"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
