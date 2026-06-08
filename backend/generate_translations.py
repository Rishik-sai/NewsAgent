import json
import os
import sys

# Setup paths so we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agent.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage

english_dict = {
    'sidebar.agentHub': 'Agent Hub',
    'sidebar.saved': 'Saved',
    'sidebar.language': 'Language',
    'sidebar.history': 'HISTORY',
    'sidebar.preferences': 'Preferences',
    'sidebar.logout': 'Logout',
    'agentHub.title': 'Choose Your Agent',
    'agentHub.subtitle': 'Select a specialized AI assistant to get personalized news.',
    'agentHub.generalTitle': 'General News',
    'agentHub.generalDesc': 'Your everyday global news assistant for all topics.',
    'agentHub.techTitle': 'Tech Agent',
    'agentHub.techDesc': 'Deep dives into AI, startups, gadgets, and software.',
    'agentHub.financeTitle': 'Finance Agent',
    'agentHub.financeDesc': 'Market updates, stocks, and global economic trends.',
    'agentHub.sportsTitle': 'Sports Agent',
    'agentHub.sportsDesc': 'Scores, highlights, and team news from around the world.',
    'insights.live': 'Live Insights',
    'insights.trending': 'TRENDING',
    'insights.activity': 'YOUR ACTIVITY',
    'insights.chatsToday': 'Chats today',
    'insights.savedToday': 'Saved today',
    'insights.queriesToday': 'Queries',
    'insights.totalSaved': 'Total saved',
    'insights.recentChats': 'Recent Chats',
    'insights.memberSince': 'Member since',
    'insights.loginPrompt': 'Login to see your activity',
    'chat.welcome': 'Welcome to',
    'chat.askAbout': 'Hello! Ask me about the latest news, specific topics, or set up your preferences.',
    'chat.placeholder': 'Ask about today\'s news...',
    'prefs.title': 'Settings',
    'prefs.desc': 'Manage your account settings and preferences.',
    'prefs.account': 'Account',
    'prefs.newsPrefs': 'News Preferences',
    'prefs.appearance': 'Appearance',
    'prefs.notifications': 'Notifications',
    'prefs.security': 'Security',
    'prefs.email': 'Email Address',
    'prefs.firstName': 'First Name',
    'prefs.lastName': 'Last Name',
    'prefs.dob': 'Date of Birth',
    'prefs.saveProfile': 'Save Profile',
    'prefs.topics': 'Topics of Interest',
    'prefs.topicsDesc': 'Enter comma-separated topics you want the AI to prioritize.',
    'prefs.languages': 'Preferred Languages',
    'prefs.languagesDesc': 'Enter comma-separated languages for news.',
    'prefs.savePrefs': 'Save Preferences',
    'prefs.theme': 'Theme Preference',
    'prefs.systemThemeDesc': 'System theme automatically adapts to your operating system\'s color scheme.',
    'prefs.dailyDigest': 'Daily Digest Emails',
    'prefs.dailyDigestDesc': 'Receive a daily summary of top news based on your topics of interest.',
    'prefs.updateNotifs': 'Update Notifications',
    'prefs.currentPass': 'Current Password',
    'prefs.newPass': 'New Password',
    'prefs.changePass': 'Change Password'
}

languages_to_translate = {
    'en-in': 'English (Indian context)',
    'bn': 'Bengali',
    'te': 'Telugu',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'or': 'Odia',
    'as': 'Assamese',
    'ur': 'Urdu',
    'de': 'German',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'ar': 'Arabic'
}

llm = get_llm(temperature=0.1)

results = {}

for code, lang_name in languages_to_translate.items():
    print(f"Translating to {lang_name} ({code})...")
    
    prompt = f"""
    You are an expert translator. Translate the following UI dictionary from English to {lang_name}.
    Ensure the translations are natural for a web application UI. Keep the JSON keys EXACTLY the same.
    Return ONLY a valid JSON object containing the translated key-value pairs. DO NOT wrap the JSON in markdown blocks (e.g. ```json).
    """
    
    try:
        response = llm.invoke([
            SystemMessage(content=prompt),
            HumanMessage(content=json.dumps(english_dict, indent=2))
        ])
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        translated = json.loads(content)
        results[code] = translated
        print(f"Success for {code}")
    except Exception as e:
        print(f"Failed for {code}: {e}")

with open("translations_output.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=4)
print("Finished saving to translations_output.json")
