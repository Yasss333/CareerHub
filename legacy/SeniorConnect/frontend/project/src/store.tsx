import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ViewName, UserRole, Session } from './types';
import { juniorProfile, sessions as initialSessions, savedSeniorIds as initialSaved } from './mockData';

interface AppState {
  view: ViewName;
  role: UserRole | null;
  isAuthed: boolean;
  selectedSeniorId: string | null;
  selectedSessionId: string | null;
  savedSeniorIds: string[];
  sessions: Session[];
  navigate: (view: ViewName) => void;
  setRole: (role: UserRole) => void;
  login: () => void;
  logout: () => void;
  selectSenior: (id: string) => void;
  selectSession: (id: string) => void;
  toggleSaveSenior: (id: string) => void;
  addSession: (session: Session) => void;
  markSessionFeedback: (id: string) => void;
  cancelSession: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewName>('landing');
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [savedSeniorIds, setSavedSeniorIds] = useState<string[]>(initialSaved);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);

  const navigate = (next: ViewName) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = () => {
    setIsAuthed(true);
    setView('dashboard');
  };

  const logout = () => {
    setIsAuthed(false);
    setRole(null);
    setView('landing');
  };

  const selectSenior = (id: string) => {
    setSelectedSeniorId(id);
    navigate('senior-profile');
  };

  const selectSession = (id: string) => {
    setSelectedSessionId(id);
    navigate('session');
  };

  const toggleSaveSenior = (id: string) => {
    setSavedSeniorIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const addSession = (session: Session) => {
    setSessions((prev) => [session, ...prev]);
  };

  const markSessionFeedback = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, hasFeedback: true } : s))
    );
  };

  const cancelSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    );
  };

  return (
    <AppContext.Provider
      value={{
        view,
        role,
        isAuthed,
        selectedSeniorId,
        selectedSessionId,
        savedSeniorIds,
        sessions,
        navigate,
        setRole,
        login,
        logout,
        selectSenior,
        selectSession,
        toggleSaveSenior,
        addSession,
        markSessionFeedback,
        cancelSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { juniorProfile };
