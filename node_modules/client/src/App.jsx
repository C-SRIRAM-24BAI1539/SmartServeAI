
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext.jsx";
import AuthPage from "./features/auth/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import ProviderServicesPage from "./pages/ProviderServicesPage.jsx";
import "./App.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: 32 }}>Loading account...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function LandingFallback() {
  const { user } = useAuth();

  return (
    <main style={{ maxWidth: 1000, margin: "80px auto", padding: 24 }}>
      <h1>SmartServe AI</h1>
      <p>AI-powered home service booking and management.</p>
      <p>
        Find plumbing, electrical, AC servicing, carpentry and appliance repair
        services in one place.
      </p>
      {user ? (
        <Link to="/dashboard">Open dashboard</Link>
      ) : (
        <>
          <Link to="/login">Sign in</Link>
          {" · "}
          <Link to="/register">Create account</Link>
        </>
      )}
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingFallback />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/book/:serviceId" element={<BookingPage />} />
      <Route path="/provider/services/new" element={<ProviderServicesPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}