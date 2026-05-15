import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'verify-2fa' | 'new-password' | 'done' | 'invalid';

export const useResetPassword = () => {
  const [step, setStep]                       = useState<Step>('verify-2fa');
  const [code, setCode]                       = useState(['', '', '', '', '', '']);
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [token, setToken]                     = useState('');
  const [refreshToken, setRefreshToken]       = useState('');
  const router = useRouter();

  // Leer tokens del hash de la URL
  useEffect(() => {
    const hash   = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    const refresh     = params.get('refresh_token');
    const type        = params.get('type');

    if (!accessToken || type !== 'recovery') {
      setStep('invalid');
      setError('Enlace inválido o expirado. Solicita uno nuevo.');
      return;
    }

    setToken(accessToken);
    setRefreshToken(refresh ?? '');
  }, []);

  // ── Paso 1: verificar código 2FA ─────────────────────────────
  const handleInputChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`otp-reset-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`otp-reset-${index - 1}`)?.focus();
    }
  };

  const handleVerify2FA = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/password/verify-2fa', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code:          fullCode,
          refresh_token: refreshToken,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError('Código incorrecto o expirado.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('otp-reset-0')?.focus();
        return;
      }

      // Guardar el token AAL2 para el siguiente paso
      if (data.access_token) setToken(data.access_token);
      setStep('new-password');

    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: actualizar contraseña ────────────────────────────
  const handleUpdatePassword = async () => {
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password/reset', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password, refresh_token: refreshToken }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message ?? 'Error al actualizar la contraseña');
        return;
      }

      setStep('done');
      setTimeout(() => router.push('/login'), 3000);

    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    code, handleInputChange, handleKeyDown, handleVerify2FA,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, error,
    showPassword, setShowPassword,
    handleUpdatePassword,
  };
};