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
};

export default nextConfig;
