import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { PublicDataProvider } from './context/SettingsContext';
import { AuthProvider, RequireAdmin } from './context/AuthContext';
import { CustomerAuthProvider, RequireCustomer } from './context/CustomerAuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Route-based code splitting
const HomePage = lazy(() =>
  import('./pages/public/HomePage').then((m) => ({ default: m.HomePage }))
);
const AboutPage = lazy(() =>
  import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const RoomsPage = lazy(() =>
  import('./pages/public/RoomsPage').then((m) => ({ default: m.RoomsPage }))
);
const RoomDetailPage = lazy(() =>
  import('./pages/public/RoomDetailPage').then((m) => ({ default: m.RoomDetailPage }))
);
const BookingPage = lazy(() =>
  import('./pages/public/BookingPage').then((m) => ({ default: m.BookingPage }))
);
const BookingSuccessPage = lazy(() =>
  import('./pages/public/BookingSuccessPage').then((m) => ({ default: m.BookingSuccessPage }))
);
const GalleryPage = lazy(() =>
  import('./pages/public/GalleryPage').then((m) => ({ default: m.GalleryPage }))
);
const ExperiencesPage = lazy(() =>
  import('./pages/public/ExperiencesPage').then((m) => ({ default: m.ExperiencesPage }))
);
const DiningPage = lazy(() =>
  import('./pages/public/DiningPage').then((m) => ({ default: m.DiningPage }))
);
const LocationPage = lazy(() =>
  import('./pages/public/LocationPage').then((m) => ({ default: m.LocationPage }))
);
const ContactPage = lazy(() =>
  import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const FAQPage = lazy(() =>
  import('./pages/public/FAQPage').then((m) => ({ default: m.FAQPage }))
);
const PolicyPage = lazy(() =>
  import('./pages/public/PolicyPage').then((m) => ({ default: m.PolicyPage }))
);
const CustomerLoginPage = lazy(() =>
  import('./pages/public/CustomerLoginPage').then((m) => ({ default: m.CustomerLoginPage }))
);
const CustomerRegisterPage = lazy(() =>
  import('./pages/public/CustomerRegisterPage').then((m) => ({ default: m.CustomerRegisterPage }))
);
const CustomerAccountPage = lazy(() =>
  import('./pages/public/CustomerAccountPage').then((m) => ({ default: m.CustomerAccountPage }))
);

const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminBookingsPage = lazy(() =>
  import('./pages/admin/AdminBookingsPage').then((m) => ({ default: m.AdminBookingsPage }))
);
const AdminBookingDetailPage = lazy(() =>
  import('./pages/admin/AdminBookingDetailPage').then((m) => ({
    default: m.AdminBookingDetailPage,
  }))
);
const AdminRoomsPage = lazy(() =>
  import('./pages/admin/AdminRoomsPage').then((m) => ({ default: m.AdminRoomsPage }))
);
const AdminRoomFormPage = lazy(() =>
  import('./pages/admin/AdminRoomFormPage').then((m) => ({ default: m.AdminRoomFormPage }))
);
const AdminAvailabilityPage = lazy(() =>
  import('./pages/admin/AdminAvailabilityPage').then((m) => ({
    default: m.AdminAvailabilityPage,
  }))
);
const AdminGalleryPage = lazy(() =>
  import('./pages/admin/AdminGalleryPage').then((m) => ({ default: m.AdminGalleryPage }))
);
const AdminExperiencesPage = lazy(() =>
  import('./pages/admin/AdminExperiencesPage').then((m) => ({ default: m.AdminExperiencesPage }))
);
const AdminDiningPage = lazy(() =>
  import('./pages/admin/AdminDiningPage').then((m) => ({ default: m.AdminDiningPage }))
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage }))
);
const AdminMessagesPage = lazy(() =>
  import('./pages/admin/AdminMessagesPage').then((m) => ({ default: m.AdminMessagesPage }))
);
const AdminContentPage = lazy(() =>
  import('./pages/admin/AdminContentPage').then((m) => ({ default: m.AdminContentPage }))
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);
const AdminProfilePage = lazy(() =>
  import('./pages/admin/AdminProfilePage').then((m) => ({ default: m.AdminProfilePage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#58636B]">
      Loading CLOUD VALLEY...
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomerAuthProvider>
          <PublicDataProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  {/* Public Website Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/rooms" element={<RoomsPage />} />
                    <Route path="/rooms/:slug" element={<RoomDetailPage />} />
                    <Route path="/login" element={<CustomerLoginPage />} />
                    <Route path="/register" element={<CustomerRegisterPage />} />
                    <Route
                      path="/account"
                      element={
                        <RequireCustomer>
                          <CustomerAccountPage />
                        </RequireCustomer>
                      }
                    />
                    <Route
                      path="/booking"
                      element={
                        <RequireCustomer>
                          <BookingPage />
                        </RequireCustomer>
                      }
                    />
                    <Route
                      path="/booking/success"
                      element={
                        <RequireCustomer>
                          <BookingSuccessPage />
                        </RequireCustomer>
                      }
                    />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/experiences" element={<ExperiencesPage />} />
                    <Route path="/dining" element={<DiningPage />} />
                  <Route path="/location" element={<LocationPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route
                    path="/privacy-policy"
                    element={<PolicyPage slug="privacy-policy" />}
                  />
                  <Route path="/terms" element={<PolicyPage slug="terms" />} />
                  <Route
                    path="/cancellation-policy"
                    element={<PolicyPage slug="cancellation-policy" />}
                  />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="bookings" element={<AdminBookingsPage />} />
                  <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
                  <Route path="rooms" element={<AdminRoomsPage />} />
                  <Route path="rooms/create" element={<AdminRoomFormPage />} />
                  <Route path="rooms/:id/edit" element={<AdminRoomFormPage />} />
                  <Route path="availability" element={<AdminAvailabilityPage />} />
                  <Route path="gallery" element={<AdminGalleryPage />} />
                  <Route path="experiences" element={<AdminExperiencesPage />} />
                  <Route path="dining" element={<AdminDiningPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="messages" element={<AdminMessagesPage />} />
                  <Route path="content" element={<AdminContentPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="profile" element={<AdminProfilePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
            <Toaster position="top-right" richColors />
          </PublicDataProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
