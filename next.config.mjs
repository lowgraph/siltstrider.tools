/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  ...(process.env.SILT_STATIC_EXPORT === '1' ? { output: 'export', distDir: '.next-export' } : {})
};
export default config;
