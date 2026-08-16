const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const pub = path.join(__dirname, "..", "public");
const icons = path.join(pub, "icons");
fs.mkdirSync(icons, { recursive: true });
const src = path.join(pub, "elloot-coruja.png");

async function makeIcon(size, out, pad = 0.14) {
  const inner = Math.round(size * (1 - pad * 2));
  const owl = await sharp(src)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const rx = Math.round(size * 0.22);
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0B1220"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
      <rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${rx}"
        fill="none" stroke="#3B82F6" stroke-opacity="0.35" stroke-width="2"/>
    </svg>`,
  );

  await sharp(svg)
    .composite([{ input: owl, gravity: "centre" }])
    .png()
    .toFile(path.join(icons, out));
};

async function makeBadge(size, out) {
  const owl = await sharp(src)
    .resize(Math.round(size * 0.78), Math.round(size * 0.78), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = owl;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 20) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    } else {
      data[i + 3] = 0;
    }
  }

  const whiteOwl = await sharp(data, { raw: info }).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: whiteOwl, gravity: "centre" }])
    .png()
    .toFile(path.join(icons, out));
};

async function makeBanner() {
  const bannerW = 1200;
  const bannerH = 600;
  const owlBig = await sharp(src)
    .resize(280, 280, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const bannerSvg = Buffer.from(
    `<svg width="${bannerW}" height="${bannerH}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0B1220"/>
          <stop offset="55%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.45"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="980" cy="120" r="220" fill="#3B82F6" fill-opacity="0.12"/>
      <circle cx="200" cy="520" r="180" fill="#2563EB" fill-opacity="0.10"/>
      <text x="80" y="310" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="700" fill="#F8FAFC">Elloot</text>
      <text x="80" y="380" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#93C5FD">Marketplace com escrow</text>
    </svg>`,
  );

  await sharp(bannerSvg)
    .composite([{ input: owlBig, left: 860, top: 160 }])
    .png()
    .toFile(path.join(icons, "notification-banner.png"));
};

(async () => {
  await makeIcon(192, "notification-192.png");
  await makeIcon(512, "notification-512.png");
  await makeBadge(96, "notification-badge.png");
  await makeBanner();
  console.log("ok", fs.readdirSync(icons));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});