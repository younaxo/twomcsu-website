'use client';

import type { ChatMessage, ChatOnlineUser } from '@twomc/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatSettings {
  showWidget: boolean;
  soundEnabled: boolean;
  notifyOnMention: boolean;
  showTyping: boolean;
}

interface ChatState {
  isWidgetOpen: boolean;
  currentChannelSlug: string | null;
  unreadCounts: Record<string, number>;
  messagesByChannel: Record<string, ChatMessage[]>;
  onlineByChannel: Record<string, ChatOnlineUser[]>;
  typingByChannel: Record<string, string[]>;
  settings: ChatSettings;
  setWidgetOpen: (open: boolean) => void;
  toggleWidget: () => void;
  setCurrentChannel: (slug: string | null) => void;
  setMessages: (channelId: string, messages: ChatMessage[]) => void;
  prependMessages: (channelId: string, messages: ChatMessage[]) => void;
  appendMessage: (channelId: string, message: ChatMessage) => void;
  updateMessage: (channelId: string, message: ChatMessage) => void;
  setOnline: (channelId: string, users: ChatOnlineUser[]) => void;
  setTyping: (channelId: string, usernames: string[]) => void;
  incrementUnread: (slug: string) => void;
  clearUnread: (slug: string) => void;
  updateSettings: (partial: Partial<ChatSettings>) => void;
}

const defaultSettings: ChatSettings = {
  showWidget: true,
  soundEnabled: false,
  notifyOnMention: true,
  showTyping: true,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      isWidgetOpen: false,
      currentChannelSlug: null,
      unreadCounts: {},
      messagesByChannel: {},
      onlineByChannel: {},
      typingByChannel: {},
      settings: defaultSettings,
      setWidgetOpen: (open) => set({ isWidgetOpen: open }),
      toggleWidget: () => set({ isWidgetOpen: !get().isWidgetOpen }),
      setCurrentChannel: (slug) => set({ currentChannelSlug: slug }),
      setMessages: (channelId, messages) =>
        set((s) => ({
          messagesByChannel: { ...s.messagesByChannel, [channelId]: messages },
        })),
      prependMessages: (channelId, messages) =>
        set((s) => {
          const existing = s.messagesByChannel[channelId] ?? [];
          const ids = new Set(existing.map((m) => m.id));
          const unique = messages.filter((m) => !ids.has(m.id));
          return {
            messagesByChannel: {
              ...s.messagesByChannel,
              [channelId]: [...unique, ...existing],
            },
          };
        }),
      appendMessage: (channelId, message) =>
        set((s) => {
          const existing = s.messagesByChannel[channelId] ?? [];
          if (existing.some((m) => m.id === message.id)) {
            return {
              messagesByChannel: {
                ...s.messagesByChannel,
                [channelId]: existing.map((m) => (m.id === message.id ? message : m)),
              },
            };
          }
          return {
            messagesByChannel: {
              ...s.messagesByChannel,
              [channelId]: [...existing, message],
            },
          };
        }),
      updateMessage: (channelId, message) =>
        set((s) => ({
          messagesByChannel: {
            ...s.messagesByChannel,
            [channelId]: (s.messagesByChannel[channelId] ?? []).map((m) =>
              m.id === message.id ? message : m,
            ),
          },
        })),
      setOnline: (channelId, users) =>
        set((s) => ({
          onlineByChannel: { ...s.onlineByChannel, [channelId]: users },
        })),
      setTyping: (channelId, usernames) =>
        set((s) => ({
          typingByChannel: { ...s.typingByChannel, [channelId]: usernames },
        })),
      incrementUnread: (slug) =>
        set((s) => ({
          unreadCounts: {
            ...s.unreadCounts,
            [slug]: (s.unreadCounts[slug] ?? 0) + 1,
          },
        })),
      clearUnread: (slug) =>
        set((s) => ({
          unreadCounts: { ...s.unreadCounts, [slug]: 0 },
        })),
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    {
      name: 'twomc.chat',
      partialize: (s) => ({
        settings: s.settings,
        currentChannelSlug: s.currentChannelSlug,
      }),
    },
  ),
);
