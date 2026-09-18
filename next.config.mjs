/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  ...(process.env.SILT_STATIC_EXPORT === '1' ? { output: 'export', distDir: '.next-export' } : {
    async redirects() { return [{ source: '/index.html', destination: '/', permanent: false }]; }
  })
};
export default config;
