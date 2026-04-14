import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Yönetim Paneli Koruması
  if (pathname.startsWith('/yonetim') && !pathname.startsWith('/yonetim-giris')) {
    const adminToken = request.cookies.get('admin_token');
    
    if (!adminToken || adminToken.value !== 'true') {
      const url = request.nextUrl.clone();
      url.pathname = '/yonetim-giris';
      return NextResponse.redirect(url);
    }
  }
  
  // process.env.MAINTENANCE_MODE değişkenine göre bakım modunu yönet
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  // 2. Bakım Modu Koruması
  if (
    isMaintenanceMode && 
    !pathname.startsWith('/yonetim') && 
    !pathname.startsWith('/yonetim-giris') &&
    pathname !== '/bakim'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/bakim';
    return NextResponse.rewrite(url); 
  }

  // Eğer bakım kapalıyken (localhostta) /bakim'a direkt erişilmek istenirse ana sayfaya gönder
  if (pathname === '/bakim' && !isMaintenanceMode) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  // api, statik dosyalar ve resim formatlarını middleware dışında bırakıyoruz
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
