import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useOutletContext, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import { AuthProvider } from '../context/AuthContext';
import { FullPageLoader } from '../components/common/LoadingSpinner';

const HomePage = lazy(() => import('../pages/HomePage'));
const DoctorProfilePage = lazy(() => import('../pages/DoctorProfilePage'));
const ClinicsPage = lazy(() => import('../pages/ClinicsPage'));
const ResearchPage = lazy(() => import('../pages/ResearchPage'));
const GalleryPage = lazy(() => import('../pages/GalleryPage'));
const BookingPage = lazy(() => import('../pages/BookingPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Admin pages
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'));
const AdminResetPasswordPage = lazy(() => import('../pages/admin/AdminResetPasswordPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminAppointmentsPage = lazy(() => import('../pages/admin/AdminAppointmentsPage'));
const AdminQueuePage = lazy(() => import('../pages/admin/AdminQueuePage'));
const AdminClinicsPage = lazy(() => import('../pages/admin/AdminClinicsPage'));
const AdminSpecialDatesPage = lazy(() => import('../pages/admin/AdminSpecialDatesPage'));
const AdminProfilePage = lazy(() => import('../pages/admin/AdminProfilePage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminPaymentsPage = lazy(() => import('../pages/admin/AdminPaymentsPage'));
const AdminOnlineConsultPage = lazy(() => import('../pages/admin/AdminOnlineConsultPage'));
const AdminHonorsMediaPage = lazy(() => import('../pages/admin/AdminHonorsMediaPage'));
const PublicOnlineConsultPage = lazy(() => import('../pages/PublicOnlineConsultPage'));
const AppointmentTokenPage = lazy(() => import('../pages/AppointmentTokenPage'));

interface AdminOutletContext {
  clinicId: string;
}

function AdminDashboardWrapper() {
  const { clinicId } = useOutletContext<AdminOutletContext>();
  return <AdminDashboardPage clinicId={clinicId} />;
}

function AdminAppointmentsWrapper() {
  const { clinicId } = useOutletContext<AdminOutletContext>();
  return <AdminAppointmentsPage clinicId={clinicId} />;
}

function AdminQueueWrapper() {
  const { clinicId } = useOutletContext<AdminOutletContext>();
  return <AdminQueuePage clinicId={clinicId} />;
}

const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'doctor',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <DoctorProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'clinics',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <ClinicsPage />
          </Suspense>
        ),
      },
      {
        path: 'research',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <ResearchPage />
          </Suspense>
        ),
      },
      {
        path: 'gallery',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <GalleryPage />
          </Suspense>
        ),
      },
      {
        path: 'book',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <BookingPage />
          </Suspense>
        ),
      },
      {
        path: 'online-consult',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <PublicOnlineConsultPage />
          </Suspense>
        ),
      },
      {
        path: 'appointment/:token',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AppointmentTokenPage />
          </Suspense>
        ),
      },
    ],
  },
  // Unlinked Admin Login Route
  {
    path: '/admin/login',
    element: (
      <Suspense fallback={<FullPageLoader />}>
        <AdminLoginPage />
      </Suspense>
    ),
  },
  // Unlinked Password Reset Route
  {
    path: '/admin/reset-password',
    element: (
      <Suspense fallback={<FullPageLoader />}>
        <AdminResetPasswordPage />
      </Suspense>
    ),
  },
  // Protected Admin Routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminDashboardWrapper />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminDashboardWrapper />
          </Suspense>
        ),
      },
      {
        path: 'appointments',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminAppointmentsWrapper />
          </Suspense>
        ),
      },
      {
        path: 'queue',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminQueueWrapper />
          </Suspense>
        ),
      },
      {
        path: 'clinics',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminClinicsPage />
          </Suspense>
        ),
      },
      {
        path: 'honors-media',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminHonorsMediaPage />
          </Suspense>
        ),
      },
      {
        path: 'schedule',
        element: <Navigate to="/admin/clinics" replace />,
      },
      {
        path: 'special-dates',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminSpecialDatesPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'payments',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminPaymentsPage />
          </Suspense>
        ),
      },
      {
        path: 'online-consult',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminOnlineConsultPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<FullPageLoader />}>
            <AdminSettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  // 404 Catch-All
  {
    path: '*',
    element: (
      <Suspense fallback={<FullPageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
