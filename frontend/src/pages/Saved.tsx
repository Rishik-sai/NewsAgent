import { useEffect, useState } from 'react';
import { NewsCard } from '../components/NewsCard';
import { Bookmark, Loader2 } from 'lucide-react';

interface Article {
    id: number;
    headline: string;
    source: string;
    timestamp: string;
    summary: string;
    url: string;
    image?: string;
    conversation_id?: number | string | null;
}

export function Saved() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSaved = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${baseUrl}/api/news/saved`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setArticles(data);
                }
            } else {
                console.error("Failed to fetch saved articles", res.statusText);
            }
        } catch (e) {
            console.error("Failed to fetch saved articles", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSaved();
    }, []);

    const handleUnsave = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${baseUrl}/api/news/save/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setArticles(prev => prev.filter(a => a.id !== id));
            } else {
                console.error("Failed to unsave article", res.statusText);
            }
        } catch (e) {
            console.error("Failed to unsave article", e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-agentBlue" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
            <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-agentBlue text-white flex items-center justify-center shadow-md">
                    <Bookmark size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Articles</h2>
            </div>
            
            {articles.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center shadow-sm border border-slate-200 dark:border-slate-700">
                    <Bookmark size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No saved articles</h3>
                    <p className="text-slate-500">Your saved news articles will appear here. Ask the agent for news and click the bookmark icon to save!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {articles.map((article) => (
                        <div key={article.id} className="relative">
                            <NewsCard 
                                article={article} 
                                isSavedView={true} 
                                onUnsave={() => handleUnsave(article.id)} 
                            />
                            {article.conversation_id && (
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md z-10 border border-slate-600">
                                    Conv #{article.conversation_id}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
