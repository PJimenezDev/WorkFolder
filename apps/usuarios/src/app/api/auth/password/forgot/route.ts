import { NextRequest } from 'next/server';
import { supabase } from '@/services/supabase';
import { ok, err, OPTIONS } from '@/lib/response';

export { OPTIONS };

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return err('Email es requerido');

    const redirectTo = `${process.env.FRONTEND_URL}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) return err('Error al enviar email: ' + error.message);

    // Siempre respondemos éxito por seguridad
    return ok({ message: 'Si el email existe, recibirás un enlace de recuperación' });

  } catch (e) {
    return err('Error interno del servidor', 500);
  }
}