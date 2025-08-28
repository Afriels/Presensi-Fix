
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase, Enums, Tables } from '../../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

type UserProfile = Tables<'profiles'>;
type UserRole = Enums<'user_role'>;

type AuthUser = User & {
    role: UserRole;
};

interface AuthContextType {
    session: Session | null;
    user: AuthUser | null;
    loading: boolean;
    signOut: (options?: { message?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const logoutTimer = useRef<number | undefined>(undefined);
    const navigate = useNavigate();

    const signOut = async (options?: { message?: string }) => {
        setUser(null);
        setSession(null);
        navigate('/login', {
            replace: true,
            state: options?.message ? { message: options.message } : undefined,
        });

        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out from Supabase:', error);
        }
    };

    const resetLogoutTimer = () => {
        if (logoutTimer.current) {
            clearTimeout(logoutTimer.current);
        }
        logoutTimer.current = window.setTimeout(() => {
            console.log("Auto-logging out due to inactivity.");
            signOut({ message: 'Sesi Anda telah berakhir karena tidak ada aktivitas.' });
        }, 60 * 60 * 1000); // 60 minutes
    };

    useEffect(() => {
        // This effect now correctly allows Supabase to manage session persistence.
        // The aggressive localStorage.clear() has been removed to fix JWT errors.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    try {
                        const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();

                        if (error && error.code !== 'PGRST116') {
                            throw error;
                        }

                        const authUser: AuthUser = { ...session.user, role: profile?.role || 'siswa' };
                        setSession(session);
                        setUser(authUser);
                    } catch (error) {
                        console.error("Error fetching profile on auth change. Signing out.", error);
                        await supabase.auth.signOut();
                        setSession(null);
                        setUser(null);
                    }
                } else {
                    setSession(null);
                    setUser(null);
                }
                
                setLoading(false);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

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
    }, [user, signOut]); // Add signOut to dependency array
    
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
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
