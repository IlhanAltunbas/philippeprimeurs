import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_FILE_PATHS = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts'
]

const PUBLIC_API_PATHS = [
  '/api/init',
  '/api/public',
  '/api/admin/login',
  '/api/products',
  '/api/featured-products',
  '/api/admin/migrate'
]

const PUBLIC_PAGE_PATHS = [
  '/',
  '/about',
  '/products',
  '/cart',
  '/contact',
  '/admin/login'
]

// Veritabanı güncelleme işleminin yapılıp yapılmadığını kontrol etmek için bir değişken
let dbMigrationAttempted = false

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('Middleware - Path:', pathname)

  // PUBLIC_API_PATHS kontrolü için detaylı log ekleyelim
  if (PUBLIC_API_PATHS.some(path => pathname.startsWith(path))) {
    console.log(`Middleware - Public API path kontrolü başarılı: ${pathname}`)
    return NextResponse.next()
  }

  // Eğer daha önce veritabanı güncelleme işlemi yapılmadıysa ve admin sayfasına erişiliyorsa
  if (!dbMigrationAttempted && pathname.startsWith('/admin')) {
    dbMigrationAttempted = true
    
    try {
      // Veritabanı güncelleme API'sini çağır
      const migrationResponse = await fetch(`${request.nextUrl.origin}/api/admin/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (migrationResponse.ok) {
        console.log('Veritabanı otomatik olarak güncellendi')
        const result = await migrationResponse.json()
        console.log('Güncelleme sonucu:', result)
      } else {
        console.error('Veritabanı otomatik güncelleme hatası:', await migrationResponse.text())
      }
    } catch (error) {
      console.error('Veritabanı otomatik güncelleme hatası:', error)
    }
  }

  // Statik dosyalar ve public API'ler için kontrol yapma
  if (PUBLIC_FILE_PATHS.some(path => pathname.startsWith(path)) ||
      PUBLIC_PAGE_PATHS.includes(pathname)) {
    console.log('Middleware - Public path, skipping auth check')
    return NextResponse.next()
  }

  // Admin API'leri için token kontrolü
  if (pathname.startsWith('/api/admin')) {
    // Önce cookie'den token'ı kontrol et
    const cookieToken = request.cookies.get('auth-token')?.value
    
    // Sonra Authorization header'dan token'ı kontrol et
    const headerToken = request.headers.get('authorization')?.split(' ')[1]
    
    // Herhangi bir token varsa devam et
    const token = cookieToken || headerToken
    
    console.log('Middleware - API token:', token ? 'exists' : 'missing')

    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // Admin sayfaları için cookie kontrolü
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value
    console.log('Middleware - Cookie token:', token ? 'exists' : 'missing')

    if (!token) {
      const url = new URL('/admin/login', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
} 