import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import type { ViewName, UserRole } from './types';
import {
  authApi, sessionsApi, getToken, setToken, clearToken,
  ApiError, type ApiUser, type ApiSession,
} from './api';

interface AppState {
  view: ViewName;
  role: UserRole | null;
  isAuthed: boolean;
  currentUser: ApiUser | null;
  selectedSeniorId: string | null;
  selectedSessionId: string | null;
  savedSeniorIds: string[];
  sessions: ApiSession[];
  authError: string | null;
  authLoading: boolean;
  sessionsLoading: boolean;
  navigate: (view: ViewName) => void;
  setRole: (role: UserRole) => void;
  login: (email?: string, password?: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: UserRole; company?: string; university?: string; year?: string }) => Promise<void>;
  logout: () => void;
  selectSenior: (id: string) => void;
  selectSession: (id: string) => void;
  toggleSaveSenior: (id: string) => void;
  addSession: (session: ApiSession) => void;
  refreshSessions: () => Promise<void>;
  markSessionFeedback: (id: string) => void;
  cancelSession: (id: string) => Promise<void>;
  clearAuthError: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewName>('landing');
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [savedSeniorIds, setSavedSeniorIds] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Re-hydrate from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem('sc_user');
    if (token && stored) {
      try {
        const user: ApiUser = JSON.parse(stored);
        setCurrentUser(user);
        setRoleState(user.role);
        setIsAuthed(true);
        setView('dashboard');
      } catch {
        clearToken();
        localStorage.removeItem('sc_user');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthed) refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const navigate = (next: ViewName) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setRole = (r: UserRole) => setRoleState(r);
  const clearAuthError = () => setAuthError(null);

  const login = async (email?: string, password?: string) => {
    // If no parameters provided, this is a simple login for demo purposes (landing page)
    if (!email || !password) {
      // For landing page demo, just mark as authed without actual API call
      // This allows the "View all" button to work without credentials
      const demoUser: ApiUser = {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'junior',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo&backgroundColor=f59e0b&textColor=ffffff',
        credibilityScore: 70,
      };
      setCurrentUser(demoUser);
      setRoleState(demoUser.role);
      setIsAuthed(true);
      navigate('dashboard');
      return;
    }

    // Normal login with credentials
    setAuthLoading(true); setAuthError(null);
    try {
      const { token, user } = await authApi.login({ email, password });
      setToken(token);
      localStorage.setItem('sc_user', JSON.stringify(user));
      setCurrentUser(user); setRoleState(user.role); setIsAuthed(true);
      navigate('dashboard');
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Login failed');
    } finally { setAuthLoading(false); }
  };

  const signup = async (data: { name: string; email: string; password: string; role: UserRole; company?: string; university?: string; year?: string }) => {
    setAuthLoading(true); setAuthError(null);
    try {
      const { token, user } = await authApi.signup(data);
      setToken(token);
      localStorage.setItem('sc_user', JSON.stringify(user));
      setCurrentUser(user); setRoleState(user.role); setIsAuthed(true);
      navigate('dashboard');
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Signup failed');
    } finally { setAuthLoading(false); }
  };

  const logout = () => {
    clearToken(); localStorage.removeItem('sc_user');
    setIsAuthed(false); setCurrentUser(null); setRoleState(null);
    setSessions([]); navigate('landing');
  };

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true);
    try { setSessions(await sessionsApi.list()); }
    catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }, []);

  const addSession = (session: ApiSession) => {
    setSessions(prev => {
      // Replace if exists, otherwise add
      const existingIndex = prev.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = session;
        return updated;
      }
      return [session, ...prev];
    });
  };

  const markSessionFeedback = (id: string) =>
    setSessions(prev => prev.map(s => s.id === id ? { ...s, hasFeedback: true } : s));

  const cancelSession = async (id: string) => {
    try {
      const updated = await sessionsApi.updateStatus(id, 'cancelled');
      setSessions(prev => prev.map(s => s.id === id ? updated : s));
    } catch {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' as const } : s));
    }
  };

  const selectSenior = (id: string) => { setSelectedSeniorId(id); navigate('senior-profile'); };
  const selectSession = (id: string) => { setSelectedSessionId(id); navigate('session'); };
  const toggleSaveSenior = (id: string) =>
    setSavedSeniorIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  return (
    <AppContext.Provider value={{
      view, role, isAuthed, currentUser, selectedSeniorId, selectedSessionId,
      savedSeniorIds, sessions, authError, authLoading, sessionsLoading,
      navigate, setRole, login, signup, logout, selectSenior, selectSession,
      toggleSaveSenior, addSession, refreshSessions, markSessionFeedback,
      cancelSession, clearAuthError,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useCurrentUser() {
  return useApp().currentUser;
}

// Legacy shim – ProfilePage/DashboardPage import this but now use currentUser
export const juniorProfile = null;
