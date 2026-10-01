import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import { ChevronDownIcon, CloseIcon, LogoutIcon, MenuIcon } from '../ui/icons';
import { navByRole } from './navConfig';
import NavLinks from './NavLinks';

const Navbar = ({ menuOpen, onToggleMenu, onCloseMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navByRole[user?.role] || [];
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    setUserMenuOpen(false);
    onCloseMenu();
    logout();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0).toUpperCase();

  return (
    <header className="relative border-b border-slate-100 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onToggleMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-navy-700 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
          <div className="md:hidden">
            <Logo size={32} />
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-3 rounded-xl px-1.5 py-1 transition hover:bg-slate-50"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-semibold text-white">
              {initial}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold text-navy-900">{user?.name}</span>
              <span className="block max-w-[200px] truncate text-xs text-slate-500">{user?.email}</span>
            </span>
            <ChevronDownIcon className="h-4 w-4 text-slate-500" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-slate-100 bg-white text-sm shadow-lg"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate font-semibold text-navy-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700">
                    {user?.role}
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-red-600 hover:bg-red-50"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
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
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={onCloseMenu}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-navy-700"
                aria-label="Close menu"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <NavLinks links={links} onNavigate={onCloseMenu} />
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-sm font-medium text-navy-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">
                  {user?.role}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
