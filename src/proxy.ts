import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Sadece /admin ile başlayan rotaları koru, ama /admin-login sayfasını hariç tut
  if (pathname.startsWith('/yonetim') && !pathname.startsWith('/yonetim-giris')) {
    const adminToken = request.cookies.get('admin_token');
    
    if (!adminToken || adminToken.value !== 'true') {
      const url = request.nextUrl.clone();
      url.pathname = '/yonetim-giris';
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/yonetim/:path*'],
};
