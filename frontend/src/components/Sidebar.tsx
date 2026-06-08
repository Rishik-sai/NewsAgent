import { useState, useEffect } from 'react';
import { MessageSquare, LayoutDashboard, Settings, LogOut, Bookmark, Languages, Trash2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

export function Sidebar() {
    const { logout, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [conversations, setConversations] = useState<{id: number, title: string}[]>([]);

    useEffect(() => {
        if (token) {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            fetch(`${baseUrl}/api/chat/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setConversations(data);
            })
            .catch(console.error);
        }
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteConversation = async (id: number) => {
        if (!confirm('Are you sure you want to delete this conversation? This will delete all saved news associated with it.')) return;
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            await fetch(`${baseUrl}/api/chat/conversations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setConversations(prev => prev.filter(c => c.id !== id));
            const params = new URLSearchParams(window.location.search);
            if (params.get('c') === id.toString()) {
                navigate('/');
                window.location.href = '/';
            }
        } catch (e) {
            console.error("Failed to delete conversation", e);
        }
    };

    return (
        <div className="w-[260px] h-full bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl border-r border-slate-200/50 dark:border-white/5 flex flex-col p-4 relative z-20 shadow-2xl">
            <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-agentBlue flex items-center justify-center text-white font-bold">
                    NA
                </div>
                <h1 className="font-semibold text-lg">News Agent</h1>
            </Link>

            <nav className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === '/' 
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:translate-x-1'
                }`}>
                    <LayoutDashboard size={18} />
                    {t('sidebar.agentHub')}
                </Link>
                <Link to="/saved" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === '/saved'
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:translate-x-1'
                }`}>
                    <Bookmark size={18} />
                    {t('sidebar.saved')}
                </Link>
                <Link to="/language" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === '/language'
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:translate-x-1'
                }`}>
                    <Languages size={18} />
                    {t('sidebar.language')}
                </Link>
                
                {conversations.length > 0 && (
                    <div className="pt-6 pb-2">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">{t('sidebar.history')}</p>
                        <div className="space-y-1">
                            {conversations.map(conv => (
                                <div key={conv.id} className="group relative flex items-center">
                                    <Link 
                                        to={`/chat/general?c=${conv.id}`}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-full truncate pr-8"
                                        title={conv.title}
                                    >
                                        <MessageSquare size={16} className="shrink-0" />
                                        <span className="truncate">{conv.title}</span>
                                    </Link>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteConversation(conv.id);
                                        }}
                                        className="absolute right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 shrink-0">
                <Link to="/preferences" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Settings size={18} />
                    {t('sidebar.preferences')}
                </Link>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    <LogOut size={18} />
                    {t('sidebar.logout')}
                </button>
            </div>
        </div>
    );
}
