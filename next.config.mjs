/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Use an empty turbopack config to acknowledge we're using webpack
  // WASM support requires webpack's asyncWebAssembly experiment
  turbopack: {},

  // Enable WebAssembly support (requires webpack)
  webpack: (config, { isServer }) => {
    // Enable WASM experiments
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Fix for WASM in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Add WASM file handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

export default nextConfig;
