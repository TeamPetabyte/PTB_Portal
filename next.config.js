/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone = build เล็ก เหมาะกับ Docker / Google Cloud Run
  output: "standalone",
  // ปิดปุ่ม Next.js dev tools (วงกลม N มุมจอ) ตอนรัน dev
  devIndicators: false,
};

module.exports = nextConfig;
