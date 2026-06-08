import { useAuth } from './useAuth';
import { translations } from '../i18n/translations';

// Helper to normalize user input (e.g., "Spanish" -> "es")
export function normalizeLanguageCode(input: string): string {
    const raw = input ? input.split(',')[0].trim().toLowerCase() : 'en';
    const langMap: Record<string, string> = {
        'spanish': 'es', 'esp': 'es', 'español': 'es', 'espanol': 'es',
        'french': 'fr', 'français': 'fr', 'francais': 'fr',
        'hindi': 'hi',
        'telugu': 'te',
        'english': 'en', 'eng': 'en',
        'bengali': 'bn',
        'marathi': 'mr',
        'tamil': 'ta',
        'gujarati': 'gu',
        'kannada': 'kn',
        'malayalam': 'ml',
        'punjabi': 'pa',
        'odia': 'or',
        'assamese': 'as',
        'urdu': 'ur',
        'german': 'de', 'deutsch': 'de',
        'portuguese': 'pt', 'português': 'pt',
        'russian': 'ru', 'русский': 'ru',
        'japanese': 'ja', '日本語': 'ja',
        'korean': 'ko', '한국어': 'ko',
        'chinese': 'zh', '中文': 'zh',
        'arabic': 'ar', 'العربية': 'ar',
        'english (indian context)': 'en-in', 'indian english': 'en-in'
    };
    return langMap[raw] || raw;
}

export function useTranslation() {
    const { user } = useAuth();
    
    // Extract primary language from user preferences and normalize
    const langRaw = normalizeLanguageCode(user?.languages || 'en');
    
    // Fallback to English if the language is not in our dictionary
    const lang = translations[langRaw] ? langRaw : 'en';

    const t = (key: string): string => {
        return translations[lang]?.[key as keyof typeof translations['en']] || translations['en']?.[key as keyof typeof translations['en']] || key;
    };

    return { t, lang };
}
