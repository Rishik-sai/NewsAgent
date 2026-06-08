import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { User as UserIcon, Settings as SettingsIcon, Moon, Bell, Shield, Loader2, Save, Mail, X } from 'lucide-react';

type Tab = 'account' | 'preferences' | 'appearance' | 'notifications' | 'security';

export function Preferences() {
  const { user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [digestDraft, setDigestDraft] = useState<string | null>(null);

  // Account State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');

  // Preferences State
  const [preferences, setPreferences] = useState('');
  const [languages, setLanguages] = useState('');

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Notifications State
  const [emailOptIn, setEmailOptIn] = useState(true);

  // Appearance State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setDob(user.dob || '');
      setPreferences(user.preferences || '');
      if (user?.languages) setLanguages(user.languages);
      setEmailOptIn(user.email_opt_in);
    }
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('system');
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setStatusMsg('Please fill in both password fields.');
      return;
    }
    setIsSaving(true);
    setStatusMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${baseUrl}/api/auth/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      if (res.ok) {
        setStatusMsg('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
        setStatusMsg(data.detail || 'Failed to update password.');
      }
    } catch (err) {
      setStatusMsg('Network error.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${baseUrl}/api/auth/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, dob })
      });
      if (res.ok) {
        const updated = await res.json();
        updateUser(updated);
        setStatusMsg('Profile updated successfully!');
      } else {
        setStatusMsg('Failed to update profile.');
      }
    } catch (err) {
      setStatusMsg('Network error.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${baseUrl}/api/auth/me/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences, languages, email_opt_in: emailOptIn })
      });
      if (res.ok) {
        const updated = await res.json();
        updateUser(updated);
        setStatusMsg('Preferences saved successfully!');
      } else {
        setStatusMsg('Failed to save preferences.');
      }
    } catch (err) {
      setStatusMsg('Network error.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleSendDigest = async () => {
    setIsGenerating(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${baseUrl}/api/insights/send-digest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDigestDraft(data.draft_html);
      } else {
        setStatusMsg('Failed to generate digest.');
      }
    } catch (err) {
      setStatusMsg('Network error while generating digest.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const tabs = [
    { id: 'account', label: t('prefs.account'), icon: UserIcon },
    { id: 'preferences', label: t('prefs.newsPrefs'), icon: SettingsIcon },
    { id: 'appearance', label: t('prefs.appearance'), icon: Moon },
    { id: 'notifications', label: t('prefs.notifications'), icon: Bell },
    { id: 'security', label: t('prefs.security'), icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 h-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('prefs.title')}</h2>
        <p className="text-slate-500 mt-1">{t('prefs.desc')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-agentBlue text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
          
          {/* Status Message Toast */}
          {statusMsg && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              statusMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }`}>
              {statusMsg}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Account Profile</h3>
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('prefs.email')}</label>
                  <input type="email" value={user?.email || ''} disabled className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('prefs.firstName')}</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-agentBlue focus:ring-1 focus:ring-agentBlue" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('prefs.lastName')}</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-agentBlue focus:ring-1 focus:ring-agentBlue" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('prefs.dob')}</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-agentBlue focus:ring-1 focus:ring-agentBlue [&::-webkit-calendar-picker-indicator]:dark:invert" />
                </div>
                <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 w-full mt-4 bg-agentBlue text-white font-medium py-2.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {t('prefs.saveProfile')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">News Preferences</h3>
              <form onSubmit={handleSavePreferences} className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('prefs.topics')}</label>
                  <p className="text-xs text-slate-500 mb-3">{t('prefs.topicsDesc')}</p>
                  <textarea 
                    value={preferences} 
                    onChange={e => setPreferences(e.target.value)}
                    rows={4}
                    placeholder="e.g. Technology, AI, Startups, Politics, Global Markets"
                    className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-agentBlue focus:ring-1 focus:ring-agentBlue resize-none"
                  />
                </div>
                <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 bg-agentBlue text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {t('prefs.savePrefs')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Appearance</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{t('prefs.theme')}</h4>
                  <div className="grid grid-cols-3 gap-4 max-w-md">
                    {['light', 'dark', 'system'].map(themeOption => (
                      <button
                        key={themeOption}
                        onClick={() => handleThemeChange(themeOption as 'light' | 'dark' | 'system')}
                        className={`py-3 px-4 rounded-xl border-2 font-medium capitalize transition-all ${
                          theme === themeOption
                            ? 'border-agentBlue text-agentBlue bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {themeOption}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    {t('prefs.systemThemeDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Notifications</h3>
              <form onSubmit={handleSavePreferences} className="space-y-6 max-w-md">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="pt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={emailOptIn} onChange={e => setEmailOptIn(e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-agentBlue"></div>
                    </label>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t('prefs.dailyDigest')}</h4>
                    <p className="text-xs text-slate-500 mt-1">{t('prefs.dailyDigestDesc')}</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 bg-agentBlue text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {t('prefs.updateNotifs')}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSendDigest}
                    disabled={isGenerating} 
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                    Send Test Email Draft
                  </button>
                </div>
              </form>

              {/* Digest Draft Preview Modal */}
              {digestDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Mail size={18} /> Generated Email Draft Preview</h3>
                      <button onClick={() => setDigestDraft(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{__html: digestDraft}}></div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                      <button onClick={() => setDigestDraft(null)} className="px-6 py-2 bg-agentBlue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">Close Preview</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">Security</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('prefs.currentPass')}</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-agentBlue focus:ring-1 focus:ring-agentBlue" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('prefs.newPass')}</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:border-agentBlue focus:ring-1 focus:ring-agentBlue" />
                </div>
                <button type="submit" disabled={isSaving || !currentPassword || !newPassword} className="flex items-center justify-center gap-2 w-full bg-agentBlue text-white font-medium py-2.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                  {t('prefs.changePass')}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
