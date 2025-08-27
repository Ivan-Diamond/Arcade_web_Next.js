/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'www.ruyuan.live'],
  },
  async rewrites() {
    return [
      // Proxy WebRTC signaling for local development
      {
        source: '/rtc/v1/play/',
        destination: 'http://46.101.131.181:1985/rtc/v1/play/',
      },
      {
        source: '/rtc/v1/play2/',
        destination: 'http://143.198.36.23:1985/rtc/v1/play/',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
    API_BASE_URL: process.env.API_BASE_URL || 'https://www.ruyuan.live/game',
    WS_URL: process.env.WS_URL || 'ws://206.81.25.143:59199/ws',
  },
}

module.exports = nextConfig
