import type { RefreshResponse } from '@twomc/shared';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { translateError } from '@/lib/error-messages';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Set it on background calls so a dead session does not throw the visitor to /login */
    skipAuthRedirect?: boolean;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true,
});

// access token never leaves memory, the store pushes it here on every change
let accessToken: string | null = null;
let sessionLostHandler: (() => void) | null = null;
let tokenRefreshedHandler: ((token: string) => void) | null = null;
let refreshRequest: Promise<string> | null = null;

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function getApiAccessToken(): string | null {
  return accessToken;
}

export function setSessionLostHandler(handler: () => void): void {
  sessionLostHandler = handler;
}

export function setTokenRefreshedHandler(handler: (token: string) => void): void {
  tokenRefreshedHandler = handler;
}

export function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = api
      .post<RefreshResponse>('/auth/refresh')
      .then(({ data }) => {
        accessToken = data.accessToken;
        tokenRefreshedHandler?.(data.accessToken);

        return data.accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableConfig | undefined;

    if (!request || error.response?.status !== 401 || request._retry || isAuthCall(request.url)) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      const token = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;

      return await api(request);
    } catch (refreshError) {
      sessionLostHandler?.();

      if (!request.skipAuthRedirect) {
        redirectToLogin();
      }

      return Promise.reject(refreshError);
    }
  },
);

/** Login, register and refresh answer 401 on their own, retrying them makes no sense */
function isAuthCall(url?: string): boolean {
  return Boolean(url && /\/auth\/(refresh|login|register)$/.test(url));
}

function redirectToLogin(): void {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/login')) {
    return;
  }

  window.location.href = '/login';
}

export function extractErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return translateError('Network error');
    }

    const message = (error.response.data as { message?: string | string[] } | undefined)?.message;
    const first = Array.isArray(message) ? message[0] : message;

    if (typeof first === 'string' && first.length > 0) {
      return translateError(first);
    }
  }

  return fallback;
}
