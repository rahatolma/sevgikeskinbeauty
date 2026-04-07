import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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
  
  // 2. Bakım Modu Koruması
  // Eğer MAINTENANCE_MODE aktif ise ve admin sayfalarında değilsek
  if (
    process.env.MAINTENANCE_MODE === 'true' && 
    !pathname.startsWith('/yonetim') && 
    !pathname.startsWith('/yonetim-giris') &&
    pathname !== '/bakim'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/bakim';
    // Kullanıcıya URL değişmeden sadece sayfa gösterilsin diye rewrite yapıyoruz
    return NextResponse.rewrite(url); 
  }

  // Eğer bakım kapalıyken /bakim'a direkt erişilmek istenirse ana sayfaya gönder
  if (pathname === '/bakim' && process.env.MAINTENANCE_MODE !== 'true') {
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
