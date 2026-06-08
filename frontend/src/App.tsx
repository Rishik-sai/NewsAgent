import { Routes, Route, Navigate, useSearchParams, useParams, Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InsightsPanel } from './components/InsightsPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Preferences } from './pages/Preferences';
import { Saved } from './pages/Saved';
import { Language } from './pages/Language';
import { AgentHub } from './pages/AgentHub';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function MainLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans relative bg-slate-50 dark:bg-[#050511]">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 dark:bg-violet-600/20 blur-[120px] pointer-events-none"></div>
      
      <div className="hidden md:block h-full z-10"><Sidebar /></div>
      <div className="flex-1 overflow-y-auto z-10 relative"><Outlet /></div>
      <div className="hidden lg:block h-full z-10"><InsightsPanel /></div>
    </div>
  );
}

function AgentChat() {
  const { user } = useAuth();
  const { agentType } = useParams<{ agentType: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get('c');
  const initialQuery = searchParams.get('q');
  
  // Pass user email as clientId if available
  const clientId = user ? user.email : Math.random().toString(36).substring(7);
  const { messages, status, sendMessage, conversationId: activeConversationId } = useWebSocket(clientId, conversationId, agentType || 'general');

  // Auto-send the query from ?q= param (e.g. from clicking a trending topic)
  const sentQueryRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialQuery && status === 'connected' && sentQueryRef.current !== initialQuery) {
      sentQueryRef.current = initialQuery;
      sendMessage(initialQuery);
      // Remove q from URL to prevent re-sending on refresh
      searchParams.delete('q');
      setSearchParams(searchParams, { replace: true });
    }
  }, [initialQuery, status]);

  return (
    <ChatArea messages={messages} sendMessage={sendMessage} status={status} conversationId={activeConversationId} agentType={agentType || 'general'} />
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<AgentHub />} />
        <Route path="/chat/:agentType" element={<AgentChat />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/language" element={<Language />} />
      </Route>
    </Routes>
  );
}

export default App;
