/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.ticimax.cloud" },
      { protocol: "https", hostname: "www.toligames.com" },
    ],
  },
};

export default nextConfig;
