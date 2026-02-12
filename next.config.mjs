/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimasi untuk faster startup
  reactStrictMode: true,
  swcMinify: true,
  // Faster refresh di development
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons"],
  },
}

export default nextConfig
