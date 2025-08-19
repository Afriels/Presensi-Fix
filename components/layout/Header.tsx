
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
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
    <header className="h-20 bg-white border-b flex items-center justify-end px-6">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-700">{formatDate(currentTime)}</p>
        <p className="text-lg font-bold text-primary-700">{formatTime(currentTime)}</p>
      </div>
    </header>
  );
};

export default Header;