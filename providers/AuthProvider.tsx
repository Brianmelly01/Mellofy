"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';

interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: () => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Real implementation would check localStorage or a token here
        // const token = localStorage.getItem('auth_token');
        // if (token) setIsAuthenticated(true);
    }, []);

    const login = () => {
        setIsAuthenticated(true);
        // localStorage.setItem('auth_token', 'dummy_token');
    };

    const logout = () => {
        setIsAuthenticated(false);
        // localStorage.removeItem('auth_token');
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {/* If not authenticated, only show the AuthGuard.
          If authenticated, show the rest of the app. */}
            {!isAuthenticated ? (
                <AuthGuard onLoginSuccess={login} />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
