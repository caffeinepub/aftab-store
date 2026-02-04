import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'aftab-cookie-consent';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Show banner after a brief delay for smooth animation
        setTimeout(() => {
          setIsVisible(true);
          setIsAnimating(true);
        }, 500);
      }
    } catch (error) {
      // If localStorage is not available, show the banner
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 500);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    } catch (error) {
      console.warn('Could not save cookie consent preference');
    }
    handleClose();
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    } catch (error) {
      console.warn('Could not save cookie consent preference');
    }
    handleClose();
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`cookie-consent-banner ${isAnimating ? 'cookie-consent-visible' : ''}`}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="cookie-consent-container">
        <button
          onClick={handleClose}
          className="cookie-consent-close"
          aria-label="Cerrar banner de cookies"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="cookie-consent-content">
          <p id="cookie-consent-description" className="cookie-consent-text">
            Utilizamos cookies para mejorar la funcionalidad del sitio y analizar el tráfico.
            Consulte nuestra{' '}
            <Link
              to="/privacy"
              className="cookie-consent-link"
              onClick={handleClose}
            >
              Política de Privacidad
            </Link>
            .
          </p>

          <div className="cookie-consent-actions">
            <button
              onClick={handleAccept}
              className="cookie-consent-button cookie-consent-button-accept"
              aria-label="Aceptar cookies"
            >
              Aceptar
            </button>
            <button
              onClick={handleDecline}
              className="cookie-consent-button cookie-consent-button-decline"
              aria-label="Declinar cookies"
            >
              Declinar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
