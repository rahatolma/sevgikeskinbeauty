'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const password = formData.get('password');
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validPassword) {
    return { error: 'Sistem hatası: Admin şifresi ayarlanmamış.' };
  }

  if (password === validPassword) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 hafta
      path: '/',
    });
    
    redirect('/yonetim');
  } else {
    return { error: 'Hatalı şifre.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/yonetim-giris');
}
