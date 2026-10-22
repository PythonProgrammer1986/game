import { AccessoryConfig, AccessoryType } from './types';

export const ACCESSORIES: Record<AccessoryType, AccessoryConfig> = {
  none: {
    id: 'none',
    name: 'Natural Dino',
    cost: 0,
    description: 'No gear. Pure prehistoric grit.',
    icon: '🦖',
  },
  propeller_hat: {
    id: 'propeller_hat',
    name: 'Propeller Beanie',
    cost: 0,
    description: 'Spins as you jump into the air!',
    icon: '🧢',
  },
  superhero_cape: {
    id: 'superhero_cape',
    name: 'Superhero Cape',
    cost: 0,
    description: 'Flutters heroically as you sprint!',
    icon: '🦸',
  },
  party_hat: {
    id: 'party_hat',
    name: 'Party Hat',
    cost: 0,
    description: 'Every hop is a birthday party!',
    icon: '🥳',
  },
  sunglasses: {
    id: 'sunglasses',
    name: 'Cyber Shades',
    cost: 0,
    description: 'Ultraviolet polarized neon shades.',
    icon: '🕶️',
  },
  crown: {
    id: 'crown',
    name: 'Golden Crown',
    cost: 0,
    description: 'Royal regalia for the jump champion.',
    icon: '👑',
  },
  goggles: {
    id: 'goggles',
    name: 'Aviator Goggles',
    cost: 0,
    description: 'Brass steampunk wind lenses.',
    icon: '🥽',
  },
  headband: {
    id: 'headband',
    name: 'Workout Headband',
    cost: 0,
    description: 'Crimson martial sweatband.',
    icon: '🪢',
  },
};
