export interface ItemData {
  name: string;
  description: string;
  rarity: string;
  type: string;
  requiresAttunement: boolean;
  value?: number;
  weight?: number; // in pounds
}
