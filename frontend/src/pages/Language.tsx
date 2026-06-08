import { useState, useEffect, useMemo } from 'react';
import { Globe, Check, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LangOption {
    code: string;
    name: string;
    native: string;
    flag: string;
    region: string;
}

const ALL_LANGUAGES: LangOption[] = [
    // Indian Languages
    { code: 'en-in', name: 'English', native: 'English', flag: '🇮🇳', region: 'Indian' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'Indian' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', region: 'Indian' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', region: 'Indian' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', region: 'Indian' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', region: 'Indian' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', region: 'Indian' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'Indian' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', region: 'Indian' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'Indian' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳', region: 'Indian' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳', region: 'Indian' },
    { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇮🇳', region: 'Indian' },
    // International Languages
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', region: 'International' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'International' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', region: 'International' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', region: 'International' },
    { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', region: 'International' },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', region: 'International' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', region: 'International' },
    { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', region: 'International' },
    { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', region: 'International' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', region: 'International' },
];

const REGIONS = ['Indian', 'International'];

export function Language() {
    const { user, token, updateUser } = useAuth();
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [statusMsg, setStatusMsg] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.languages) {
            // "es, en" -> ["es", "en"]
            const langs = user.languages.split(',').map(l => l.trim()).filter(Boolean);
            if (langs.length > 0) {
                setSelectedLanguages(langs);
            } else {
                setSelectedLanguages(['en-in']);
            }
        } else {
            // fallback
            setSelectedLanguages(['en-in']);
        }
    }, [user?.languages]);

    const toggleLanguage = async (code: string) => {
        const newSelection = [code];
        setSelectedLanguages(newSelection);
        
        // Auto-save immediately
        setSaving(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${baseUrl}/api/auth/me/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    preferences: user?.preferences || '',
                    languages: newSelection.join(', '),
                    email_opt_in: user?.email_opt_in ?? true
                })
            });
            if (res.ok) {
                const updated = await res.json();
                updateUser(updated);
                setStatusMsg('Language updated!');
            }
        } catch (e) {
            setStatusMsg('Network error.');
        } finally {
            setSaving(false);
            setTimeout(() => setStatusMsg(''), 3000);
        }
    };



    const filteredLanguages = useMemo(() => {
        if (!searchQuery.trim()) return ALL_LANGUAGES;
        const q = searchQuery.toLowerCase();
        return ALL_LANGUAGES.filter(l =>
            l.name.toLowerCase().includes(q) ||
            l.native.toLowerCase().includes(q) ||
            l.code.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const groupedByRegion = useMemo(() => {
        const groups: Record<string, LangOption[]> = {};
        for (const region of REGIONS) {
            const items = filteredLanguages.filter(l => l.region === region);
            if (items.length > 0) groups[region] = items;
        }
        return groups;
    }, [filteredLanguages]);

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Globe size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        Language Settings
                    </h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">
                    Choose your preferred languages for news summaries. The AI will generate content directly in your selected language.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search languages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all placeholder:text-slate-400"
                />
            </div>

            {/* Active Selection Summary */}
            {selectedLanguages.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border border-violet-500/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-violet-500" />
                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Active Language</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedLanguages.map(code => {
                            const lang = ALL_LANGUAGES.find(l => l.code === code);
                            return lang ? (
                                <button
                                    key={code}
                                    onClick={() => toggleLanguage(code)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-medium hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.name}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">✕</span>
                                </button>
                            ) : null;
                        })}
                    </div>
                </div>
            )}

            {/* Language Groups */}
            <div className="space-y-8 mb-8">
                {Object.entries(groupedByRegion).map(([region, langs]) => (
                    <div key={region}>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">
                            {region === 'Indian' ? '🇮🇳 Indian Languages' : '🌍 International Languages'}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {langs.map(lang => {
                                const isSelected = selectedLanguages.includes(lang.code);
                                return (
                                    <button
                                        key={lang.code}
                                        onClick={() => toggleLanguage(lang.code)}
                                        className={`
                                            relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left group
                                            ${isSelected
                                                ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10 shadow-md shadow-violet-500/10'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        {/* Checkmark */}
                                        <div className={`
                                            absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200
                                            ${isSelected
                                                ? 'bg-violet-500 scale-100'
                                                : 'bg-slate-200 dark:bg-slate-700 scale-90 group-hover:scale-100'
                                            }
                                        `}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>

                                        {/* Flag */}
                                        <span className="text-2xl mb-2">{lang.flag}</span>

                                        {/* Name */}
                                        <span className={`text-sm font-semibold mb-0.5 ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {lang.name}
                                        </span>

                                        {/* Native Name */}
                                        <span className="text-xs text-slate-400 dark:text-slate-500">
                                            {lang.native}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedByRegion).length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Globe size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No languages match your search.</p>
                    </div>
                )}
            </div>

            <div className="sticky bottom-6 flex items-center justify-end p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
                <div className="flex items-center gap-3">
                    {statusMsg && (
                        <span className="text-sm text-emerald-500 font-medium flex items-center gap-1.5 animate-[fadeIn_0.3s_ease-out]">
                            <Check size={14} />
                            {statusMsg}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
