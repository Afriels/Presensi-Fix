import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase, Enums, Tables } from '../../services/supabase';
// Fix: Import Session and User from @supabase/gotrue-js to resolve module export errors from older @supabase/supabase-js versions.
import type { Session, User } from '@supabase/gotrue-js';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

type UserProfile = Tables<'profiles'>;
type UserRole = Enums<'user_role'>;

// Using a type intersection for more robust extension of the Supabase User type.
// This resolves potential issues with property re-declarations (like 'role')
// and ensures all properties from the base User type, like 'email', are preserved.
type AuthUser = User & {
    role: UserRole;
};

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
    // Explicitly initializing useRef with 'undefined' to satisfy linters or environments
    // that might incorrectly report an error for a no-argument call.
    const logoutTimer = useRef<number | undefined>(undefined);
    const navigate = useNavigate();

    const signOut = async () => {
        // Immediately clear local state and navigate to login.
        // This provides a faster, more reliable logout experience than
        // solely relying on the onAuthStateChange listener.
        setUser(null);
        setSession(null);
        navigate('/login', { replace: true });

        // Perform the sign-out from Supabase in the background.
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
            signOut();
        }, 10 * 60 * 1000); // 10 minutes
    };

    useEffect(() => {
        // onAuthStateChange fires immediately with the initial session, so we don't need a separate getSession() call.
        // This single listener handles initial load, sign in, and sign out, preventing race conditions.
        // Fix: The return value structure for onAuthStateChange was different in older versions. Changed `{ data: { subscription } }` to `{ data: subscription }`.
        const { data: subscription } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    try {
                        const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();

                        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not a fatal error here
                            throw error;
                        }

                        const authUser: AuthUser = { ...session.user, role: profile?.role || 'siswa' };
                        setSession(session);
                        setUser(authUser);
                    } catch (error) {
                        console.error("Error fetching profile on auth change. Signing out.", error);
                        // If profile fetch fails, sign out to prevent inconsistent/insecure state
                        await supabase.auth.signOut();
                        setSession(null);
                        setUser(null);
                    }
                } else {
                    // This handles the SIGNED_OUT event or if there's no initial session.
                    setSession(null);
                    setUser(null);
                }
                
                // The first event fired is INITIAL_SESSION. After that, we are no longer loading.
                // This guarantees the loading spinner will disappear.
                setLoading(false);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Effect for auto-logout timer
    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        
        if (user) { // Only run the timer if a user is logged in
            resetLogoutTimer();
            events.forEach(event => window.addEventListener(event, resetLogoutTimer));
        }

        return () => {
            if (logoutTimer.current) {
                clearTimeout(logoutTimer.current);
            }
            events.forEach(event => window.removeEventListener(event, resetLogoutTimer));
        };
    }, [user]);
    
    const value = { session, user, loading, signOut };

    // We render children immediately. The loading state is handled by ProtectedRoute.
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
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
