/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/webp'],
  },
  experimental: {
    // Server-only packages that must not be bundled for the browser.
    // Playwright + Cheerio run inside /api routes only — never on the client.
    // (Renamed to `serverExternalPackages` at top level in Next 15.)
    serverComponentsExternalPackages: [
      'playwright',
      'playwright-extra',
      'puppeteer-extra-plugin-stealth',
      'cheerio',
      'email-existence',
    ],
  },
};

module.exports = nextConfig;
