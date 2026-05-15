'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useResetPassword } from './useResetPassword';
import { resetPasswordStyles } from './ResetPassword.styles';
import PageTransition from '../../components/PageTransition';

const EyeOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function ResetPasswordPage() {
  const {
    step,
    code, handleInputChange, handleKeyDown, handleVerify2FA,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, error,
    showPassword, setShowPassword,
    handleUpdatePassword,
  } = useResetPassword();
  const router = useRouter();

  return (
    <PageTransition direction="up">
      <style jsx>{resetPasswordStyles}</style>

      <main className="reset-root">
        <div className="reset-wrapper">
          <div className="reset-card">

            <div className="reset-icon">
              {step === 'done' ? '✅' : step === 'new-password' ? '🔒' : '📱'}
            </div>

            {/* ── Estado: enlace inválido ── */}
            {step === 'invalid' && (
              <>
                <h1 className="reset-title">Enlace inválido</h1>
                <p className="reset-invalid-error">{error}</p>
                <a
                  onClick={() => router.push('/auth/forgot-password')}
                  className="reset-new-link"
                  style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}
                >
                  Solicitar nuevo enlace
                </a>
              </>
            )}

            {/* ── Estado: verificar 2FA ── */}
            {step === 'verify-2fa' && (
              <>
                <h1 className="reset-title">Verificar identidad</h1>
                <p className="reset-subtitle">
                  Por seguridad, ingresa el código de tu aplicación de autenticación.
                </p>

                <div className="otp-group">
                  {code.map((digit, index) => (
                    <React.Fragment key={index}>
                      <input
                        id={`otp-reset-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="otp-input"
                        value={digit}
                        onChange={(e) => handleInputChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                      />
                      {index === 2 && <span className="otp-separator">–</span>}
                    </React.Fragment>
                  ))}
                </div>

                {error && <p className="reset-error">{error}</p>}

                <button
                  onClick={handleVerify2FA}
                  disabled={loading || code.join('').length !== 6}
                  className="reset-button"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
              </>
            )}

            {/* ── Estado: nueva contraseña ── */}
            {step === 'new-password' && (
              <>
                <h1 className="reset-title">Nueva contraseña</h1>
                <p className="reset-subtitle">Ingresa tu nueva contraseña.</p>

                <div className="input-group">
                  <label className="reset-label">Nueva contraseña</label>
                  <div className="reset-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="reset-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="reset-eye-button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="reset-label">Confirmar contraseña</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="reset-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
                  />
                </div>

                {error && <p className="reset-error">{error}</p>}

                <button
                  onClick={handleUpdatePassword}
                  disabled={loading || !password || !confirmPassword}
                  className="reset-button"
                >
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </>
            )}

            {/* ── Estado: éxito ── */}
            {step === 'done' && (
              <>
                <h1 className="reset-title">¡Listo!</h1>
                <p className="reset-success-title">Contraseña actualizada</p>
                <p className="reset-success-text">Redirigiendo al login...</p>
              </>
            )}

            {step !== 'done' && step !== 'invalid' && (
              <a
                onClick={() => router.push('/login')}
                className="reset-back-link"
                style={{ cursor: 'pointer' }}
              >
                ← Volver al login
              </a>
            )}

          </div>
        </div>
      </main>
    </PageTransition>
  );
}