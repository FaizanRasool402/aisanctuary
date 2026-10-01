import React from 'react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { navByRole } from './navConfig';
import NavLinks, { PromoCard } from './NavLinks';

const Sidebar = () => {
  const { user } = useAuth();
  const links = navByRole[user?.role] || [];

  return (
    <aside className="hidden border-r border-slate-100 bg-white md:flex md:w-64 md:shrink-0 md:flex-col">
      <div className="border-b border-slate-100 px-6 py-5">
        <Logo />
      </div>
      <NavLinks links={links} />
      <PromoCard role={user?.role} />
    </aside>
  );
};

export default Sidebar;
