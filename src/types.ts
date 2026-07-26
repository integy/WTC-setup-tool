/** WTC 11th Edition terrain types */

export interface TerrainLayout {
  id: string;
  name: string;
  fd: ForceDisposition;
  opponentFd?: ForceDisposition;
  layoutNumber: number;
  imagePath: string;
  usdzPath: string;
}

export type ForceDisposition =
  | 'take-and-hold'
  | 'purge-the-foe'
  | 'reconnaissance'
  | 'priority-assets'
  | 'disruption';

export const FD_LABELS: Record<ForceDisposition, string> = {
  'take-and-hold': 'Take and Hold',
  'purge-the-foe': 'Purge the Foe',
  'reconnaissance': 'Reconnaissance',
  'priority-assets': 'Priority Assets',
  'disruption': 'Disruption',
};

export const FD_SHORT: Record<ForceDisposition, string> = {
  'take-and-hold': 'Hold',
  'purge-the-foe': 'Purge',
  'reconnaissance': 'Recon',
  'priority-assets': 'Assets',
  'disruption': 'Disrupt',
};
