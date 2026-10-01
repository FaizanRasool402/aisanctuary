import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ title, children }) => {
  useEffect(() => {
    if (title) document.title = `${title} · AI Sanctuary`;
  }, [title]);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  return (
    <div className="flex min-h-screen bg-surface md:h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          menuOpen={menuOpen}
          onToggleMenu={toggleMenu}
          onCloseMenu={closeMenu}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/60 p-4 md:p-6 2xl:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
