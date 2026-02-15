
export type ResourceType = 'wood' | 'stone' | 'berry' | 'water' | 'meat' | 'iron';
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
  type: 'resource' | 'tool' | 'food' | 'material' | 'structure' | 'weapon';
  icon: string;
  description: string;
  stackable: boolean;
  quantity: number;
  maxStack?: number;
  durability?: number;
  maxDurability?: number;
  effect?: {
    hunger?: number;
    thirst?: number;
    health?: number;
    sleep?: number;
    damage?: number;
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

export type EntityType = 
  | 'tree_oak' | 'tree_pine' | 'tree_palm' 
  | 'rock_standard' | 'rock_iron' 
  | 'bush_berry' | 'bush_flower' | 'bush_dry'
  | 'well' | 'player' | 'deer' | 'rabbit' | 'campfire' | 'tent' | 'workbench' | 'hut' | 'scorpion' | 'bear'
  | 'bridge' | 'road' | 'stone_wall' | 'watchtower' | 'castle_gate';

export interface Entity {
  id: string;
  x: number;
  y: number;
  type: EntityType;
  health: number;
  maxHealth: number;
  lastMove?: number;
  targetX?: number;
  targetY?: number;
  isFleeing?: boolean;
  spawnTime?: number;
  aiState?: 'idle' | 'grazing' | 'fleeing' | 'prowling' | 'hunting' | 'attacking';
  lastAiTick?: number;
  attackCooldown?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  ownerId: string;
  life: number;
  trail?: { x: number; y: number }[];
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
  isWalking: boolean;
  lastInteractTime: number;
  lastDamageTime: number; // New: To handle invincibility frames
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
  projectiles: Projectile[];
  time: number;
  isDay: boolean;
  gameStarted: boolean;
  weather: WeatherState;
  settings: GameSettings;
  viewConfig: {
    zoom: number;
    rotation: number;
    cameraOffsetX: number;
    cameraOffsetY: number;
  };
}
