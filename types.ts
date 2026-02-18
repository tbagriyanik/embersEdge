
export type ResourceType = 'wood' | 'stone' | 'berry' | 'water' | 'meat' | 'iron' | 'herb';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'snow';
export type TileType = 'grass' | 'sand' | 'water' | 'snow_tile' | 'desert_tile' | 'stone';
export type FacingDirection = 'se' | 'sw' | 'ne' | 'nw';
export type Language = 'en' | 'tr';
export type Gender = 'male' | 'female';

export interface WeatherState {
  type: WeatherType;
  intensity: number;
  transitionTimer: number;
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
  placeEntity?: EntityType;
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
  category: 'tools' | 'buildings' | 'survival';
}

export type EntityType = 
  | 'tree_oak' | 'tree_pine' | 'tree_palm' 
  | 'rock_standard' | 'rock_iron' 
  | 'bush_berry' | 'bush_flower' | 'bush_dry'
  | 'well' | 'player' | 'deer' | 'rabbit' | 'campfire' | 'tent' | 'workbench' | 'hut' | 'chest' | 'loot_bag' | 'farm_plot'
  | 'scorpion' | 'bear' | 'crab'
  | 'bridge' | 'road' | 'stone_wall' | 'watchtower' | 'castle_gate'
  | 'flower' | 'iron_ore' | 'axe_tool' | 'pickaxe_tool' | 'sword_tool' | 'grass_clump';

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
  aiState?: 'idle' | 'grazing' | 'fleeing' | 'chasing' | 'attacking';
  lastAiTick?: number;
  attackCooldown?: number;
  damage?: number;
  storage?: Item[];
  growthStage?: number;
  growthTimer?: number;
  facing?: 'left' | 'right';
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
  type: 'arrow'; 
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'dust' | 'blood' | 'spark' | 'leaf' | 'rain_splash' | 'wood' | 'stone' | 'dirt' | 'ripple' | 'smoke' | 'hit_spark';
  rotation?: number;
  rotSpeed?: number;
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
  lastDamageTime: number;
  lastCombatDamageTime: number;
  interactionAnim: number;
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
  floatingTexts: FloatingText[];
  particles: Particle[];
  time: number;
  isDay: boolean;
  gameStarted: boolean;
  isPaused: boolean;
  weather: WeatherState;
  settings: GameSettings;
  viewConfig: {
    zoom: number;
    rotation: number;
    cameraOffsetX: number;
    cameraOffsetY: number;
  };
  chunks: Record<string, TileType[][]>;
  hoveredEntityId: string | null;
  clickMarker: { x: number, y: number, life: number } | null;
}

export interface InputManagerCallbacks {
  onToggleInventory: () => void;
  onToggleCrafting: () => void;
  onOpenSettings: () => void;
  onInteract: (entityId: string | null) => void;
  onGather: (entityId: string) => void;
  onPanCamera: (dx: number, dy: number) => void;
  onZoom: (delta: number) => void;
  onClickToMove: (worldX: number, worldY: number) => void;
  onQuickSlotActivated: (slotIndex: number) => void;
  onEscape: () => void;
}
