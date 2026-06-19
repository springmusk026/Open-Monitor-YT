import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
