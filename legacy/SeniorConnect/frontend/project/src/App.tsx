import { AppProvider, useApp } from '@/store';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage, SignupPage } from '@/pages/AuthPages';
import { DashboardPage } from '@/pages/DashboardPage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { SeniorProfilePage } from '@/pages/SeniorProfilePage';
import { BookingPage } from '@/pages/BookingPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { SessionPage } from '@/pages/SessionPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { ProfilePage } from '@/pages/ProfilePage';

function Router() {
  const { view, isAuthed } = useApp();

  // Public views (no auth needed)
  if (view === 'landing') return <LandingPage />;
  if (view === 'login') return <LoginPage />;
  if (view === 'signup') return <SignupPage />;

  // Authed views — wrap in Layout
  if (!isAuthed) {
    return <LoginPage />;
  }

  let page: React.ReactNode;
  switch (view) {
    case 'dashboard': page = <DashboardPage />; break;
    case 'discover': page = <DiscoverPage />; break;
    case 'senior-profile': page = <SeniorProfilePage />; break;
    case 'booking': page = <BookingPage />; break;
    case 'bookings': page = <BookingsPage />; break;
    case 'session': page = <SessionPage />; break;
    case 'feedback': page = <FeedbackPage />; break;
    case 'profile': page = <ProfilePage />; break;
    default: page = <DashboardPage />;
  }

  return <Layout>{page}</Layout>;
}

function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}

export default App;
