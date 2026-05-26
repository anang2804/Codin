/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  swcMinify: true,
  compress: true,
  outputFileTracingExcludes: {
    "**": ["node_modules/@esbuild/**", "node_modules/esbuild/**"],
  },
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.optimization.usedExports = false;
      config.optimization.minimize = false;
    }
    return config;
  },
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-button",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
    ],
    optimizeFonts: true,
  },
};

export default nextConfig;
