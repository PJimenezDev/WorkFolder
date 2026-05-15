import css from 'styled-jsx/css';

export const forgotPasswordStyles = css`
  .forgot-root {
    min-height: 100vh;
    background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('/background.png');
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Segoe UI", system-ui, sans-serif;
  }

  .forgot-wrapper {
    width: 100%;
    max-width: 480px;
    padding: 0 24px;
  }

  .forgot-card {
    background-color: rgba(23, 23, 23, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  }

  .forgot-icon {
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

  .forgot-title {
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 8px;
  }

  .forgot-subtitle {
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    font-size: 14px;
    margin-bottom: 32px;
    line-height: 1.5;
  }

  .forgot-label {
    display: block;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .forgot-input {
    width: 100%;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(59, 158, 255, 0.3);
    border-radius: 12px;
    padding: 14px 16px;
    color: #ffffff;
    outline: none;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .forgot-input:focus {
    background-color: rgba(255, 255, 255, 0.07);
    border-color: #1e90ff;
    box-shadow: 0 0 0 4px rgba(30, 144, 255, 0.15);
  }

  .forgot-input::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }

  .forgot-button {
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

  .forgot-button:hover {
    background-color: #1478e0;
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(30, 144, 255, 0.4);
  }

  .forgot-button:disabled {
    background-color: #333;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .forgot-error {
    color: #f87171;
    font-size: 13px;
    margin-bottom: 16px;
    text-align: center;
  }

  .forgot-success-icon {
    font-size: 48px;
    text-align: center;
    margin-bottom: 16px;
  }

  .forgot-success-title {
    color: #22c55e;
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 8px;
  }

  .forgot-success-text {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    text-align: center;
    line-height: 1.6;
  }

  .forgot-back-link {
    display: block;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
    margin-top: 24px;
    text-decoration: none;
    transition: color 0.2s;
  }

  .forgot-back-link:hover {
    color: #ffffff;
  }

  .input-group {
    margin-bottom: 20px;
  }
`;