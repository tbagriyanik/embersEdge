
export type ResourceType = 'wood' | 'stone' | 'berry' | 'water' | 'meat';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'snow';
export type TileType = 'grass' | 'sand' | 'water' | 'snow_tile' | 'desert_tile';
export type FacingDirection = 'se' | 'sw' | 'ne' | 'nw';
export type Language = 'en' | 'tr';
export type Gender = 'male' | 'female';

export interface WeatherState {
  type: WeatherType;
  intensity: number;
  transition: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'resource' | 'tool' | 'food' | 'material' | 'structure';
  icon: string;
  description: string;
  stackable: boolean;
  quantity: number;
  maxStack?: number;
  effect?: {
    hunger?: number;
    thirst?: number;
    health?: number;
    sleep?: number;
  };
}

export interface Recipe {
  id: string;
  name: string;
  output: Item;
  ingredients: { [key: string]: number };
  levelRequired: number;
  requiresWorkbench?: boolean;
}

export type EntityType = 'tree' | 'rock' | 'bush' | 'well' | 'player' | 'deer' | 'rabbit' | 'campfire' | 'tent' | 'workbench' | 'hut' | 'scorpion' | 'bear';

export interface Entity {
  id: string;
  x: number;
  y: number;
  type: EntityType;
  health: number;
  maxHealth: number;
  lastMove?: number;
  // AI related fields
  targetX?: number;
  targetY?: number;
  isFleeing?: boolean;
  spawnTime?: number;
}

export interface CharacterConfig {
  gender: Gender;
  outfitColor: string;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  stamina: number;
  maxStamina: number;
  level: number;
  xp: number;
  facing: FacingDirection;
  equippedItemId: string | null;
  character: CharacterConfig;
  // Track if player is currently moving for visual animations
  isWalking: boolean;
  lastInteractTime: number;
}

export interface GameSettings {
  language: Language;
  soundEnabled: boolean;
}

export interface GameState {
  playerPos: { x: number; y: number };
  playerStats: PlayerStats;
  inventory: Item[];
  entities: Entity[];
  time: number;
  isDay: boolean;
  gameStarted: boolean;
  weather: WeatherState;
  settings: GameSettings;
  viewConfig: {
    zoom: number;
    rotation: number;
    cameraOffsetX: number; // For mouse panning
    cameraOffsetY: number; // For mouse panning
  };
}
