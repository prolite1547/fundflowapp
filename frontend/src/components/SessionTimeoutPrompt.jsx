import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { sessionService } from '../services/api';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getTokenExpiryMs,
  AUTH_CHANGE_EVENT
} from '../utils/session';

const WARNING_WINDOW_MS = 60 * 1000;

const SessionTimeoutPrompt = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setSecondsRemaining(null);
      setIsExpired(false);
      setError('');
      return undefined;
    }

    const syncSessionState = () => {
      const accessToken = getAccessToken();
      const expiryMs = getTokenExpiryMs(accessToken);

      if (!accessToken || !expiryMs) {
        setSecondsRemaining(null);
        setIsExpired(false);
        return;
      }

      const remainingMs = expiryMs - Date.now();

      if (remainingMs <= 0) {
        setSecondsRemaining(0);
        setIsExpired(true);
        return;
      }

      if (remainingMs <= WARNING_WINDOW_MS) {
        setSecondsRemaining(Math.ceil(remainingMs / 1000));
        setIsExpired(false);
        return;
      }

      setSecondsRemaining(null);
      setIsExpired(false);
      setError('');
    };

    syncSessionState();

    const intervalId = window.setInterval(syncSessionState, 1000);
    window.addEventListener(AUTH_CHANGE_EVENT, syncSessionState);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncSessionState);
    };
  }, [isAuthenticated]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setError('');

    try {
      await sessionService.refreshSession();
      setSecondsRemaining(null);
      setIsExpired(false);
    } catch (refreshError) {
      setError('Session could not be restored. Please sign in again.');
      navigate('/login');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const hasRefreshToken = Boolean(getRefreshToken());
  const shouldShowPrompt = isAuthenticated && (secondsRemaining !== null || isExpired);

  if (!shouldShowPrompt) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up session-modal">
        <h2>{isExpired ? 'Session expired' : 'Session ending soon'}</h2>
        <p className="session-modal-message">
          {isExpired
            ? 'Your access token has expired. Resume your session now to continue without signing in again.'
            : `Your session will expire in ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'}. Refresh it now to avoid interruption.`}
        </p>
        {error && <div className="error-message">{error}</div>}
        {!hasRefreshToken && (
          <div className="error-message">
            Your refresh token is no longer available. Please sign in again.
          </div>
        )}
        <div className="session-countdown">
          <span>Countdown</span>
          <strong>{isExpired ? '00:00' : `00:${String(secondsRemaining).padStart(2, '0')}`}</strong>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={handleLogout}>
            Sign Out
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleRefreshSession}
            disabled={!hasRefreshToken || isRefreshing}
          >
            {isRefreshing ? <Loader2 className="spin" size={18} /> : null}
            {isExpired ? 'Resume Session' : 'Stay Signed In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutPrompt;
