import type { LoginResponse, PublicUser, RegisterResponse } from '@twomc/shared';
import { create } from 'zustand';
import {
  api,
  refreshAccessToken,
  setApiAccessToken,
  setSessionLostHandler,
  setTokenRefreshedHandler,
} from '@/lib/api';

interface LoginResult {
  requiresCaptcha: boolean;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  captchaToken: string;
  promoCode?: string;
}

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string, captchaToken?: string) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<RegisterResponse['promoCode']>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  setAccessToken: (token) => {
    setApiAccessToken(token);
    set({ accessToken: token });
  },

  login: async (emailOrUsername, password, captchaToken) => {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      emailOrUsername,
      password,
      captchaToken,
    });

    if ('requiresCaptcha' in data) {
      return { requiresCaptcha: true };
    }

    get().setAccessToken(data.accessToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });

    return { requiresCaptcha: false };
  },

  // no session is kept here, the user signs in right after registration
  register: async (input) => {
    const { data } = await api.post<RegisterResponse>('/auth/register', input);

    return data.promoCode;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      get().setAccessToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  refresh: async () => {
    try {
      get().setAccessToken(await refreshAccessToken());

      return true;
    } catch {
      get().setAccessToken(null);
      set({ user: null, isAuthenticated: false });

      return false;
    }
  },

  fetchMe: async () => {
    set({ isLoading: true });

    try {
      const { data } = await api.get<PublicUser>('/auth/me', { skipAuthRedirect: true });
      set({ user: data, isAuthenticated: true });
    } catch {
      get().setAccessToken(null);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));

setTokenRefreshedHandler((token) => useAuthStore.setState({ accessToken: token }));

setSessionLostHandler(() => {
  setApiAccessToken(null);
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
});
