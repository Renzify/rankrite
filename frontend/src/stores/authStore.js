import { create } from "zustand";
import {
  checkAuth as checkAuthRequest,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
} from "../api/authApi";

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: false,
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingOut: false,

  setAuthUser: (authUser) => set({ authUser }),

  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const authUser = await checkAuthRequest();
      set({ authUser });
      return authUser;
    } catch {
      set({ authUser: null });
      return null;
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (payload) => {
    set({ isSigningUp: true });

    try {
      return await signupRequest(payload);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (payload) => {
    set({ isLoggingIn: true });

    try {
      const authUser = await loginRequest(payload);
      set({ authUser });
      return authUser;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    set({ isLoggingOut: true });

    try {
      await logoutRequest();
      set({ authUser: null });
    } finally {
      set({ isLoggingOut: false });
    }
  },
}));
