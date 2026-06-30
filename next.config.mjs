/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // mongoose uses some Node built-ins; keep it server-only
    serverComponentsExternalPackages: ["mongoose", "bcryptjs"],
  },
};

export default nextConfig;
