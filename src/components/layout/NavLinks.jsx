import React from 'react';
import { NavLink } from 'react-router-dom';
import { navLinkClass } from './navConfig';

const NavLinks = ({ links, onNavigate }) => (
  <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
    {links.map(({ to, label, icon: Icon }) => (
      <NavLink key={to} to={to} className={navLinkClass} onClick={onNavigate}>
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span className="truncate">{label}</span>
      </NavLink>
    ))}
  </nav>
);

export const PromoCard = ({ role }) => (
  <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl [@media(max-height:760px)]:hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100 p-4">
    <svg viewBox="0 0 64 48" className="h-10 w-14" aria-hidden="true">
      <path d="M32 6 60 18 32 30 4 18z" fill="#4F46E5" />
      <path d="M14 23v11c8 6 28 6 36 0V23L32 31z" fill="#6366F1" />
      <path d="M56 19v14" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="56" cy="35" r="3" fill="#60A5FA" />
    </svg>
    <p className="mt-2 text-base font-bold leading-tight text-navy-900">
      {role === 'teacher' ? 'Empowering Educators with AI' : 'Empowering Learners with AI'}
    </p>
    <p className="mt-1 text-xs text-slate-600">Quality education for a brighter future.</p>
  </div>
);

export default NavLinks;
