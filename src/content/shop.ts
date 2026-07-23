import type { ShopItem } from '@/types/content';

/**
 * Placeholder shop catalogue. Everything is bought with soft currency
 * (Stardust) earned in-app — no real-money purchases in v1. Cosmetic avatars
 * and collectables also add to the Stardust income multiplier.
 */
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'avatar-comet',
    name: 'Comet',
    description: 'A trusty comet companion.',
    glyph: '☄️',
    cost: 100,
    multiplier: 0.1,
    kind: 'avatar',
  },
  {
    id: 'avatar-saturn',
    name: 'Ringed Planet',
    description: 'Show off your rings.',
    glyph: '🪐',
    cost: 250,
    multiplier: 0.25,
    kind: 'avatar',
  },
  {
    id: 'collectable-galaxy',
    name: 'Spiral Galaxy',
    description: 'A whole galaxy in your pocket.',
    glyph: '🌌',
    cost: 500,
    multiplier: 0.5,
    kind: 'collectable',
  },
  {
    id: 'consumable-fortune-cookie',
    name: 'Fortune Cookie',
    description: 'Crack it open for a random Stardust reward.',
    glyph: '🥠',
    cost: 50,
    multiplier: 0,
    kind: 'consumable',
  },
  {
    id: 'key-sqrt',
    name: 'Root Key',
    description: 'Unlock the √ key on the equation keyboard.',
    glyph: '√',
    cost: 150,
    multiplier: 0,
    kind: 'key',
    keyId: 'sqrt',
  },
  {
    id: 'key-pm',
    name: 'Plus-Minus Key',
    description: 'Unlock the ± key on the equation keyboard.',
    glyph: '±',
    cost: 150,
    multiplier: 0,
    kind: 'key',
    keyId: 'pm',
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
