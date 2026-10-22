import { DinoSkin, DinoSkinConfig } from './types';

export const DINO_SKINS: Record<DinoSkin, DinoSkinConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Pixel T-Rex',
    primaryColor: '#475569',
    secondaryColor: '#334155',
    accentColor: '#10b981',
    eyeColor: '#f8fafc',
    particleColor: '#94a3b8',
    description: 'The legendary desert wanderer. Agile, sharp, and timeless.',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Raptor 2099',
    primaryColor: '#06b6d4',
    secondaryColor: '#0e7490',
    accentColor: '#f43f5e',
    eyeColor: '#f43f5e',
    particleColor: '#22d3ee',
    description: 'Equipped with cybernetic neon actuators and laser visor.',
  },
  volcano: {
    id: 'volcano',
    name: 'Pyro Drake',
    primaryColor: '#ea580c',
    secondaryColor: '#9a3412',
    accentColor: '#facc15',
    eyeColor: '#fef08a',
    particleColor: '#fb923c',
    description: 'Forged in volcanic magma. Leaves trailing ember sparks.',
  },
  golden: {
    id: 'golden',
    name: 'Golden Champion',
    primaryColor: '#eab308',
    secondaryColor: '#a16207',
    accentColor: '#ffffff',
    eyeColor: '#ffffff',
    particleColor: '#fde047',
    description: 'Radiant aurum armor bestowed upon the highest jumpers.',
  },
};
