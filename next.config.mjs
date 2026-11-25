/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Document uploads are capped at 4 MB in the app, which also fits Vercel's request limit.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};
