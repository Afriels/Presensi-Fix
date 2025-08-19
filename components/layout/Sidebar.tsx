
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS, SchoolIcon } from '../../constants';

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white shadow-md flex-shrink-0">
      <div className="flex items-center justify-center h-20 border-b">
        <SchoolIcon className="h-8 w-8 text-primary-600" />
        <h1 className="text-xl font-bold text-gray-800 ml-2">Absensi Siswa</h1>
      </div>
      <nav className="mt-5">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
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