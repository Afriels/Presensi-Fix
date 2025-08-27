
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
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
    <header className="h-20 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="text-slate-500 hover:text-slate-800 focus:outline-none md:hidden"
        aria-label="Buka sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
      
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">{formatDate(currentTime)}</p>
          <p className="text-lg font-bold text-sky-700 tracking-wider">{formatTime(currentTime)}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;