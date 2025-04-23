/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
  
  // Standalone build for API routes
  output: "standalone",
  
  // API route'lar için dinamik davranış
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt']
  },

  // Veritabanı hatalarını yönetmek için timeout değerleri
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 45 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 8,
  },
  
  // CORS ayarları için headers fonksiyonunu buraya ekleyin
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Ya da spesifik domain: 'https://www.yourdomain.com'
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
