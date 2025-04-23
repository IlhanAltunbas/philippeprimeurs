/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    unoptimized: false,
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  reactStrictMode: true,
  
  // Standalone build - API rotaları, sunucu bileşenleri ve veritabanı bağlantıları için
  output: "standalone",
  
  // Statik ve dinamik içeriği yönetmek için 
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    outputFileTracingExcludes: {
      '/api/**': ['**/*.db'],
    },
    optimizeFonts: true,
    webVitalsAttribution: ['FCP', 'LCP', 'CLS', 'FID']
  },

  // Veritabanı hatalarını yönetmek için timeout değerleri
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 45 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 8,
  },
  
  // Type checking only in development
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // Performans optimizasyonları
  swcMinify: true,
  compress: true,
  
  // JavaScript dosyalarını sıkıştırma
  webpack: (config, { dev, isServer }) => {
    // Production build'de optimizasyonlar
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 70000,
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          // Framer-motion kütüphanesini ayrı bir chunk'ta topla
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
  },

  compiler: {
    // StyledComponents, Emotion vb. kütüphaneleri optimize et
    removeConsole: process.env.NODE_ENV === 'production', // Üretim modunda konsolları temizle
  },
}

export default nextConfig; 