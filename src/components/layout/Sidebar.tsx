import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getNavLinks, SchoolIcon, LogOutIcon } from '../../constants';
import { supabase } from '../../services/supabase';
import { useAuth } from '../auth/Auth';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [appName, setAppName] = useState('Aplikasi Absensi');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  
  const navLinks = getNavLinks(user?.role);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('app_name, logo_url')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, which is ok on first run
        console.error('Error fetching app settings:', error);
      }

      if (data) {
        if (data.app_name) setAppName(data.app_name);
        if (data.logo_url) setLogoUrl(data.logo_url);
      }
    };
    fetchSettings();
  }, []);

  const UserProfile = () => (
    <div className="px-4 py-3 border-t border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
          <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
        </div>
        <button 
          onClick={() => signOut()} 
          className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
          title="Logout"
        >
          <LogOutIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200
      transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
      flex flex-col
    `}>
      <div className="flex items-center h-20 border-b border-slate-200 px-4 gap-3">
        <div className="bg-sky-50 p-2 rounded-lg">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo Sekolah" className="h-8 w-8 object-contain" />
          ) : (
            <SchoolIcon className="h-8 w-8 text-sky-600" />
          )}
        </div>
        <h1 className="text-lg font-bold text-slate-800 truncate">{appName}</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 mx-4 my-1 rounded-lg text-sm transition-all duration-200 ${
                isActive 
                ? 'bg-sky-600 text-white font-semibold shadow-md' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`
            }
          >
            <link.icon className="h-5 w-5 mr-3" />
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
      {user && <UserProfile />}
    </div>
  );
};

export default Sidebar;