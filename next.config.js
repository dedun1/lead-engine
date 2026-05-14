/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server-only packages that must not be bundled for the browser.
  // Playwright + Cheerio run inside /api routes only — never on the client.
  serverExternalPackages: [
    'playwright',
    'playwright-extra',
    'puppeteer-extra-plugin-stealth',
    'cheerio',
    'email-existence',
  ],
};

module.exports = nextConfig;
