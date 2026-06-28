import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  output: "standalone",
  trustHost: true,
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  experimental: {
    // Reserva margem para o envelope multipart de um arquivo de ate 200 MB.
    proxyClientMaxBodySize: "210mb",
  },
};

export default nextConfig;
