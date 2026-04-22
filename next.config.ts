import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Modular imports reduce the JS sent to the browser. `lucide-react` alone
  // ships ~1500 icons; with this flag Next imports only the ones used.
  experimental: {
    optimizePackageImports: ['lucide-react', '@base-ui/react'],
  },
  // Let the browser cache static JS/CSS aggressively; HTML stays short-lived
  // so redeploys propagate quickly.
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
