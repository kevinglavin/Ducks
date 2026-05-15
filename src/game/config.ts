import { Vector3 } from "three";

export const WORLD_WIDTH = 20; // x: -10 to 10
export const WORLD_HEIGHT = 36; // z: -18 to 18

export const COOP_POSITION = new Vector3(0, 0, -8);
export const DUCK_SPAWN_Z_MIN = 8;
export const DUCK_SPAWN_Z_MAX = 12;
export const DOG_SPAWN_POS = new Vector3(0, 0, 14);

export const TIME_LIMIT = 60; // seconds

export const TOTAL_DUCKS = 12;

export const CHARACTERS = {
  farmer: { speed: 5.0, pressure: 5.0, panic: 1.0 },
  pyrenees: { speed: 4.0, pressure: 7.0, panic: 2.0 },
  corgi: { speed: 7.5, pressure: 4.0, panic: 0.5 },
};

export type CharacterType = keyof typeof CHARACTERS;

export const DUCK_CONFIG = {
  PRESSURE_RADIUS: 4.0,
  PANIC_RADIUS: 1.5,
  NEIGHBOR_RADIUS: 3.0,
  SPEED_CALM: 1.2,
  SPEED_PRESSURE: 2.2,
  SPEED_PANIC: 3.2,
  SCATTER_DURATION_MS: 2000,
  CALM_DURATION_MS: 3000,
  COOP_ENTRANCE_RADIUS: 2.5,
}

export const DUCK_STATS = {
  white: { speedMult: 1.0, scatterLevel: 1.0, score: 10 },
  black: { speedMult: 1.2, scatterLevel: 1.2, score: 15 },
  brown: { speedMult: 1.8, scatterLevel: 2.5, score: 50 },
};

export const DUCK_TYPES = [
  ...Array(6).fill('white'),
  ...Array(3).fill('brown'),
  ...Array(3).fill('black'),
];
