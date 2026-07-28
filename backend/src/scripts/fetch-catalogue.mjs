/**
 * Builds the seed catalogue from real-world sources.
 *
 *   Apple / Samsung  -> curated product records paired with Wikimedia Commons photography
 *   boAt / Noise     -> live product feeds from the brands' own Shopify storefronts
 *
 * Every image is downloaded into `backend/public/images/products` so the running
 * application serves its own assets instead of hotlinking third parties, and so
 * seeding works with no network access once this has been run.
 *
 * Usage:  npm run catalogue:fetch
 */

import { mkdir, writeFile, readdir, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const IMAGE_DIR = path.resolve(HERE, '../../public/images/products')
const OUTPUT = path.resolve(HERE, '../seed/catalogue.json')
const PUBLIC_PATH = '/images/products'

const USER_AGENT =
  'nova-commerce-catalogue/1.0 (educational demo project; contact: dev@nova.local)'

const INR_PER_USD = 83
const FORCE = process.argv.includes('--force')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Files already on disk, so a re-run does not re-download the whole catalogue. */
let existingFiles = new Map()

async function indexExistingImages() {
  try {
    const entries = await readdir(IMAGE_DIR)
    existingFiles = new Map(
      entries.map((entry) => [entry.replace(path.extname(entry), ''), entry]),
    )
  } catch {
    existingFiles = new Map()
  }
}

/* ------------------------------------------------------------------ helpers */

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Rounds a converted price to a retail-looking figure. */
function toUsd(inr) {
  const raw = Number(inr) / INR_PER_USD
  if (raw < 20) return Math.round(raw) + 0.99
  if (raw < 100) return Math.round(raw / 5) * 5 - 0.01
  return Math.round(raw / 10) * 10 - 0.01
}

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
}

async function downloadImage(url, baseName) {
  const cached = existingFiles.get(baseName)
  if (cached && !FORCE) {
    const info = await stat(path.join(IMAGE_DIR, cached))
    return {
      fileName: cached,
      publicUrl: `${PUBLIC_PATH}/${cached}`,
      bytes: info.size,
      contentType: 'cached',
      reused: true,
    }
  }

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)

  const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim()
  const extension = EXTENSIONS[contentType] ?? path.extname(new URL(url).pathname) ?? '.jpg'
  const fileName = `${baseName}${extension}`

  await pipeline(
    Readable.fromWeb(response.body),
    createWriteStream(path.join(IMAGE_DIR, fileName)),
  )

  const bytes = Number(response.headers.get('content-length') ?? 0)
  return { fileName, publicUrl: `${PUBLIC_PATH}/${fileName}`, bytes, contentType }
}

/* ------------------------------------------------- Wikimedia-backed products */

/**
 * Curated Apple and Samsung records. `wikiPage` is resolved through the
 * Wikipedia summary API, which returns a Commons-hosted product photograph.
 */
