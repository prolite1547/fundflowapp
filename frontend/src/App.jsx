import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SessionTimeoutPrompt from './components/SessionTimeoutPrompt';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import Login from './pages/Login';
import Register from './pages/Register';
import { sessionService } from './services/api';
import {
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  AUTH_CHANGE_EVENT
} from './utils/session';

const ProtectedRoute = ({ children, authenticated, ready }) => {
  if (!ready) {
    return <div className="loading">Restoring session...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const syncAuthState = useCallback(async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken && !isTokenExpired(accessToken, 5000)) {
      setAuthenticated(true);
      setAuthReady(true);
      return;
    }

    if (refreshToken) {
      try {
        await sessionService.refreshSession();
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setAuthReady(true);
      }
      return;
    }

    setAuthenticated(false);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    syncAuthState();

    const handleAuthChange = () => {
      syncAuthState();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [syncAuthState]);

  return (
    <Router>
      <SessionTimeoutPrompt isAuthenticated={authenticated} />
      <Routes>
        <Route
          path="/login"
          element={authReady ? (authenticated ? <Navigate to="/" replace /> : <Login />) : <div className="loading">Restoring session...</div>}
        />
        <Route
          path="/register"
          element={authReady ? (authenticated ? <Navigate to="/" replace /> : <Register />) : <div className="loading">Restoring session...</div>}
        />
        
        <Route path="/" element={<ProtectedRoute authenticated={authenticated} ready={authReady}><Dashboard /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute authenticated={authenticated} ready={authReady}><Transactions /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute authenticated={authenticated} ready={authReady}><Accounts /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute authenticated={authenticated} ready={authReady}><Categories /></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute authenticated={authenticated} ready={authReady}><Budgets /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute authenticated={authenticated} ready={authReady}><Reports /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
