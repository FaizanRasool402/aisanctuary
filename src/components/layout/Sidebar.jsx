import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { navByRole, navLinkClass } from './navConfig';

const Sidebar = () => {
  const { user } = useAuth();
  const links = navByRole[user?.role] || [];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:shrink-0 border-r border-navy-100 bg-white">
      <div className="px-5 py-5 border-b border-navy-100">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={navLinkClass}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-navy-100">
        <span className="inline-block rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600 capitalize">
          {user?.role}
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
