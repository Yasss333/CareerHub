export type UserRole = 'junior' | 'senior';

export type ViewName =
  | 'landing'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'discover'
  | 'senior-profile'
  | 'booking'
  | 'bookings'
  | 'session'
  | 'feedback'
  | 'profile';

export interface Senior {
  id: string;
  name: string;
  title: string;
  company: string;
  domain: string;
  expertise: string[];
  role: string;
  bio: string;
  experience: number;
  credibilityScore: number;
  rating: number;
  reviewCount: number;
  sessionCount: number;
  availability: 'available' | 'limited' | 'booked';
  avatar: string;
  location: string;
  slots: Slot[];
  achievements: string[];
}

export interface Slot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface Session {
  id: string;
  seniorId: string;
  seniorName: string;
  seniorAvatar: string;
  juniorName: string;
  date: string;
  time: string;
  duration: number;
  topic: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'accepted' | 'rejected' | 'started';
  meetingLink: string;
  notes?: string;
  hasFeedback?: boolean;
}

export interface Review {
  id: string;
  seniorId: string;
  juniorName: string;
  juniorAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface JuniorProfile {
  name: string;
  title: string;
  email: string;
  avatar: string;
  credibilityScore: number;
  university: string;
  year: string;
  interests: string[];
  sessionsCompleted: number;
  seniorsSaved: number;
  goals: Goal[];
}

export interface Goal {
  id: string;
  title: string;
  progress: number;
}
