import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import UpdateBanner from './components/ui/UpdateBanner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import DiscoverPage from './pages/DiscoverPage';
import EventsPage from './pages/EventsPage';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import MessagesPage from './pages/MessagesPage';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './styles/variables.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/responsive.css';
import './styles/overrides.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UpdateBanner />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
              style: { background: '#f0fdf4', color: '#15803d' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
              style: { background: '#fef2f2', color: '#b91c1c' },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