const CURATED = [
  {
    wikiPage: 'IPhone_15_Pro',
    name: 'Apple iPhone 15 Pro',
    brand: 'Apple',
    category: 'smartphones',
    price: 999,
    compareAtPrice: 1099,
    rating: 4.8,
    reviewCount: 4218,
    stock: 42,
    tags: ['bestseller', 'featured'],
    colors: ['Natural Titanium', 'Blue Titanium', 'Black Titanium', 'White Titanium'],
    shortDescription:
      'Titanium-framed flagship with the A17 Pro chip, a 5x telephoto camera and USB-C.',
    description:
      'The iPhone 15 Pro moves to a grade 5 titanium frame, cutting weight noticeably without giving up rigidity. The A17 Pro brings hardware ray tracing to the platform, the customisable Action button replaces the old mute switch, and the port is finally USB-C at USB 3 speeds for fast transfers off the 48MP main sensor.',
    highlights: [
      'A17 Pro chip with hardware-accelerated ray tracing',
      '48MP main camera with 5x telephoto on the Pro Max',
      'Grade 5 titanium frame with Ceramic Shield front',
      'USB-C with USB 3 transfer speeds',
    ],
    specs: {
      Display: '6.1" Super Retina XDR OLED, 120Hz ProMotion',
      Chip: 'A17 Pro, 6-core CPU, 6-core GPU',
      Camera: '48MP main, 12MP ultrawide, 12MP telephoto',
      Storage: '128GB / 256GB / 512GB / 1TB',
      Build: 'Titanium frame, IP68 water resistance',
      Battery: 'Up to 23 hours video playback',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'IPhone_15',
    name: 'Apple iPhone 15',
    brand: 'Apple',
    category: 'smartphones',
    price: 799,
    compareAtPrice: 899,
    rating: 4.7,
    reviewCount: 3106,
    stock: 88,
    tags: ['bestseller'],
    colors: ['Blue', 'Pink', 'Yellow', 'Green', 'Black'],
    shortDescription:
      'Dynamic Island, a 48MP main camera and USB-C in the standard iPhone for the first time.',
    description:
      'The iPhone 15 inherits the Dynamic Island and the 48MP main sensor from the previous Pro generation, which means 2x optical-quality zoom by cropping into the sensor. The colour-infused back glass has a soft matte finish, and the switch to USB-C means one cable for phone, iPad and Mac.',
    highlights: [
      'Dynamic Island replaces the notch',
      '48MP main camera with 2x telephoto crop',
      'USB-C charging and accessory support',
      'A16 Bionic chip',
    ],
    specs: {
      Display: '6.1" Super Retina XDR OLED, 60Hz',
      Chip: 'A16 Bionic',
      Camera: '48MP main, 12MP ultrawide',
      Storage: '128GB / 256GB / 512GB',
      Build: 'Aluminium frame, IP68',
      Battery: 'Up to 20 hours video playback',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'MacBook_Air',
    name: 'Apple MacBook Air 15" (M3)',
    brand: 'Apple',
    category: 'laptops',
    price: 1299,
    compareAtPrice: 1499,
    rating: 4.9,
    reviewCount: 1874,
    stock: 24,
    tags: ['bestseller', 'featured'],
    colors: ['Midnight', 'Starlight', 'Space Grey', 'Silver'],
    shortDescription:
      'A fanless 15-inch laptop that runs silent under load and still lasts a full working day.',
    description:
      'The 15-inch Air is the machine most people should buy. There is no fan, so it is completely silent no matter what you throw at it, and the M3 handles photo editing, large spreadsheets and a dozen browser tabs without breaking a sweat. The 1.51kg chassis is thin enough to forget in a bag.',
    highlights: [
      'M3 chip with 8-core CPU and 10-core GPU',
      'Completely fanless — zero noise under load',
      'Up to 18 hours of battery life',
      '15.3" Liquid Retina display, 500 nits',
    ],
    specs: {
      Display: '15.3" Liquid Retina, 2880x1864, 500 nits',
      Chip: 'Apple M3, 8-core CPU, 10-core GPU',
      Memory: '8GB / 16GB / 24GB unified memory',
      Storage: '256GB / 512GB / 1TB / 2TB SSD',
      Ports: '2x Thunderbolt / USB 4, MagSafe 3, 3.5mm',
      Weight: '1.51 kg',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'MacBook_Pro',
    name: 'Apple MacBook Pro 16" (M3 Pro)',
    brand: 'Apple',
    category: 'laptops',
    price: 2499,
    compareAtPrice: 2699,
    rating: 4.9,
    reviewCount: 962,
    stock: 11,
    tags: ['featured'],
    colors: ['Space Black', 'Silver'],
    shortDescription:
      'Mini-LED XDR display, full port selection and enough sustained performance for real production work.',
    description:
      'Where the Air throttles under long exports, the 16-inch Pro holds its clocks. The XDR mini-LED panel hits 1600 nits peak for HDR grading, and the port selection — HDMI, SD, three Thunderbolt and MagSafe — means the dock stays at home. Battery life stays respectable even with the discrete-class GPU working.',
    highlights: [
      'M3 Pro with up to 18-core GPU',
      'Liquid Retina XDR mini-LED, 1600 nits peak HDR',
      'HDMI 2.1, SDXC and 3x Thunderbolt 4',
      'Up to 22 hours battery life',
    ],
    specs: {
      Display: '16.2" Liquid Retina XDR, 120Hz ProMotion',
      Chip: 'Apple M3 Pro, 12-core CPU, 18-core GPU',
      Memory: '18GB / 36GB unified memory',
      Storage: '512GB - 4TB SSD',
      Ports: '3x Thunderbolt 4, HDMI, SDXC, MagSafe 3, 3.5mm',
      Weight: '2.14 kg',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'IPad_Pro',
    name: 'Apple iPad Pro 12.9"',
    brand: 'Apple',
    category: 'tablets',
    price: 1099,
    compareAtPrice: 1199,
    rating: 4.8,
    reviewCount: 1420,
    stock: 30,
    tags: ['featured'],
    colors: ['Space Grey', 'Silver'],
    shortDescription:
      'A tandem-OLED tablet that doubles as a drawing surface, a reference monitor and a laptop.',
    description:
      'The 12.9-inch Pro is the closest a tablet gets to replacing a laptop. Paired with the Magic Keyboard it handles a full day of writing and email, and with the Apple Pencil it becomes a genuinely pressure-sensitive drawing surface. The display is bright and accurate enough to grade footage on.',
    highlights: [
      'Ultra Retina XDR display with ProMotion',
      'Apple Pencil Pro support with squeeze and roll',
      'Thunderbolt port for external displays and drives',
      'Face ID and quad-speaker audio',
    ],
    specs: {
      Display: '12.9" Ultra Retina XDR, 120Hz',
      Chip: 'Apple M-series',
      Camera: '12MP wide, 10MP ultrawide, LiDAR',
      Storage: '256GB - 2TB',
      Connectivity: 'Wi-Fi 6E, optional 5G, Thunderbolt',
      Weight: '682 g',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'IPad_Air',
    name: 'Apple iPad Air',
    brand: 'Apple',
    category: 'tablets',
    price: 599,
    compareAtPrice: 699,
    rating: 4.7,
    reviewCount: 2233,
    stock: 64,
    tags: ['bestseller'],
    colors: ['Blue', 'Purple', 'Starlight', 'Space Grey'],
    shortDescription:
      'The sweet spot in the iPad range — laminated display, Pencil support, half the Pro price.',
    description:
      'For everything short of professional colour work, the Air does what the Pro does. The display is laminated so the Pencil feels like it is drawing on the glass rather than under it, Touch ID lives in the power button, and it drives the same keyboard cases.',
    highlights: [
      'Laminated Liquid Retina display',
      'Apple Pencil and Magic Keyboard support',
      'Touch ID in the top button',
      'USB-C with fast charging',
    ],
    specs: {
      Display: '11" Liquid Retina, 2360x1640',
      Chip: 'Apple M-series',
      Camera: '12MP wide rear, 12MP ultrawide front',
      Storage: '128GB / 256GB / 512GB / 1TB',
      Connectivity: 'Wi-Fi 6E, optional 5G',
      Weight: '462 g',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'AirPods_Pro',
    name: 'Apple AirPods Pro (2nd gen)',
    brand: 'Apple',
    category: 'audio',
    price: 249,
    compareAtPrice: 279,
    rating: 4.7,
    reviewCount: 8940,
    stock: 150,
    tags: ['bestseller', 'featured'],
    colors: ['White'],
    shortDescription:
      'Best-in-class noise cancelling in an earbud, with Adaptive Audio that adjusts as you move.',
    description:
      'The second-generation Pro roughly doubled the cancellation of the original, and Adaptive Audio blends transparency and ANC on the fly so you can hear an announcement without pulling a bud out. The stem now takes a swipe for volume, and the case has a speaker and lanyard loop.',
    highlights: [
      'Adaptive Audio blends ANC and transparency live',
      'Personalised Spatial Audio with head tracking',
      'Touch stem volume control',
      'Up to 6 hours ANC playback, 30 hours with case',
    ],
    specs: {
      Driver: 'Custom high-excursion Apple driver',
      Chip: 'Apple H2',
      Battery: '6 h per charge, 30 h total with case',
      'Water resistance': 'IP54 buds and case',
      Case: 'MagSafe, USB-C, Precision Finding',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'AirPods_Max',
    name: 'Apple AirPods Max',
    brand: 'Apple',
    category: 'audio',
    price: 549,
    compareAtPrice: 0,
    rating: 4.6,
    reviewCount: 3121,
    stock: 18,
    tags: [],
    colors: ['Space Grey', 'Silver', 'Midnight', 'Starlight'],
    shortDescription:
      'Over-ear cans built from anodised aluminium and stainless steel, with computational audio.',
    description:
      'The Max are unapologetically heavy, and the materials are the reason — anodised aluminium cups, a stainless steel headband, and a breathable knit mesh canopy that spreads the weight across the crown. Nine microphones drive cancellation that holds up on a plane, and the tuning is neutral rather than bass-forward.',
    highlights: [
      'Nine microphones, eight dedicated to ANC',
      'Computational audio with Adaptive EQ',
      'Personalised Spatial Audio with dynamic head tracking',
      '20 hours of listening with ANC on',
    ],
    specs: {
      Drivers: '40mm Apple-designed dynamic drivers',
      Chip: 'Apple H1 in each cup',
      Battery: 'Up to 20 hours with ANC and Spatial Audio',
      Controls: 'Digital Crown and noise control button',
      Weight: '384.8 g',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'Apple_Watch_Series_9',
    name: 'Apple Watch Series 10',
    brand: 'Apple',
    category: 'wearables',
    price: 399,
    compareAtPrice: 429,
    rating: 4.8,
    reviewCount: 5602,
    stock: 72,
    tags: ['bestseller', 'new'],
    colors: ['Jet Black', 'Rose Gold', 'Silver', 'Natural Titanium'],
    shortDescription:
      'The thinnest Apple Watch yet, with a wide-angle OLED that stays readable off-axis.',
    description:
      'Series 10 is meaningfully thinner than the watch it replaces while growing the display, and the wide-angle OLED means you can read it with a glance rather than a wrist turn. Sleep apnoea notifications and a faster charge — around 30 minutes to 80% — are the changes you notice day to day.',
    highlights: [
      'Wide-angle OLED, readable off-axis',
      'Sleep apnoea notifications',
      'Fast charge to 80% in about 30 minutes',
      'Water resistant to 50m with depth app',
    ],
    specs: {
      Display: 'Wide-angle OLED Always-On Retina, 2000 nits',
      Chip: 'S10 SiP with 4-core Neural Engine',
      Sensors: 'ECG, blood oxygen, temperature, depth',
      Battery: 'Up to 18 hours, 36 in low power',
      Sizes: '42mm and 46mm',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'Apple_Watch_Ultra',
    name: 'Apple Watch Ultra 2',
    brand: 'Apple',
    category: 'wearables',
    price: 799,
    compareAtPrice: 849,
    rating: 4.9,
    reviewCount: 1988,
    stock: 15,
    tags: ['featured'],
    colors: ['Natural Titanium', 'Black Titanium'],
    shortDescription:
      'Titanium case, 3000-nit display and 36-hour battery for diving, trail running and expeditions.',
    description:
      'The Ultra 2 is built for conditions the standard watch is not rated for — 100m water resistance with a genuine dive computer, an 86-decibel siren, and a precision dual-frequency GPS that holds a track in canyons. The flat sapphire crystal sits proud of the titanium bezel to take knocks.',
    highlights: [
      '3000-nit display, brightest Apple has shipped',
      'Dual-frequency GPS for accurate tracks',
      'Depth gauge and water temperature sensor to 40m',
      '36-hour battery, 72 in low power mode',
    ],
    specs: {
      Display: '49mm flat sapphire Always-On Retina, 3000 nits',
      Case: 'Grade 5 titanium, 100m water resistant',
      Chip: 'S9 SiP with double tap gesture',
      Battery: '36 hours normal, 72 hours low power',
      Extras: '86dB siren, Action button, dive computer',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'HomePod',
    name: 'Apple HomePod (2nd gen)',
    brand: 'Apple',
    category: 'smart-home',
    price: 299,
    compareAtPrice: 0,
    rating: 4.5,
    reviewCount: 1104,
    stock: 26,
    tags: [],
    colors: ['Midnight', 'White'],
    shortDescription:
      'Room-sensing smart speaker with a 4-inch woofer and five beamforming tweeters.',
    description:
      'The HomePod measures the reflections in your room and re-tunes itself, which is why it sounds far larger than it looks. Stereo pair two and it handles a living room properly. Built-in temperature and humidity sensors let it drive home automations without extra hardware.',
    highlights: [
      'Room sensing with automatic re-tuning',
      'Five beamforming tweeters and a 4" woofer',
      'Built-in temperature and humidity sensors',
      'Thread and Matter hub for smart home control',
    ],
    specs: {
      Drivers: '4" high-excursion woofer, 5 tweeters',
      Chip: 'Apple S7',
      Microphones: 'Four-microphone far-field array',
      Connectivity: 'Wi-Fi 4, Bluetooth 5.0, Thread, Matter',
      Height: '168 mm',
      Warranty: '1 year limited warranty',
    },
  },
  {
    wikiPage: 'Samsung_Galaxy_S24',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    category: 'smartphones',
    price: 1199,
    compareAtPrice: 1299,
    rating: 4.8,
    reviewCount: 5240,
    stock: 38,
    tags: ['bestseller', 'featured'],
    colors: ['Titanium Grey', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'],
    shortDescription:
      'Titanium flagship with a built-in S Pen, 5x optical zoom and a flat anti-reflective display.',
    description:
      'The S24 Ultra is the phone to buy if you want reach — the 5x optical periscope plus sensor crop covers most of what you would use a telephoto for. The display went flat this generation with an anti-reflective coating that genuinely helps outdoors, and the S Pen still docks in the body.',
    highlights: [
      'Built-in S Pen with low-latency writing',
      '200MP main sensor with 5x optical periscope',
      'Flat display with anti-reflective coating',
      'Seven years of OS and security updates',
    ],
    specs: {
      Display: '6.8" QHD+ Dynamic AMOLED 2X, 1-120Hz, 2600 nits',
      Processor: 'Snapdragon 8 Gen 3 for Galaxy',
      Camera: '200MP main, 50MP 5x periscope, 10MP 3x, 12MP ultrawide',
      Memory: '12GB RAM, 256GB - 1TB storage',
      Battery: '5000 mAh, 45W wired',
      Build: 'Titanium frame, Gorilla Armor, IP68',
      Warranty: '1 year manufacturer warranty',
    },
  },
  {
    wikiPage: 'Samsung_Galaxy_S23',
    name: 'Samsung Galaxy S23',
    brand: 'Samsung',
    category: 'smartphones',
    price: 699,
    compareAtPrice: 859,
    rating: 4.6,
    reviewCount: 4477,
    stock: 95,
    tags: ['deal'],
    colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'],
    shortDescription:
      'A compact flagship that fits one hand without giving up the flagship processor.',
    description:
      'The regular S23 is the one for people who are tired of 6.7-inch phones. It keeps the top-tier Snapdragon, the same colour science as its bigger siblings, and gained a meaningfully larger battery over the S22 that fixed the previous generation\'s main complaint.',
    highlights: [
      '6.1" display that works one-handed',
      'Snapdragon 8 Gen 2 for Galaxy',
      '50MP main with optical stabilisation',
      'Four generations of OS upgrades',
    ],
    specs: {
      Display: '6.1" FHD+ Dynamic AMOLED 2X, 48-120Hz',
      Processor: 'Snapdragon 8 Gen 2 for Galaxy',
      Camera: '50MP main, 12MP ultrawide, 10MP 3x telephoto',
      Memory: '8GB RAM, 128GB / 256GB storage',
      Battery: '3900 mAh, 25W wired',
      Build: 'Armor Aluminium, Gorilla Glass Victus 2, IP68',
      Warranty: '1 year manufacturer warranty',
    },
  },
  {
    wikiPage: 'Samsung_Galaxy_Z_Flip_5',
    name: 'Samsung Galaxy Z Flip 5',
    brand: 'Samsung',
    category: 'smartphones',
    price: 899,
    compareAtPrice: 999,
    rating: 4.4,
    reviewCount: 2015,
    stock: 21,
    tags: ['deal'],
    colors: ['Mint', 'Graphite', 'Cream', 'Lavender'],
    shortDescription:
      'A folding phone that closes to pocket size, with a cover screen big enough to be useful.',
    description:
      'The Flip 5 finally closes completely flat thanks to the redesigned hinge, and the 3.4-inch cover screen is large enough to reply to messages and frame a selfie without opening the phone. Folded, it genuinely disappears into a small pocket.',
    highlights: [
      '3.4" Flex Window cover display',
      'Flex Hinge closes with no gap',
      'Snapdragon 8 Gen 2 for Galaxy',
      'FlexCam for hands-free angles',
    ],
    specs: {
      Display: '6.7" FHD+ Dynamic AMOLED 2X main, 3.4" cover',
      Processor: 'Snapdragon 8 Gen 2 for Galaxy',
      Camera: '12MP main, 12MP ultrawide, 10MP front',
      Memory: '8GB RAM, 256GB / 512GB storage',
      Battery: '3700 mAh, 25W wired',
      Build: 'Armor Aluminium, IPX8',
      Warranty: '1 year manufacturer warranty',
    },
  },
  {
    wikiPage: 'Samsung_Galaxy_Book',
    name: 'Samsung Galaxy Book Pro 360',
    brand: 'Samsung',
    category: 'laptops',
    price: 1349,
    compareAtPrice: 1549,
    rating: 4.4,
    reviewCount: 486,
    stock: 17,
    tags: ['deal'],
    colors: ['Graphite', 'Silver'],
    shortDescription:
      'A convertible with an AMOLED touchscreen, S Pen support and a 360-degree hinge.',
    description:
      'The Book Pro 360 folds all the way back into a tablet, and the AMOLED panel is the reason to pick it over the competition — blacks are genuinely black, which matters when you are reading documents in a dark room. The included S Pen clips magnetically to the lid.',
    highlights: [
      '360-degree hinge, laptop to tablet',
      'AMOLED touch display with S Pen included',
      'Under 1.4kg with an aluminium chassis',
      'Thunderbolt 4 with fast charging',
    ],
    specs: {
      Display: '15.6" FHD AMOLED touch, 120Hz',
      Processor: 'Intel Core Ultra',
      Memory: '16GB LPDDR5',
      Storage: '512GB / 1TB NVMe SSD',
      Ports: '2x Thunderbolt 4, USB-A, HDMI, microSD',
      Weight: '1.39 kg',
      Warranty: '1 year manufacturer warranty',
    },
  },
  {
    wikiPage: 'Samsung_Galaxy_Tab_S9',
    name: 'Samsung Galaxy Tab S9 Ultra',
    brand: 'Samsung',
    category: 'tablets',
    price: 1149,
    compareAtPrice: 1249,
    rating: 4.6,
    reviewCount: 731,
    stock: 13,
    tags: [],
    colors: ['Graphite', 'Beige'],
    shortDescription:
      'A 14.6-inch AMOLED tablet with an S Pen in the box and a proper desktop mode.',
    description:
      'At 14.6 inches this is closer to a portable monitor than a tablet, which makes it excellent for split-screen work and comically good for films. DeX mode gives you real windowed multitasking, and unusually for a tablet this size it is IP68 rated.',
    highlights: [
      '14.6" Dynamic AMOLED 2X, 120Hz',
      'S Pen included in the box',
      'Samsung DeX windowed desktop mode',
      'IP68 water and dust resistance',
    ],
    specs: {
      Display: '14.6" Dynamic AMOLED 2X, 2960x1848, 120Hz',
      Processor: 'Snapdragon 8 Gen 2 for Galaxy',
      Memory: '12GB RAM, 256GB - 1TB storage',
      Battery: '11200 mAh, 45W charging',
      Audio: 'Quad speakers tuned by AKG',
      Weight: '732 g',
      Warranty: '1 year manufacturer warranty',
    },
  },
  {
    wikiPage: 'Samsung_Galaxy_Buds',
    name: 'Samsung Galaxy Buds3 Pro',
    brand: 'Samsung',
    category: 'audio',
    price: 249,
    compareAtPrice: 279,
    rating: 4.5,
    reviewCount: 3390,
    stock: 110,
    tags: ['bestseller'],
    colors: ['Silver', 'White'],
    shortDescription:
      'Two-way speaker earbuds with adaptive ANC and 24-bit Hi-Fi over a Galaxy phone.',
    description:
      'A dedicated planar tweeter and dynamic woofer in each bud give the Buds3 Pro more separation than a single-driver design manages. Paired with a Galaxy phone they carry 24-bit audio, and adaptive noise control drops cancellation when it hears you start talking.',
    highlights: [
      'Two-way drivers: planar tweeter plus woofer',
      'Adaptive ANC with voice detect',
      '24-bit Hi-Fi audio on Galaxy devices',
      'IP57 water and dust resistance',
    ],
    specs: {
      Drivers: '10.5mm woofer + 6.1mm planar tweeter',
      Battery: '6 h ANC on, 26 h with case',
      Codecs: 'SSC UHQ, AAC, SBC',
      'Water resistance': 'IP57',
      Case: 'USB-C and wireless charging',
      Warranty: '1 year manufacturer warranty',
    },
  },
  {
    wikiPage: 'Samsung_Galaxy_Watch',
    name: 'Samsung Galaxy Watch 6 Classic',
    brand: 'Samsung',
    category: 'wearables',
    price: 399,
    compareAtPrice: 449,
    rating: 4.5,
    reviewCount: 2604,
    stock: 47,
    tags: ['deal'],
    colors: ['Black', 'Silver'],
    shortDescription:
      'The rotating bezel is back — the best way to navigate a watch without smearing the screen.',
    description:
      'The physical rotating bezel is the reason to choose the Classic. Scrolling notifications with a thumb flick beats swiping a small touchscreen, particularly with gloves on. Body composition measurement and a genuinely useful sleep coach round it out.',
    highlights: [
      'Physical rotating bezel navigation',
      'BioActive sensor with body composition',
      'Sleep coaching with snore detection',
      '5ATM plus IP68, MIL-STD-810H tested',
    ],
    specs: {
      Display: '1.5" Super AMOLED sapphire crystal, 2000 nits',
      Processor: 'Exynos W930 dual-core',
      Sensors: 'Optical HR, ECG, BIA, temperature',
      Battery: '425 mAh, up to 40 hours',
      'Water rating': '5ATM + IP68',
      Warranty: '1 year manufacturer warranty',
    },
  },
]

/**
 * Resolves a page's lead image.
 *
 * The `pageimages` action API is tried first because it generates a bounded
 * thumbnail on demand — originals on Commons run to 4000px and several MB.
 * upload.wikimedia.org only serves widths that already exist, so we must never
 * hand-edit the width in a returned URL; the REST summary is the fallback and
 * its URL is used verbatim.
 */
async function resolveWikiImage(page) {
  const thumbEndpoint =
    `https://en.wikipedia.org/w/api.php?action=query&titles=${page}` +
    '&prop=pageimages&pithumbsize=1000&redirects=1&format=json&formatversion=2'

  const thumbResponse = await fetch(thumbEndpoint, { headers: { 'User-Agent': USER_AGENT } })
  if (thumbResponse.ok) {
    const json = await thumbResponse.json()
    const source = json.query?.pages?.[0]?.thumbnail?.source
    if (source) return source
  }

  const summaryResponse = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${page}`,
    { headers: { 'User-Agent': USER_AGENT } },
  )
  if (!summaryResponse.ok) {
    throw new Error(`Wikipedia HTTP ${summaryResponse.status} for ${page}`)
  }
  const summary = await summaryResponse.json()
  const source = summary.originalimage?.source ?? summary.thumbnail?.source
  if (!source) throw new Error(`No lead image on Wikipedia page ${page}`)
  return source
}

/* --------------------------------------------------- Shopify-backed products */

/**
 * Handles picked from each brand's live feed. Titles, prices and imagery come
 * from the storefront; the merchandising fields below are ours.
 */
const SHOPIFY_SOURCES = [
  {
    brand: 'boAt',
    endpoint: 'https://www.boat-lifestyle.com/products.json?limit=250',
    picks: [
      { match: /airdopes\s*(plus\s*)?(141|161|91|311)/i, category: 'audio', tags: ['bestseller'] },
      { match: /rockerz\s*(450|550|558)/i, category: 'audio', tags: [] },
      { match: /stone\s*(350|650|1200|rush)/i, category: 'audio', tags: ['deal'] },
      { match: /wave\s*(call|flex|sigma|pro)/i, category: 'wearables', tags: [] },
      { match: /bassheads/i, category: 'audio', tags: ['deal'] },
      { match: /nirvana/i, category: 'audio', tags: ['featured'] },
      { match: /storm\s*call|lunar/i, category: 'wearables', tags: [] },
    ],
  },
  {
    brand: 'Noise',
    endpoint: 'https://www.gonoise.com/products.json?limit=250',
    picks: [
      { match: /colorfit\s*(pro|ultra|icon)/i, category: 'wearables', tags: ['bestseller'] },
      { match: /buds\s*(vs|combat|xero|connect)/i, category: 'audio', tags: [] },
      { match: /air\s*(clips|buds)/i, category: 'audio', tags: ['new'] },
      { match: /luna\s*ring|noise\s*ring/i, category: 'wearables', tags: ['featured'] },
      { match: /power\s*\d*\s*in\s*1|usb\s*hub/i, category: 'accessories', tags: [] },
      { match: /master\s*buds|nerve/i, category: 'audio', tags: [] },
      { match: /halo|diva|pulse/i, category: 'wearables', tags: ['deal'] },
    ],
  },
]

/**
 * Storefront titles carry marketing and marketplace cruft:
 *   "boAt Airdopes 141 | TWS Earbuds with 42H"     -> "boAt Airdopes 141"
 *   "Noise ColorFit Pro 6 Max - ABHI Marketplace"  -> "Noise ColorFit Pro 6 Max"
 *   "Bassheads 900 C Pro"                          -> "boAt Bassheads 900 C Pro"
 */
function cleanTitle(rawTitle, brand) {
  let name = rawTitle.split('|')[0].trim()

  name = name
    .replace(/\s*[-–]\s*(abhi\s*marketplace|limited\s*edition|super\s*saver|deal|combo).*$/i, '')
    .replace(/\s*[-–]\s*(jet\s*black|black|white|grey|gray|blue|green|beige|silver)\s*$/i, '')
    .replace(/\s+with\s+\1?.*case$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!new RegExp(`^${brand}\\b`, 'i').test(name)) name = `${brand} ${name}`
  return name
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Turns a Shopify option/tag soup into a small, tidy specs table. */
function specsFromShopify(product) {
  const specs = {}
  for (const option of product.options ?? []) {
    if (option.name && option.name.toLowerCase() !== 'title' && option.values?.length) {
      specs[option.name] = option.values.slice(0, 4).join(', ')
    }
  }
  if (product.product_type) specs['Product type'] = product.product_type
  if (product.vendor) specs.Brand = product.vendor
  specs.Warranty = '1 year manufacturer warranty'
  return specs
}

function colorsFromShopify(product) {
  const option = (product.options ?? []).find((entry) => /colou?r/i.test(entry.name ?? ''))
  if (option?.values?.length) return option.values.slice(0, 5)
  const titles = (product.variants ?? [])
    .map((variant) => variant.title)
    .filter((title) => title && title !== 'Default Title')
  return titles.length ? [...new Set(titles)].slice(0, 5) : ['Standard']
}

async function fetchShopify(source) {
  const response = await fetch(source.endpoint, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`${source.brand} feed HTTP ${response.status}`)
  const { products = [] } = await response.json()

  const selected = []
  const used = new Set()

  for (const pick of source.picks) {
    const match = products.find(
      (product) =>
        !used.has(product.id) &&
        pick.match.test(product.title) &&
        product.images?.length > 0 &&
        Number(product.variants?.[0]?.price) > 0 &&
        !/deal|super saver|combo|pack of/i.test(product.title),
    )
    if (!match) continue
    used.add(match.id)
    selected.push({ raw: match, pick })
  }

  return selected
}

/* -------------------------------------------------------------------- runner */

const CATEGORY_META = [
  { id: 'smartphones', name: 'Smartphones', blurb: 'Flagships and foldables', icon: 'smartphone' },
  { id: 'laptops', name: 'Laptops', blurb: 'Ultrabooks and workstations', icon: 'laptop' },
  { id: 'tablets', name: 'Tablets', blurb: 'Slates and 2-in-1s', icon: 'tablet' },
  { id: 'audio', name: 'Audio', blurb: 'Earbuds, headphones, speakers', icon: 'headphones' },
  { id: 'wearables', name: 'Wearables', blurb: 'Smartwatches and bands', icon: 'watch' },
  { id: 'smart-home', name: 'Smart Home', blurb: 'Speakers and hubs', icon: 'lamp' },
  { id: 'accessories', name: 'Accessories', blurb: 'Hubs, cables, chargers', icon: 'router' },
]

const BRAND_META = {
  Apple: { name: 'Apple', origin: 'Cupertino, USA', blurb: 'Premium ecosystem hardware.' },
  Samsung: { name: 'Samsung', origin: 'Suwon, South Korea', blurb: 'Displays, silicon and flagships.' },
  boAt: { name: 'boAt', origin: 'Delhi, India', blurb: 'Affordable audio and wearables.' },
  Noise: { name: 'Noise', origin: 'Gurugram, India', blurb: 'Smartwatches and everyday audio.' },
}

async function main() {
  await mkdir(IMAGE_DIR, { recursive: true })
  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await indexExistingImages()

  if (existingFiles.size > 0) {
    console.log(
      FORCE
        ? `Re-downloading all imagery (--force), ignoring ${existingFiles.size} cached file(s)`
        : `Reusing ${existingFiles.size} already-downloaded image(s); pass --force to refresh`,
    )
  }

  const products = []
  const failures = []

  console.log('→ Apple and Samsung (Wikimedia Commons imagery)')
  for (const entry of CURATED) {
    const slug = slugify(entry.name)
    const cached = !FORCE && existingFiles.has(`${slug}-1`)

    try {
      // Skip the lookup entirely when the artwork is already on disk.
      const sourceUrl = cached ? '' : await resolveWikiImage(entry.wikiPage)
      const image = await downloadImage(sourceUrl, `${slug}-1`)
      products.push(buildProduct(entry, [{ ...image, sourceUrl }], 'wikimedia'))
      console.log(
        `   ✓ ${entry.name.padEnd(38)} ${(image.bytes / 1024).toFixed(0)} KB${image.reused ? ' (cached)' : ''}`,
      )
    } catch (error) {
      failures.push(`${entry.name}: ${error.message}`)
      console.log(`   ✗ ${entry.name.padEnd(38)} ${error.message}`)
    }

    // Wikimedia rate limits aggressively, but only network calls need pacing.
    if (!cached) await sleep(1200)
  }

  for (const source of SHOPIFY_SOURCES) {
    console.log(`→ ${source.brand} (official Shopify storefront feed)`)
    let selected = []
    try {
      selected = await fetchShopify(source)
    } catch (error) {
      failures.push(`${source.brand} feed: ${error.message}`)
      console.log(`   ✗ feed unavailable: ${error.message}`)
      continue
    }

    for (const { raw, pick } of selected) {
      const name = cleanTitle(stripHtml(raw.title), source.brand)
      const slug = slugify(name)
      const variant = raw.variants[0]
      const price = toUsd(variant.price)
      const compareAt = variant.compare_at_price ? toUsd(variant.compare_at_price) : 0

      const images = []
      for (const [index, image] of raw.images.slice(0, 3).entries()) {
        try {
          const saved = await downloadImage(image.src, `${slug}-${index + 1}`)
          images.push({ ...saved, sourceUrl: image.src })
        } catch (error) {
          failures.push(`${name} image ${index + 1}: ${error.message}`)
        }
      }
      if (images.length === 0) {
        console.log(`   ✗ ${name.padEnd(38)} no images downloaded`)
        continue
      }

      const body = stripHtml(raw.body_html)
      products.push(
        buildProduct(
          {
            name,
            brand: source.brand,
            category: pick.category,
            price,
            compareAtPrice: compareAt > price ? compareAt : 0,
            rating: Number((4.0 + ((raw.id % 9) / 10)).toFixed(1)),
            reviewCount: 180 + (raw.id % 2400),
            stock: raw.variants.some((entry) => entry.available) ? 20 + (raw.id % 120) : 0,
            tags: pick.tags,
            colors: colorsFromShopify(raw),
            shortDescription: body.slice(0, 165) || `${name} from ${source.brand}.`,
            description: body.slice(0, 900) || `${name}, sold and supported by ${source.brand}.`,
            highlights: (raw.tags ?? [])
              .filter((tag) => tag.length > 3 && !/^\d+$/.test(tag))
              .slice(0, 4)
              .map((tag) => tag.replace(/[-_]/g, ' ')),
            specs: specsFromShopify(raw),
          },
          images,
          'shopify',
        ),
      )
      console.log(`   ✓ ${name.padEnd(38)} $${price} · ${images.length} image(s)`)
    }
  }

  const catalogue = {
    generatedAt: new Date().toISOString(),
    sources: {
      wikimedia: 'https://commons.wikimedia.org (CC-licensed product photography)',
      boAt: 'https://www.boat-lifestyle.com/products.json',
      Noise: 'https://www.gonoise.com/products.json',
    },
    categories: CATEGORY_META,
    brands: [...new Set(products.map((product) => product.brand))].map((brand) => ({
      id: slugify(brand),
      ...BRAND_META[brand],
    })),
    products,
  }

  await writeFile(OUTPUT, `${JSON.stringify(catalogue, null, 2)}\n`, 'utf8')

  console.log(`\nWrote ${products.length} products to ${path.relative(process.cwd(), OUTPUT)}`)
  console.log(`Images in ${path.relative(process.cwd(), IMAGE_DIR)}`)
  const byBrand = products.reduce((acc, product) => {
    acc[product.brand] = (acc[product.brand] ?? 0) + 1
    return acc
  }, {})
  console.log('By brand:', byBrand)
  if (failures.length) console.log(`\n${failures.length} issue(s):\n  ${failures.join('\n  ')}`)
}

/**
 * Readable but collision-free: the brand code and a trimmed model name make the
 * SKU scannable, and a slug digest guarantees uniqueness where two model names
 * share a prefix (iPhone 15 and iPhone 15 Pro, for instance).
 */
function buildSku(name, brand) {
  const slug = slugify(name)
  const brandCode = slugify(brand).toUpperCase().replace(/-/g, '').slice(0, 4)
  const model = slug
    .replace(new RegExp(`^${slugify(brand)}-?`), '')
    .toUpperCase()
    .slice(0, 16)
    .replace(/-$/, '')
  const digest = createHash('sha1').update(slug).digest('hex').slice(0, 4).toUpperCase()

  return `NOV-${brandCode}-${model || 'ITEM'}-${digest}`
}

function buildProduct(entry, images, imageSource) {
  const price = Number(entry.price)
  const compareAtPrice = Number(entry.compareAtPrice) || null

  return {
    slug: slugify(entry.name),
    sku: buildSku(entry.name, entry.brand),
    name: entry.name,
    brand: entry.brand,
    category: entry.category,
    shortDescription: entry.shortDescription,
    description: entry.description,
    highlights: entry.highlights?.length ? entry.highlights : [],
    specs: entry.specs ?? {},
    colors: entry.colors?.length ? entry.colors : ['Standard'],
    price,
    compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
    currency: 'USD',
    rating: Number(entry.rating),
    reviewCount: Number(entry.reviewCount),
    stock: Number(entry.stock),
    tags: entry.tags ?? [],
    freeShipping: price >= 100,
    deliveryDays: price >= 100 ? 2 : 4,
    images: images.map((image, index) => ({
      url: image.publicUrl,
      alt: `${entry.name} — view ${index + 1}`,
      sourceUrl: image.sourceUrl,
    })),
    imageSource,
  }
}

await main()
