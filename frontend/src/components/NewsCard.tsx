import { ExternalLink, Bookmark, BookmarkCheck, Share2, Check } from 'lucide-react';
import { useState } from 'react';

interface ArticleProps {
    article: {
        id?: number;
        headline: string;
        source: string;
        timestamp: string;
        summary: string;
        url: string;
        image?: string;
    };
    conversationId?: string | null;
    isSavedView?: boolean;
    onUnsave?: () => void;
}

export function NewsCard({ article, conversationId, isSavedView, onUnsave }: ArticleProps) {
    const [isSaved, setIsSaved] = useState(isSavedView || false);
    const [isSaving, setIsSaving] = useState(false);
    const [shared, setShared] = useState(false);
    
    const handleSave = async () => {
        if (isSavedView && onUnsave && article.id) {
            onUnsave();
            return;
        }

        if (isSaved) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            
            const res = await fetch(`${baseUrl}/api/news/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    headline: article.headline,
                    url: article.url,
                    source: article.source,
                    timestamp: article.timestamp,
                    summary: article.summary,
                    conversation_id: conversationId ? parseInt(conversationId) : null
                })
            });
            if (res.ok) {
                setIsSaved(true);
            } else {
                console.error("Failed to save article", res.statusText);
            }
        } catch (e) {
            console.error("Failed to save article", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(article.url);
            setShared(true);
            setTimeout(() => setShared(false), 2000);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full group">
            {article.image && (
                <div className="h-40 w-full overflow-hidden">
                    <img src={article.image} alt={article.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
            )}
            
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-agentBlue/10 text-agentBlue dark:bg-agentBlue/20 dark:text-blue-400 rounded-full text-[10px] font-bold tracking-wide uppercase">
                        {article.source}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(article.timestamp).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2.5 leading-snug group-hover:text-agentBlue transition-colors">
                    {article.headline}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 flex-grow leading-relaxed">
                    {article.summary}
                </p>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-auto flex items-center justify-between">
                    <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-agentBlue hover:text-blue-600 transition-colors"
                    >
                        Read article <ExternalLink size={14} />
                    </a>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={handleShare}
                            className="p-2 text-slate-400 hover:text-agentBlue hover:bg-agentBlue/10 rounded-full transition-all"
                            title="Copy link"
                        >
                            {shared ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || isSaved && !isSavedView}
                            className={`p-2 rounded-full transition-all flex items-center gap-1 ${
                                isSaved 
                                    ? isSavedView 
                                        ? 'text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10' 
                                        : 'text-agentBlue bg-agentBlue/10 cursor-default'
                                    : 'text-slate-400 hover:text-agentBlue hover:bg-agentBlue/10'
                            }`}
                            title={isSavedView ? "Unsave" : "Save"}
                        >
                            {isSavedView ? (
                                <span className="text-xs font-semibold px-1">Unsave</span>
                            ) : isSaved ? (
                                <BookmarkCheck size={18} className="fill-current" />
                            ) : (
                                <Bookmark size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
