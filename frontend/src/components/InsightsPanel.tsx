import { useState, useEffect } from 'react';
import { TrendingUp, Activity, MessageSquare, Bookmark, Zap, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation, normalizeLanguageCode } from '../hooks/useTranslation';

interface TrendTopic {
    tag: string;
    label: string;
}

interface ActivityStats {
    convs_today: number;
    convs_total: number;
    saved_today: number;
    saved_week: number;
    saved_total: number;
    messages_today: number;
    member_since: string;
    recent_conversations: { id: number; title: string; updated_at: string }[];
}

const GRADIENT_CLASSES = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
];

function StatCard({ icon: Icon, value, label, colorClass }: { icon: any; value: number | string; label: string; colorClass: string }) {
    return (
        <div className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-br ${colorClass} shadow-lg`}>
            <div className="absolute -right-2 -top-2 opacity-20">
                <Icon size={40} />
            </div>
            <div className="text-white/70 mb-1">
                <Icon size={14} />
            </div>
            <div className="text-2xl font-bold text-white leading-tight">{value}</div>
            <div className="text-xs text-white/80 mt-0.5">{label}</div>
        </div>
    );
}

export function InsightsPanel() {
    const { user, token } = useAuth();
    const { t } = useTranslation();
    const [trends, setTrends] = useState<TrendTopic[]>([]);
    const [activity, setActivity] = useState<ActivityStats | null>(null);
    const [loadingTrends, setLoadingTrends] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const navigate = useNavigate();

    const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        const contentLang = normalizeLanguageCode(user?.languages || 'en');
        // Fetch trending topics
        fetch(`${baseUrl}/api/insights/trending?lang=${contentLang}`)
            .then(r => r.json())
            .then(data => {
                setTrends(data.topics || []);
                setLoadingTrends(false);
            })
            .catch(() => setLoadingTrends(false));

        // Fetch activity (auth required)
        if (token) {
            fetch(`${baseUrl}/api/insights/activity`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => {
                    setActivity(data);
                    setLoadingActivity(false);
                })
                .catch(() => setLoadingActivity(false));
        } else {
            setLoadingActivity(false);
        }
    }, [user, token]);

    return (
        <div className="w-[240px] h-full bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl border-l border-slate-200/50 dark:border-white/5 flex flex-col overflow-y-auto custom-scrollbar relative z-20 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-transparent px-4 pt-5 pb-3 border-b border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <Zap size={14} className="text-white" />
                    </div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t('insights.live')}</span>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6">
                {/* Trending Section */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={13} className="text-rose-500" />
                        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('insights.trending')}</h2>
                    </div>

                    {loadingTrends ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {trends.map((topic, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(`/chat/general?q=${encodeURIComponent(topic.label + ' news today')}`)}
                                    className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all group border bg-white/50 dark:bg-slate-800/50 border-transparent hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md hover:shadow-violet-500/10 hover:bg-violet-50/80 dark:hover:bg-violet-900/30 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-xs ${GRADIENT_CLASSES[idx % GRADIENT_CLASSES.length].split(' ')[0].replace('from-', 'text-')}`}>
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                {topic.tag}
                                            </div>
                                            <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate">{topic.label}</div>
                                        </div>
                                        <svg className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* Activity Section */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Activity size={13} className="text-emerald-500" />
                        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('insights.activity')}</h2>
                    </div>

                    {loadingActivity ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : activity ? (
                        <>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <StatCard icon={MessageSquare} value={activity.convs_today} label={t('insights.chatsToday')} colorClass="from-blue-500 to-indigo-600" />
                                <StatCard icon={Bookmark} value={activity.saved_today} label={t('insights.savedToday')} colorClass="from-emerald-500 to-teal-600" />
                                <StatCard icon={Zap} value={activity.messages_today} label={t('insights.queriesToday')} colorClass="from-violet-500 to-purple-600" />
                                <StatCard icon={Activity} value={activity.saved_total} label={t('insights.totalSaved')} colorClass="from-orange-500 to-rose-500" />
                            </div>

                            {/* Recent Conversations */}
                            {activity.recent_conversations.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Clock size={12} className="text-slate-400" />
                                        <span className="text-xs text-slate-400 font-medium">{t('insights.recentChats')}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {activity.recent_conversations.map(conv => (
                                            <Link
                                                key={conv.id}
                                                to={`/chat/general?c=${conv.id}`}
                                                className="block px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{conv.title}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Member since */}
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                                <span className="text-xs text-slate-400">{t('insights.memberSince')} {activity.member_since}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-slate-400 text-center py-4">{t('insights.loginPrompt')}</p>
                    )}
                </section>
            </div>
        </div>
    );
}
