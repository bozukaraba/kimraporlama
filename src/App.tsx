import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import AdminPanel from './components/Admin/AdminPanel';
import SocialMediaForm from './components/Forms/SocialMediaForm';
import NewsForm from './components/Forms/NewsForm';
import WebAnalyticsForm from './components/Forms/WebAnalyticsForm';
import RPAForm from './components/Forms/RPAForm';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!currentUser.isApproved) {
    return <div>Hesabınız henüz onaylanmamış. Admin onayını bekleyin.</div>;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser?.isApproved) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/sosyal-medya" element={
              <ProtectedRoute>
                <SocialMediaForm />
              </ProtectedRoute>
            } />
            <Route path="/haberler" element={
              <ProtectedRoute>
                <NewsForm />
              </ProtectedRoute>
            } />
            <Route path="/web-analitik" element={
              <ProtectedRoute>
                <WebAnalyticsForm />
              </ProtectedRoute>
            } />
            <Route path="/rpa-rapor" element={
              <ProtectedRoute>
                <RPAForm />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
