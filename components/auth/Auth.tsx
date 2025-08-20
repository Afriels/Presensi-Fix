import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { supabase, Enums, Tables } from '../../services/supabase';
import { Session, User } from '@supabase/supabase-js';
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
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error.message);
        } else {
            setUser(null);
            setSession(null);
        }
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

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                try {
                    setSession(session);
                    if (session?.user) {
                        const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();
                        
                        if (error) {
                            console.error("Error fetching profile:", error);
                        }

                        setUser({ ...session.user, role: profile?.role || 'siswa' });
                    } else {
                        setUser(null);
                    }
                } catch (e) {
                    console.error("Error fetching profile during auth state change", e);
                    setUser(null); // Ensure user is cleared if profile fetch fails
                } finally {
                    setLoading(false);
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
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
