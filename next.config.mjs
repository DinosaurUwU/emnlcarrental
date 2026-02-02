/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile all packages that use modern JavaScript features
  transpilePackages: ['undici', 'firebase', '@firebase/auth', '@firebase/firestore'],
  
  // Empty turbopack config to silence the warning
  turbopack: {},
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
