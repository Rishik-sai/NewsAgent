import { Link } from 'react-router-dom';
import { Briefcase, Trophy, Globe, Code } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export function AgentHub() {
    const { t } = useTranslation();

    const agents = [
        { id: 'general', nameKey: 'agentHub.generalTitle' as const, icon: Globe, color: 'from-blue-400 to-indigo-500', bgGlow: 'hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)]', descKey: 'agentHub.generalDesc' as const },
        { id: 'tech', nameKey: 'agentHub.techTitle' as const, icon: Code, color: 'from-purple-400 to-violet-500', bgGlow: 'hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.5)]', descKey: 'agentHub.techDesc' as const },
        { id: 'finance', nameKey: 'agentHub.financeTitle' as const, icon: Briefcase, color: 'from-emerald-400 to-teal-500', bgGlow: 'hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)]', descKey: 'agentHub.financeDesc' as const },
        { id: 'sports', nameKey: 'agentHub.sportsTitle' as const, icon: Trophy, color: 'from-orange-400 to-rose-500', bgGlow: 'hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.5)]', descKey: 'agentHub.sportsDesc' as const },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto h-full flex flex-col relative z-20">
            <div className="mb-12 text-center mt-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-[60px] pointer-events-none"></div>
                <h1 className="text-5xl font-extrabold mb-4 text-slate-900 dark:text-white tracking-tight">{t('agentHub.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">{t('agentHub.subtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {agents.map(agent => (
                    <Link 
                        key={agent.id} 
                        to={`/chat/${agent.id}`}
                        className={`group relative glass-panel-light dark:!bg-slate-900/40 rounded-3xl p-8 border border-white/60 dark:border-slate-700/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden block ${agent.bgGlow}`}
                    >
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${agent.color} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg`}>
                            <agent.icon className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-500 dark:group-hover:from-white dark:group-hover:to-slate-300 transition-all">{t(agent.nameKey)}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{t(agent.descKey)}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
