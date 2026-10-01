/** @type {import('next').NextConfig} */
// SILT_EXPORT_DIR lets the local test site (scripts/local-stack.cjs) build into its own
// folder, so a build made with the Clerk development key never sits where a deploy looks.
const config = {
  reactStrictMode: false,
  ...(process.env.SILT_STATIC_EXPORT === '1' ? { output: 'export', distDir: process.env.SILT_EXPORT_DIR || '.next-export' } : {})
};
export default config;
