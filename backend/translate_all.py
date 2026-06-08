import asyncio
import json
from agent.llm import get_llm
from langchain_core.messages import HumanMessage, SystemMessage
from pathlib import Path
import re

en_dict = {
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
    'prefs.systemThemeDesc': "System theme automatically adapts to your operating system's color scheme.",
    'prefs.dailyDigest': 'Daily Digest Emails',
    'prefs.dailyDigestDesc': 'Get a daily summary of top news based on your topics of interest.',
    'prefs.updateNotifs': 'Update Notifications',
    'prefs.currentPass': 'Current Password',
    'prefs.newPass': 'New Password',
    'prefs.changePass': 'Change Password'
}

languages_to_do = [
    ('en-in', 'English (Indian context)')
]

llm = get_llm(temperature=0)

async def translate_lang(code, name):
    print(f"Translating to {name}...")
    sys_msg = SystemMessage(content=f"You are a professional software localizer. Translate the following JSON UI dictionary into {name}. Return ONLY the JSON object with the exact same keys and no markdown block wrapping.")
    human_msg = HumanMessage(content=json.dumps(en_dict, indent=2))
    
    resp = await llm.ainvoke([sys_msg, human_msg])
    text = resp.content.strip()
    
    if text.startswith("```"):
        text = re.sub(r'^```(json)?|```$', '', text, flags=re.MULTILINE).strip()
    
    try:
        parsed = json.loads(text)
        return code, parsed
    except Exception as e:
        print(f"Failed parsing {name}: {e}\n{text}")
        return code, None

async def main():
    tasks = [translate_lang(c, n) for c, n in languages_to_do]
    results = await asyncio.gather(*tasks)
    
    with open('translations_temp.json', 'w', encoding='utf-8') as f:
        json.dump(dict(results), f, indent=4, ensure_ascii=False)
    
    print("Done generating translations.")

if __name__ == "__main__":
    asyncio.run(main())
