import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";
import { User } from "@/app/types";

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        if (!res.data.success) {
          throw new Error(res.data.message || "Invalid credentials");
        }
        const token = res.data.token || res.data.accessToken || res.data.access_token;
        localStorage.setItem("token", token);


        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        set({
          token,
          user: res.data.user,
        });
      },

      logout: () => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        set({ user: null, token: null });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
