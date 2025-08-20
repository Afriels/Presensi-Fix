import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/Auth';
import { LogOutIcon } from '../../constants';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <header className="h-20 bg-white border-b flex items-center justify-between px-4 sm:px-6">
       <button
        onClick={onMenuClick}
        className="text-gray-500 focus:outline-none md:hidden"
        aria-label="Buka sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
      <div className="flex items-center gap-4 ml-auto">
        {user && (
           <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">{formatDate(currentTime)}</p>
            <p className="text-lg font-bold text-primary-700">{formatTime(currentTime)}</p>
          </div>
        )}
        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={() => signOut()} 
              className="p-2 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
              title="Logout"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
