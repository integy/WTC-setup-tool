import type { TerrainLayout } from '../types';

/**
 * WTC 11th Edition terrain layouts sourced from GDM (gdmissions.app).
 * Images are PNG renders of the official terrain maps with measurements.
 * Board dimensions: 60" × 44"
 * Each layout has a USDZ for AR Quick Look on iOS.
 */

function entry(
  id: string, fd: TerrainLayout['fd'], num: number, base: string
): TerrainLayout {
  const nameMap: Record<string, string> = {
    'take-and-hold': 'Take and Hold',
    'purge-the-foe': 'Purge the Foe',
    'reconnaissance': 'Reconnaissance',
    'priority-assets': 'Priority Assets',
    'disruption': 'Disruption',
  };
  return {
    id,
    name: `${nameMap[fd]} — Layout ${num}`,
    fd,
    layoutNumber: num,
    imagePath: `layouts/${base}.png`,
    usdzPath: `usdz/${base}.usdz`,
  };
}

const mirrorLayouts: TerrainLayout[] = [
  entry('th-m1', 'take-and-hold', 1, 'take-and-hold-mirror-1'),
  entry('th-m3', 'take-and-hold', 3, 'take-and-hold-mirror-3'),
  entry('ptf-m1', 'purge-the-foe', 1, 'purge-the-foe-mirror-1'),
  entry('ptf-m2', 'purge-the-foe', 2, 'purge-the-foe-mirror-2'),
  entry('recon-m2', 'reconnaissance', 2, 'reconnaissance-mirror-2'),
  entry('recon-m3', 'reconnaissance', 3, 'reconnaissance-mirror-3'),
  entry('pa-m2', 'priority-assets', 2, 'priority-assets-mirror-2'),
  entry('pa-m3', 'priority-assets', 3, 'priority-assets-mirror-3'),
  entry('disrupt-m1', 'disruption', 1, 'disruption-mirror-1'),
  entry('disrupt-m2', 'disruption', 2, 'disruption-mirror-2'),
];

export default mirrorLayouts;
