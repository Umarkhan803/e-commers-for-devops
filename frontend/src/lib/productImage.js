/**
 * Generates product artwork as inline SVG data URIs.
 *
 * Real catalogues ship photography from a CDN; this storefront renders its own
 * illustrations so the demo stays fully offline and every card keeps a
 * consistent art direction.
 */

const ICONS = {
  headphones:
    '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  earbuds:
    '<path d="M6 3a4 4 0 0 1 4 4v9a3 3 0 1 1-6 0V7a4 4 0 0 1 2-4Z"/><path d="M18 3a4 4 0 0 0-4 4v9a3 3 0 1 0 6 0V7a4 4 0 0 0-2-4Z"/>',
  speaker:
    '<rect x="4" y="2" width="16" height="20" rx="3"/><circle cx="12" cy="14" r="4"/><path d="M12 6h.01"/>',
  watch:
    '<circle cx="12" cy="12" r="6"/><path d="M12 10v2l1 1"/><path d="m16.1 7.7-.8-4a2 2 0 0 0-2-1.7h-2.6a2 2 0 0 0-2 1.7l-.8 4"/><path d="m7.9 16.4.8 4a2 2 0 0 0 2 1.6h2.7a2 2 0 0 0 2-1.6l.8-4"/>',
  laptop:
    '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"/><path d="M2.7 19.6 4 16h16l1.3 3.6a1 1 0 0 1-.9 1.4H3.6a1 1 0 0 1-.9-1.4Z"/>',
  monitor:
    '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  smartphone: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/>',
  tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/>',
  camera:
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z"/><circle cx="12" cy="13" r="3.5"/>',
  gamepad:
    '<path d="M6 12h4"/><path d="M8 10v4"/><path d="M15.5 14.5h.01"/><path d="M18 11h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4A4 4 0 0 0 17.3 5Z"/>',
  keyboard:
    '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
  mouse: '<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/>',
  lamp: '<path d="M8 2h8l4 10H4Z"/><path d="M12 12v6"/><path d="M8 22a4 4 0 0 1 8 0Z"/>',
  dumbbell:
    '<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',
  coffee:
    '<path d="M10 2v2M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12a4 4 0 1 1 0 8h-1"/>',
  router:
    '<rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6.01 18H6M10.01 18H10"/><path d="M15 18h4"/><path d="M12 10V6"/><path d="M8.5 8.5a5 5 0 0 1 7 0"/>',
  glasses:
    '<circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-4 0"/><path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/><path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/>',
  backpack:
    '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/><path d="M8 18h8"/>',
  drone:
    '<circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="m7 7 2 2M17 7l-2 2M7 17l2-2M17 17l-2-2"/>',
  microphone:
    '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M9 21h6"/>',
}

const PALETTES = {
  indigo: ['#eef2ff', '#c7d2fe', '#4338ca'],
  sky: ['#ecfeff', '#bae6fd', '#0369a1'],
  violet: ['#f5f3ff', '#ddd6fe', '#6d28d9'],
  rose: ['#fff1f2', '#fecdd3', '#be123c'],
  amber: ['#fffbeb', '#fde68a', '#b45309'],
  emerald: ['#ecfdf5', '#a7f3d0', '#047857'],
  slate: ['#f8fafc', '#e2e8f0', '#334155'],
  fuchsia: ['#fdf4ff', '#f5d0fe', '#a21caf'],
}

/**
 * @param {{ icon: keyof typeof ICONS, palette: keyof typeof PALETTES, seed?: number, angle?: number }} options
 * @returns {string} data URI usable as an <img src>
 */
export function productImage({ icon = 'headphones', palette = 'indigo', seed = 1, angle = 0 }) {
  const [light, mid, deep] = PALETTES[palette] ?? PALETTES.indigo
  const glyph = ICONS[icon] ?? ICONS.headphones
  const id = `${icon}-${seed}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="${light}"/>
      <stop offset="100%" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="50%" cy="42%" r="52%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur-${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="38"/>
    </filter>
  </defs>
  <rect width="600" height="600" fill="url(#bg-${id})"/>
  <circle cx="${140 + (seed % 5) * 34}" cy="${132 + (seed % 3) * 40}" r="128" fill="${deep}" opacity="0.14" filter="url(#blur-${id})"/>
  <circle cx="${470 - (seed % 4) * 26}" cy="${470 - (seed % 3) * 30}" r="150" fill="${mid}" opacity="0.55" filter="url(#blur-${id})"/>
  <rect width="600" height="600" fill="url(#glow-${id})"/>
  <ellipse cx="300" cy="470" rx="150" ry="24" fill="${deep}" opacity="0.12"/>
  <g transform="translate(300 292) rotate(${angle}) scale(11.5) translate(-12 -12)"
     fill="none" stroke="${deep}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">
    ${glyph}
  </g>
</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' '))}`
}

/** Builds the small angle-variant set used by the product detail gallery. */
export function productGallery({ icon, palette, seed }) {
  return [
    productImage({ icon, palette, seed, angle: 0 }),
    productImage({ icon, palette: 'slate', seed: seed + 1, angle: -8 }),
    productImage({ icon, palette, seed: seed + 2, angle: 10 }),
    productImage({ icon, palette: 'sky', seed: seed + 3, angle: 0 }),
  ]
}
