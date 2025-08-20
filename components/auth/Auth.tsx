import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { supabase, Enums, Tables } from '../../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Navigate, useLocation } from 'react-router-dom';

type UserProfile = Tables<'profiles'>;
type UserRole = Enums<'user_role'>;

interface AuthUser extends User {
    role: UserRole;
}

interface AuthContextType {
    session: Session | null;
    user: AuthUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const logoutTimer = useRef<number | undefined>();

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        // The onAuthStateChange listener will handle clearing the state.
    }, []);

    const resetLogoutTimer = useCallback(() => {
        if (logoutTimer.current) {
            clearTimeout(logoutTimer.current);
        }
        logoutTimer.current = window.setTimeout(() => {
            console.log("Auto-logging out due to inactivity.");
            signOut();
        }, 10 * 60 * 1000); // 10 minutes
    }, [signOut]);

    // This effect runs once on mount to check the initial session state,
    // which is crucial for handling page refreshes.
    useEffect(() => {
        const checkInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                
                if (initialSession?.user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', initialSession.user.id)
                        .single();

                    if (error) throw error; // Let the catch block handle it.
                    
                    const authUser: AuthUser = { ...initialSession.user, role: (profile as UserProfile)?.role || 'siswa' };
                    setSession(initialSession);
                    setUser(authUser);
                } else {
                    setSession(null);
                    setUser(null);
                }
            } catch (error) {
                console.error("Failed to check initial session or fetch profile:", error);
                setSession(null);
                setUser(null);
            } finally {
                // This is the most critical part: guarantee that loading is set to false.
                setLoading(false);
            }
        };

        checkInitialSession();

        // This listener handles subsequent auth events like SIGN_IN, SIGN_OUT.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                if (newSession?.user) {
                     const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', newSession.user.id)
                        .single();
                    
                    if (error) {
                        console.error("Error fetching profile on auth state change", error);
                        // Log user in with default role if profile fetch fails
                        const authUser: AuthUser = { ...newSession.user, role: 'siswa' };
                        setSession(newSession);
                        setUser(authUser);
                        return;
                    }

                    const authUser: AuthUser = { ...newSession.user, role: (profile as UserProfile)?.role || 'siswa' };
                    setSession(newSession);
                    setUser(authUser);
                } else {
                    // This handles logout.
                    setSession(null);
                    setUser(null);
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Effect for auto-logout timer
    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        
        if (user) {
            resetLogoutTimer();
            events.forEach(event => window.addEventListener(event, resetLogoutTimer));
        }

        return () => {
            if (logoutTimer.current) {
                clearTimeout(logoutTimer.current);
            }
            events.forEach(event => window.removeEventListener(event, resetLogoutTimer));
        };
    }, [user, resetLogoutTimer]);
    
    const value = { session, user, loading, signOut };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};