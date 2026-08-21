import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import { navByRole, navLinkClass } from './navConfig';

const Navbar = ({ title, menuOpen, onToggleMenu, onCloseMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navByRole[user?.role] || [];

  useEffect(() => {
    const sync = () => {
      if (window.innerWidth >= 768) {
        onCloseMenu();
        document.body.style.overflow = '';
        return;
      }
      document.body.style.overflow = menuOpen ? 'hidden' : '';
    };
    sync();
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
      document.body.style.overflow = '';
    };
  }, [menuOpen, onCloseMenu]);

  const handleLogout = () => {
    onCloseMenu();
    logout();
    navigate('/login');
  };

  return (
    <header className="relative border-b border-navy-100 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={onToggleMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-navy-100 text-navy-700 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <h1 className="truncate text-base font-semibold text-navy-900 md:text-xl">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-navy-900">{user?.name}</div>
            <div className="max-w-[180px] truncate text-xs text-gray-500">{user?.email}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-navy-100 px-2.5 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-50 md:ml-2 md:px-3 md:text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-navy-900/40"
            aria-label="Close menu overlay"
            onClick={onCloseMenu}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-navy-100 px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={onCloseMenu}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 text-navy-700"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={onCloseMenu}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-navy-100 px-4 py-3">
              <p className="text-sm font-medium text-navy-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
              <span className="mt-2 inline-block rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium capitalize text-navy-600">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
