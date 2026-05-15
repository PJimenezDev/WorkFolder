'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForgotPassword } from './useForgotPassword';
import { forgotPasswordStyles } from './ForgotPassword.styles';
import PageTransition from '../../components/PageTransition';

export default function ForgotPasswordPage() {
  const { email, setEmail, loading, sent, error, handleSubmit } = useForgotPassword();
  const router = useRouter();

  return (
    <PageTransition direction="up">
      <style jsx>{forgotPasswordStyles}</style>

      <main className="forgot-root">
        <div className="forgot-wrapper">
          <div className="forgot-card">

            <div className="forgot-icon">🔑</div>
            <h1 className="forgot-title">Recuperar contraseña</h1>

            {!sent ? (
              <>
                <p className="forgot-subtitle">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <div className="input-group">
                  <label className="forgot-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="forgot-input"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {error && <p className="forgot-error">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !email}
                  className="forgot-button"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </>
            ) : (
              <>
                <p className="forgot-success-icon">📧</p>
                <p className="forgot-success-title">¡Email enviado!</p>
                <p className="forgot-success-text">
                  Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                </p>
              </>
            )}

            <a
              onClick={() => router.push('/login')}
              className="forgot-back-link"
              style={{ cursor: 'pointer' }}
            >
              ← Volver al login
            </a>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}