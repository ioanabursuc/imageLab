import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            user: null,
            login: (data) => {
                const { token, ...user } = data;
                set({ token, user });
            },
            logout: () => set({ token: null, user: null }),
        }),
        { name: 'auth' }
    )
);
