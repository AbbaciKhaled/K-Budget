import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's on-disk build cache snapshots env values (incl. AUTH_SECRET) into
    // .next/cache. CI hosts like Netlify start from a fresh clone and secret-scan the
    // build directory, so the cache brings no speed-up and fails the scan. Dev cache stays on.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
