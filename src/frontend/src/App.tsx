import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import AdminRoute from './pages/AdminRoute';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import ProductsPage from './components/pages/ProductsPage';
import CategoriesPage from './components/pages/CategoriesPage';
import AdminUsersPage from './components/pages/AdminUsersPage';
import StoreDetailsPage from './components/pages/StoreDetailsPage';
import ImportPage from './components/pages/ImportPage';
import PublicLayout from './components/PublicLayout';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import ToastContainer from './components/ToastContainer';

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <Outlet />
      <ToastContainer />
    </div>
  ),
});

// Public routes
const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public-layout',
  component: PublicLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/',
  component: HomePage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/product/$barcode',
  component: ProductDetailPage,
});

const categoryRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/category',
  component: CategoryPage,
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    return {
      id: typeof search.id === 'string' ? search.id : undefined,
    };
  },
});

const contactRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/contacto',
  component: ContactPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/privacy',
  component: PrivacyPage,
});

// Admin routes
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminRoute,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => adminRoute,
  id: 'admin-layout',
  component: DashboardLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: DashboardHome,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/products',
  component: ProductsPage,
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/categories',
  component: CategoriesPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin-users',
  component: AdminUsersPage,
});

const adminStoreRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/store-details',
  component: StoreDetailsPage,
});

const adminImportRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/import',
  component: ImportPage,
});

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([
    homeRoute,
    productDetailRoute,
    categoryRoute,
    contactRoute,
    privacyRoute,
  ]),
  adminRoute.addChildren([
    adminLayoutRoute.addChildren([
      adminIndexRoute,
      adminProductsRoute,
      adminCategoriesRoute,
      adminUsersRoute,
      adminStoreRoute,
      adminImportRoute,
    ]),
  ]),
]);

const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
