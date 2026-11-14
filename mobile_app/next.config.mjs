/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ✅ REQUIRED for Docker
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" }, // for uploaded post images
    ],
  },
  // Lower peak memory during `next build` so small VPSes don't run out of RAM:
  // one compile worker at a time, no extra parallel compiles/trace workers.
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackMemoryOptimizations: true,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
  },
};

export default nextConfig;
