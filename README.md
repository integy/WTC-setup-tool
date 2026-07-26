# WTC Setup Tools

**AR Terrain Layout Projection for Warhammer 40K 11th Edition WTC**

Open this page in **Safari on iPhone/iPad** to project WTC terrain layouts onto your table using AR. Point your camera at the table, tap to place, and see exactly where each terrain piece should be.

## How to Use

1. Open `https://integy.github.io/wtc-setup-tools` in Safari on iPhone/iPad
2. Pick a terrain layout from the list
3. Tap **Start AR**
4. Point camera at your gaming table
5. The terrain layout is projected onto the surface
6. Use **Prev/Next** to cycle through layouts

## Terrain Layouts

10 mirror-match layouts from WTC 11th Edition (source: [GDM 2026](https://gdmissions.app/11th/layouts)):

| Layout | FD | Variant |
|--------|-----|---------|
| Take and Hold #1 | Hold | Layout 1 |
| Take and Hold #3 | Hold | Layout 3 |
| Purge the Foe #1 | Purge | Layout 1 |
| Purge the Foe #2 | Purge | Layout 2 |
| Reconnaissance #2 | Recon | Layout 2 |
| Reconnaissance #3 | Recon | Layout 3 |
| Priority Assets #2 | Assets | Layout 2 |
| Priority Assets #3 | Assets | Layout 3 |
| Disruption #1 | Disrupt | Layout 1 |
| Disruption #2 | Disrupt | Layout 2 |

## Requirements

- iPhone or iPad with ARKit support (iPhone 6S or newer)
- Safari browser (iOS 12+)
- HTTPS connection (provided by GitHub Pages)

## Development

```bash
npm install
npm run dev     # Local dev server
npm run build   # Production build
```

## Tech Stack

- Vite + React 19 + TypeScript
- three.js with WebXR
- GitHub Pages deployment
