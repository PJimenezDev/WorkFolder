import css from 'styled-jsx/css';

export const resetPasswordStyles = css`
  .reset-root {
    min-height: 100vh;
    background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('/background.png');
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Segoe UI", system-ui, sans-serif;
  }

  .reset-wrapper {
    width: 100%;
    max-width: 480px;
    padding: 0 24px;
  }

  .reset-card {
    background-color: rgba(23, 23, 23, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  }

  .reset-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(30,144,255,0.13), rgba(30,144,255,0.27));
    border: 1px solid rgba(30,144,255,0.27);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    font-size: 24px;
  }

  .reset-title {
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 8px;
  }

  .reset-subtitle {
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    font-size: 14px;
    margin-bottom: 32px;
  }

  .reset-label {
    display: block;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .reset-input-wrapper {
    position: relative;
    width: 100%;
  }

  .reset-input {
    width: 100%;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(59, 158, 255, 0.3);
    border-radius: 12px;
    padding: 14px 48px 14px 16px;
    color: #ffffff;
    outline: none;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .reset-input:focus {
    background-color: rgba(255, 255, 255, 0.07);
    border-color: #1e90ff;
    box-shadow: 0 0 0 4px rgba(30, 144, 255, 0.15);
  }

  .reset-input::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }

  .reset-eye-button {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    padding: 0;
    transition: color 0.2s ease;
  }

  .reset-eye-button:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  /* ── OTP inputs ── */
  .otp-group {
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
  }

  .otp-input {
    width: 40px;
    height: 50px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid #333333;
    border-radius: 8px;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    outline: none;
    transition: all 0.2s ease;
  }

  .otp-input:focus {
    border-color: #1e90ff;
    background-color: rgba(30, 144, 255, 0.1);
    box-shadow: 0 0 8px rgba(30, 144, 255, 0.4);
    transform: translateY(-1px);
  }

  .otp-separator {
    color: #1e90ff;
    font-size: 18px;
    font-weight: 700;
  }

  /* ── Botón ── */
  .reset-button {
    width: 100%;
    background-color: #1e90ff;
    color: #ffffff;
    font-weight: 700;
    padding: 16px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-size: 15px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }

  .reset-button:hover {
    background-color: #1478e0;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(30, 144, 255, 0.4);
  }

  .reset-button:disabled {
    background-color: #333;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .reset-error {
    color: #f87171;
    font-size: 13px;
    margin-bottom: 16px;
    text-align: center;
  }

  .reset-success-title {
    color: #22c55e;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 8px;
  }

  .reset-success-text {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    text-align: center;
  }

  .reset-invalid-error {
    color: #f87171;
    font-size: 14px;
    text-align: center;
    margin-bottom: 20px;
  }

  .reset-back-link {
    display: block;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
    margin-top: 24px;
    text-decoration: none;
    transition: color 0.2s;
  }

  .reset-back-link:hover {
    color: #ffffff;
  }

  .reset-new-link {
    color: #1e90ff;
    font-size: 14px;
    text-decoration: none;
  }

  .reset-new-link:hover {
    text-decoration: underline;
  }

  .input-group {
    margin-bottom: 20px;
  }
`;