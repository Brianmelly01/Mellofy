import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthState {
    user: User | null;
    isOpen: boolean;
    view: 'login' | 'signup';

    onOpen: (view?: 'login' | 'signup') => void;
    onClose: () => void;
    setUser: (user: User | null) => void;
    setView: (view: 'login' | 'signup') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isOpen: false,
    view: 'login',

    onOpen: (view = 'login') => set({ isOpen: true, view }),
    onClose: () => set({ isOpen: false }),
    setUser: (user) => set({ user }),
    setView: (view) => set({ view }),
}));
