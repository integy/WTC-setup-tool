import type { TerrainLayout } from '../types';

/**
 * WTC 11th Edition terrain layouts sourced from GDM (gdmissions.app).
 * Images are PNG renders of the official terrain maps with measurements.
 * Board dimensions: 60" × 44"
 */

const mirrorLayouts: TerrainLayout[] = [
  { id: 'th-m1', name: 'Take and Hold — Layout 1', fd: 'take-and-hold', layoutNumber: 1, imagePath: 'layouts/take-and-hold-mirror-1.png' },
  { id: 'th-m3', name: 'Take and Hold — Layout 3', fd: 'take-and-hold', layoutNumber: 3, imagePath: 'layouts/take-and-hold-mirror-3.png' },
  { id: 'ptf-m1', name: 'Purge the Foe — Layout 1', fd: 'purge-the-foe', layoutNumber: 1, imagePath: 'layouts/purge-the-foe-mirror-1.png' },
  { id: 'ptf-m2', name: 'Purge the Foe — Layout 2', fd: 'purge-the-foe', layoutNumber: 2, imagePath: 'layouts/purge-the-foe-mirror-2.png' },
  { id: 'recon-m2', name: 'Reconnaissance — Layout 2', fd: 'reconnaissance', layoutNumber: 2, imagePath: 'layouts/reconnaissance-mirror-2.png' },
  { id: 'recon-m3', name: 'Reconnaissance — Layout 3', fd: 'reconnaissance', layoutNumber: 3, imagePath: 'layouts/reconnaissance-mirror-3.png' },
  { id: 'pa-m2', name: 'Priority Assets — Layout 2', fd: 'priority-assets', layoutNumber: 2, imagePath: 'layouts/priority-assets-mirror-2.png' },
  { id: 'pa-m3', name: 'Priority Assets — Layout 3', fd: 'priority-assets', layoutNumber: 3, imagePath: 'layouts/priority-assets-mirror-3.png' },
  { id: 'disrupt-m1', name: 'Disruption — Layout 1', fd: 'disruption', layoutNumber: 1, imagePath: 'layouts/disruption-mirror-1.png' },
  { id: 'disrupt-m2', name: 'Disruption — Layout 2', fd: 'disruption', layoutNumber: 2, imagePath: 'layouts/disruption-mirror-2.png' },
];

export default mirrorLayouts;
