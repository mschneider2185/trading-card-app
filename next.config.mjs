/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.pokemontcg.io'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig 