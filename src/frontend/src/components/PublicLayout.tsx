import React from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import PublicHeader from './PublicHeader';
import Footer from './Footer';
import CookieConsent from './CookieConsent';

export default function PublicLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  
  // Don't show cookie consent on privacy policy page
  const showCookieConsent = currentPath !== '/privacy';

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {showCookieConsent && <CookieConsent />}
    </div>
  );
}
