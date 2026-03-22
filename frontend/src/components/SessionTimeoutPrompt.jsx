import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
const SESSION_RESUME_GRACE_MS = 60 * 1000;

const SessionTimeoutPrompt = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(SESSION_RESUME_GRACE_MS / 1000));
  const lastActivityAtRef = useRef(Date.now());
  const promptedExpiryMsRef = useRef(null);
  const promptDeadlineRef = useRef(null);
  const expiryTimerRef = useRef(null);

  const handleLogout = useCallback(() => {
    clearSession();
    promptDeadlineRef.current = null;
    promptedExpiryMsRef.current = null;
    setShowPrompt(false);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      window.clearTimeout(expiryTimerRef.current);
      lastActivityAtRef.current = Date.now();
      promptedExpiryMsRef.current = null;
      promptDeadlineRef.current = null;
      setShowPrompt(false);
      setError('');
      setSecondsRemaining(Math.ceil(SESSION_RESUME_GRACE_MS / 1000));
      return undefined;
    }

    const hidePrompt = () => {
      promptDeadlineRef.current = null;
      setShowPrompt(false);
      setError('');
      setSecondsRemaining(Math.ceil(SESSION_RESUME_GRACE_MS / 1000));
    };

    const showPromptForExpiry = (expiryMs) => {
      if (promptedExpiryMsRef.current === expiryMs) {
        return;
      }

      promptedExpiryMsRef.current = expiryMs;
      promptDeadlineRef.current = Date.now() + SESSION_RESUME_GRACE_MS;
      setSecondsRemaining(Math.ceil(SESSION_RESUME_GRACE_MS / 1000));
      setShowPrompt(true);
    };

    const scheduleExpiryCheck = () => {
      window.clearTimeout(expiryTimerRef.current);

      const accessToken = getAccessToken();
      const expiryMs = getTokenExpiryMs(accessToken);

      if (!accessToken || !expiryMs) {
        promptedExpiryMsRef.current = null;
        hidePrompt();
        return;
      }

      const now = Date.now();
      const hasExpired = now >= expiryMs;
      const wasIdleThroughExpiry = lastActivityAtRef.current < expiryMs;

      if (hasExpired && wasIdleThroughExpiry) {
        showPromptForExpiry(expiryMs);
        return;
      }

      if (hasExpired) {
        hidePrompt();
        return;
      }

      hidePrompt();
      expiryTimerRef.current = window.setTimeout(() => {
        if (lastActivityAtRef.current < expiryMs) {
          showPromptForExpiry(expiryMs);
        }
      }, Math.max(expiryMs - now, 0));
    };

    const handleActivity = () => {
      const accessToken = getAccessToken();
      const expiryMs = getTokenExpiryMs(accessToken);

      if (expiryMs && Date.now() >= expiryMs) {
        showPromptForExpiry(expiryMs);
        return;
      }

      lastActivityAtRef.current = Date.now();
      promptedExpiryMsRef.current = null;
      setError('');
    };

    lastActivityAtRef.current = Date.now();
    scheduleExpiryCheck();

    window.addEventListener(AUTH_CHANGE_EVENT, scheduleExpiryCheck);
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      window.clearTimeout(expiryTimerRef.current);
      window.removeEventListener(AUTH_CHANGE_EVENT, scheduleExpiryCheck);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!showPrompt) {
      return undefined;
    }

    const syncCountdown = () => {
      const deadline = promptDeadlineRef.current;

      if (!deadline) {
        return;
      }

      const remainingMs = deadline - Date.now();

      if (remainingMs <= 0) {
        handleLogout();
        return;
      }

      setSecondsRemaining(Math.ceil(remainingMs / 1000));
    };

    syncCountdown();
    const intervalId = window.setInterval(syncCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [handleLogout, showPrompt]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    setError('');

    try {
      await sessionService.refreshSession();
      lastActivityAtRef.current = Date.now();
      promptedExpiryMsRef.current = null;
      promptDeadlineRef.current = null;
      setShowPrompt(false);
      setError('');
      setSecondsRemaining(Math.ceil(SESSION_RESUME_GRACE_MS / 1000));
    } catch {
      setError('Session could not be restored. Please sign in again.');
      navigate('/login');
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasRefreshToken = Boolean(getRefreshToken());

  if (!isAuthenticated || !showPrompt) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up session-modal">
        <h2>Session expired</h2>
        <p className="session-modal-message">
          Your session expired while you were inactive. Resume your session now to continue without signing in again.
        </p>
        <div className="session-countdown">
          <span>Signing out in</span>
          <strong>00:{String(secondsRemaining).padStart(2, '0')}</strong>
        </div>
        {error && <div className="error-message">{error}</div>}
        {!hasRefreshToken && (
          <div className="error-message">
            Your refresh token is no longer available. Please sign in again.
          </div>
        )}
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
            Resume Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutPrompt;
