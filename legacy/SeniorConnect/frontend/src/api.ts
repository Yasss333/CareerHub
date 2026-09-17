/**
 * Typed API client – all calls to the Express backend go through here.
 * Base URL is read from VITE_API_URL (defaults to '' which uses the Vite proxy).
 * In production, VITE_API_URL should be set to the backend URL.
 */

const BASE = import.meta.env.VITE_API_URL ?? '';

// ── Token helpers ─────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('sc_token');
}
export function setToken(t: string) {
  localStorage.setItem('sc_token', t);
}
export function clearToken() {
  localStorage.removeItem('sc_token');
}

// ── Core fetch wrapper ────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? 'Request failed', body.errors);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: { msg: string; path: string }[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthPayload { token: string; user: ApiUser; }

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: 'junior' | 'senior';
  avatar: string;
  credibilityScore: number;
  badges: string[];
  university?: string;
  year?: string;
  interests?: string[];
  goals?: { title: string; progress: number }[];
  title?: string;
  company?: string;
  location?: string;
}

export const authApi = {
  signup: (body: {
    name: string; email: string; password: string;
    role: 'junior' | 'senior'; company?: string;
    title?: string; university?: string; year?: string;
  }) => request<AuthPayload>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Seniors ───────────────────────────────────────────────────
export interface ApiSenior {
  id: string; name: string; avatar: string; credibilityScore: number;
  badges: string[]; title: string; company: string; domain: string;
  role: string; bio: string; experience: number; location: string;
  expertise: string[]; achievements: string[]; rating: number;
  reviewCount: number; sessionCount: number;
  availability: 'available' | 'limited' | 'booked';
  slots: { id: string; date: string; time: string; available: boolean }[];
  reviews?: ApiReview[];
}

export interface ApiReview {
  id: string; seniorId: string; juniorName: string;
  juniorAvatar: string; rating: number; date: string; comment: string;
}

export const seniorsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<ApiSenior[]>(`/seniors${qs}`);
  },
  get: (id: string) => request<ApiSenior>(`/seniors/${id}`),
};

// ── Sessions ──────────────────────────────────────────────────
export interface ApiSession {
  id: string; seniorId: string; seniorName: string; seniorAvatar: string;
  juniorName: string; date: string; time: string; duration: number;
  topic: string; notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'upcoming' | 'completed' | 'cancelled' | 'started';
  meetingLink: string; jitsiRoomName?: string; hasFeedback: boolean;
  feedback?: { rating: number; comment: string; tags: string[]; submittedAt: string } | null;
}

export const sessionsApi = {
  list: () => request<ApiSession[]>('/sessions'),
  book: (body: {
    seniorId: string; scheduledTime: string; duration: number;
    topic: string; notes?: string; availabilitySlotId?: string;
  }) => request<ApiSession>('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: string) =>
    request<ApiSession>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  submitFeedback: (id: string, body: { rating: number; comment: string; tags?: string[] }) =>
    request<{ message: string; feedback: object }>(`/sessions/${id}/feedback`, {
      method: 'POST', body: JSON.stringify(body),
    }),
};

// ── Availability ──────────────────────────────────────────────
export interface ApiSlot {
  id: string; date: string; time: string;
  available: boolean; startTime?: string; endTime?: string;
}

export const availabilityApi = {
  getBySenior: (seniorId: string) => request<ApiSlot[]>(`/availability/${seniorId}`),
  addSlots: (slots: { startTime: string; endTime: string }[]) =>
    request<ApiSlot[]>('/availability', { method: 'POST', body: JSON.stringify({ slots }) }),
  deleteSlot: (slotId: string) =>
    request<{ message: string }>(`/availability/${slotId}`, { method: 'DELETE' }),
};

// ── Profile ───────────────────────────────────────────────────
export interface ApiProfile {
  user: ApiUser;
  profile: {
    title?: string; company?: string; domain?: string; role?: string;
    bio?: string; experience?: number; location?: string;
    expertise?: string[]; achievements?: string[];
    availability?: string; rating?: number; reviewCount?: number; sessionCount?: number;
  } | null;
}

export const profileApi = {
  get: () => request<ApiProfile>('/profile'),
  update: (body: Partial<ApiUser> & Record<string, unknown>) =>
    request<ApiProfile>('/profile', { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Credibility ───────────────────────────────────────────────
export interface ApiCredibility {
  userId: string; sessionsAttended: number; feedbackScore: number;
  consistencyScore: number; profileCompleteness: number;
  computedScore: number; badge: string;
}

export const credibilityApi = {
  getMine: () => request<ApiCredibility>('/credibility'),
  getByUser: (userId: string) => request<ApiCredibility>(`/credibility/${userId}`),
};
