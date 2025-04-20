/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ignore Deno URL imports during build
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /supabase\/functions\/.+\.ts$/,
          use: "null-loader",
          include: /node_modules/,
        },
      ],
    }

    // Add null-loader for Deno URL imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "https://deno.land/": false,
      "https://esm.sh/": false,
    }

    return config
  },
}

module.exports = nextConfig
