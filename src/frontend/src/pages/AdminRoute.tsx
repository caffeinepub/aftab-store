import { Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminStatus } from '../hooks/useQueries';
import LoginInterface from '../components/LoginInterface';
import AccessDenied from '../components/AccessDenied';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminRoute() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: isAdmin, isLoading: isCheckingAdmin, isFetched, error } = useAdminStatus();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isInitializing = loginStatus === 'initializing';

  if (isInitializing) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginInterface />;
  }

  // Show loading spinner while checking admin status or if query hasn't fetched yet
  if (isCheckingAdmin || !isFetched) {
    return <LoadingSpinner />;
  }

  // Only show AccessDenied when query has completed and user is not admin
  if (isFetched && (error || isAdmin === false)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}
