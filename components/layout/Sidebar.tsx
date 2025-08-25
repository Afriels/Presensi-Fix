
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getNavLinks, SchoolIcon } from '../../constants';
import { supabase } from '../../services/supabase';
import { useAuth } from '../auth/Auth';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [appName, setAppName] = useState('Aplikasi Absensi');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { user } = useAuth();
  
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

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-md
      transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:relative md:translate-x-0 transition-transform duration-200 ease-in-out
    `}>
      <div className="flex items-center justify-center h-20 border-b px-4 gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo Sekolah" className="h-12 w-auto max-w-[48px] object-contain" />
        ) : (
          <SchoolIcon className="h-8 w-8 text-primary-600 flex-shrink-0" />
        )}
        <h1 className="text-xl font-bold text-gray-800 truncate">{appName}</h1>
      </div>
      <nav className="mt-5">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 my-1 text-gray-600 transition-colors duration-200 transform hover:bg-primary-50 hover:text-primary-600 ${
                isActive ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-500' : ''
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            <span className="mx-4 font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
