// Static export so the app deploys to GitHub Pages next to the landing page.
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH (e.g. /Car-stuff/app); locally it's empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
