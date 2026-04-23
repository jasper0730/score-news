import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [],
        domains: [],
        unoptimized: true,
        // remotePatterns: [
        //   {
        //     protocol: 'https',
        //     hostname: 'picsum.photos',
        //   },
        // ],
    },
}

export default nextConfig
