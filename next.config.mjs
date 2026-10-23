import { gatewayRewrites } from "./deployment-config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Keep the complete reference archive in Git without copying development
  // inputs into production server functions.
  outputFileTracingExcludes: {
    "/*": ["./bighaat_products/**/*", "./app/products/data/reference-overlay.json", "./public/assets/catalog/**/*"],
  },
  async headers() {
    return [{
      source: "/assets/catalog/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }, {
      source: "/admin/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "same-origin" }],
    }, {
      source: "/admin-api/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }, { key: "X-Frame-Options", value: "DENY" }],
    }];
  },
  async rewrites() {
    return { beforeFiles: gatewayRewrites(process.env), afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
