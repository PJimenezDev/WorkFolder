import { useState } from 'react';

export const useForgotPassword = () => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/password/forgot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message ?? 'Error al enviar el email');
        return;
      }
      setSent(true);

    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, loading, sent, error, handleSubmit };
};