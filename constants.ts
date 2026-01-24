
import { Item, Recipe, PlayerStats, Language } from './types';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64; 
export const WORLD_SIZE = 100; // Increased world size for more building

export const TIME_SCALE = 0.02777; 
export const SAVE_KEY = 'embers_edge_save_v5';

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    new_game: "NEW SURVIVAL",
    continue: "CONTINUE JOURNEY",
    settings: "SETTINGS",
    language: "LANGUAGE",
    sound: "SOUND",
    gender: "GENDER",
    male: "MALE",
    female: "FEMALE",
    outfit: "OUTFIT COLOR",
    back: "BACK",
    level: "LEVEL",
    health: "HEALTH",
    hunger: "HUNGER",
    thirst: "THIRST",
    stamina: "STAMINA",
    inventory: "INVENTORY",
    crafting: "CRAFTING",
    workbench: "WORKBENCH",
    at_workbench: "AT WORKBENCH",
    basic_crafting: "BASIC CRAFTING",
    level_up: "LEVEL UP!",
    dehydrated: "YOU ARE DEHYDRATED!",
    crafted: "CRAFTED!",
    placed: "PLACED",
    perished: "YOU PERISHED",
    retry: "RETRY",
    weather: "WEATHER",
    unlocked_area: "THE WORLD EXPANDS...",
    full: "FULL",
    tree_oak: "Oak Tree",
    tree_pine: "Pine Tree",
    tree_palm: "Palm Tree",
    rock_standard: "Rock",
    rock_iron: "Iron Ore",
    bush_berry: "Berry Bush",
    bush_flower: "Flower Bush",
    bush_dry: "Dry Bush",
    well: "Well",
    deer: "Deer",
    rabbit: "Rabbit",
    campfire: "Campfire",
    tent: "Tent",
    hut: "Hut",
    scorpion: "Scorpion",
    bear: "Bear",
    bridge: "Wooden Bridge",
    road: "Stone Road",
    stone_wall: "Stone Wall",
    watchtower: "Watchtower",
    castle_gate: "Castle Gate",
    hp: "HP"
  },
  tr: {
    new_game: "YENİ HAYATTA KALMA",
    continue: "MACERAYA DEVAM ET",
    settings: "AYARLAR",
    language: "DİL",
    sound: "SES",
    gender: "CİNSİYET",
    male: "ERKEK",
    female: "KADIN",
    outfit: "KIYAFET RENGİ",
    back: "GERİ",
    level: "SEVİYE",
    health: "SAĞLIK",
    hunger: "AÇLIK",
    thirst: "SUSUZLUK",
    stamina: "ENERJİ",
    inventory: "ENVANTER",
    crafting: "ZANAAT",
    workbench: "TEZGAH",
    at_workbench: "TEZGAHTA",
    basic_crafting: "TEMEL ZANAAT",
    level_up: "SEVİYE ATLADIN!",
    dehydrated: "SUSUZ KALDIN!",
    crafted: "ÜRETİLDİ!",
    placed: "YERLEŞTİRİLDİ",
    perished: "ÖLDÜN",
    retry: "TEKRAR DENE",
    weather: "HAVA DURUMU",
    unlocked_area: "DÜNYA GENİŞLİYOR...",
    full: "DOLU",
    tree_oak: "Meşe Ağacı",
    tree_pine: "Çam Ağacı",
    tree_palm: "Palmiye",
    rock_standard: "Kaya",
    rock_iron: "Demir Cevheri",
    bush_berry: "Meyve Çalısı",
    bush_flower: "Çiçekli Çalı",
    bush_dry: "Kuru Çalı",
    well: "Kuyu",
    deer: "Geyik",
    rabbit: "Tavşan",
    campfire: "Kamp Ateşi",
    tent: "Çadır",
    hut: "Kulübe",
    scorpion: "Akrep",
    bear: "Ayı",
    bridge: "Ahşap Köprü",
    road: "Taş Yol",
    stone_wall: "Taş Duvar",
    watchtower: "Gözetleme Kulesi",
    castle_gate: "Kale Kapısı",
    hp: "YP"
  }
};

export const INITIAL_STATS: PlayerStats = {
  health: 100,
  maxHealth: 100,
  hunger: 100,
  maxHunger: 100,
  thirst: 100,
  maxThirst: 100,
  stamina: 100,
  maxStamina: 100,
  level: 1,
  xp: 0,
  facing: 'se',
  equippedItemId: null,
  character: {
    gender: 'male',
    outfitColor: '#451a03'
  },
  isWalking: false,
  lastInteractTime: 0
};

export const ITEMS: { [key: string]: Item } = {
  wood: { id: 'wood', name: 'Log', type: 'resource', icon: '🪵', description: 'Strong timber.', stackable: true, quantity: 0, maxStack: 99 },
  stone: { id: 'stone', name: 'Stone', type: 'resource', icon: '🪨', description: 'Hard granite.', stackable: true, quantity: 0, maxStack: 99 },
  iron: { id: 'iron', name: 'Iron Ingots', type: 'resource', icon: '⛓️', description: 'Refined iron.', stackable: true, quantity: 0, maxStack: 99 },
  berry: { id: 'berry', name: 'Berries', type: 'food', icon: '🫐', description: 'Sweet snack.', stackable: true, quantity: 0, maxStack: 99, effect: { hunger: 10, thirst: 5 } },
  meat_raw: { id: 'meat_raw', name: 'Raw Meat', type: 'food', icon: '🥩', description: 'Needs cooking.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 5, health: -5 } },
  meat_cooked: { id: 'meat_cooked', name: 'Steak', type: 'food', icon: '🍖', description: 'Hearty meal.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 40, health: 10 } },
  axe: { id: 'axe', name: 'Stone Axe', type: 'tool', icon: '🪓', description: 'Chops trees.', stackable: false, quantity: 1, maxStack: 1 },
  pickaxe: { id: 'pickaxe', name: 'Pickaxe', type: 'tool', icon: '⛏️', description: 'Mines rocks faster.', stackable: false, quantity: 1, maxStack: 1 },
  stone_sword: { id: 'stone_sword', name: 'Stone Sword', type: 'weapon', icon: '🗡️', description: 'Basic defense.', stackable: false, quantity: 1, maxStack: 1, effect: { damage: 5 } },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', icon: '⚔️', description: 'Strong weapon.', stackable: false, quantity: 1, maxStack: 1, effect: { damage: 12 } },
  bow: { id: 'bow', name: 'Bow', type: 'weapon', icon: '🏹', description: 'Ranged hunting.', stackable: false, quantity: 1, maxStack: 1, effect: { damage: 8 } },
  arrow: { id: 'arrow', name: 'Arrows', type: 'resource', icon: '↗️', description: 'Ammunition.', stackable: true, quantity: 5, maxStack: 99 },
  campfire: { id: 'campfire', name: 'Campfire Kit', type: 'structure', icon: '🔥', description: 'Cooks raw meat.', stackable: true, quantity: 1, maxStack: 10 },
  tent: { id: 'tent', name: 'Tent Kit', type: 'structure', icon: '⛺', description: 'Sleep through night.', stackable: true, quantity: 1, maxStack: 5 },
  workbench: { id: 'workbench', name: 'Workbench', type: 'structure', icon: '⚒️', description: 'Essential for crafting.', stackable: true, quantity: 0, maxStack: 5 },
  hut: { id: 'hut', name: 'Wooden Hut', type: 'structure', icon: '🏠', description: 'Solid protection.', stackable: true, quantity: 0, maxStack: 1 },
  bridge: { id: 'bridge', name: 'Bridge', type: 'structure', icon: '🌉', description: 'Cross water.', stackable: true, quantity: 0, maxStack: 10 },
  road: { id: 'road', name: 'Road', type: 'structure', icon: '🛣️', description: 'Walk faster.', stackable: true, quantity: 0, maxStack: 99 },
  stone_wall: { id: 'stone_wall', name: 'Stone Wall', type: 'structure', icon: '🧱', description: 'Defensive wall.', stackable: true, quantity: 0, maxStack: 99 },
  watchtower: { id: 'watchtower', name: 'Watchtower', type: 'structure', icon: '🏰', description: 'See far away.', stackable: true, quantity: 0, maxStack: 5 },
};

export const RECIPES: Recipe[] = [
  // Level 1
  { id: 'craft_axe', name: 'Stone Axe', output: { ...ITEMS.axe }, ingredients: { wood: 5, stone: 3 }, levelRequired: 1 },
  { id: 'craft_campfire', name: 'Campfire', output: { ...ITEMS.campfire }, ingredients: { wood: 10, stone: 5 }, levelRequired: 1 },
  { id: 'craft_arrows', name: 'Arrows (5)', output: { ...ITEMS.arrow, quantity: 5 }, ingredients: { wood: 2, stone: 1 }, levelRequired: 1 },
  
  // Level 2
  { id: 'craft_stone_sword', name: 'Stone Sword', output: { ...ITEMS.stone_sword }, ingredients: { wood: 2, stone: 10 }, levelRequired: 2 },
  { id: 'craft_workbench', name: 'Workbench', output: { ...ITEMS.workbench, quantity: 1 }, ingredients: { wood: 15, stone: 8 }, levelRequired: 2 },
  { id: 'craft_tent', name: 'Tent', output: { ...ITEMS.tent }, ingredients: { wood: 15, stone: 5 }, levelRequired: 2 },
  
  // Level 3
  { id: 'craft_bow', name: 'Survival Bow', output: { ...ITEMS.bow }, ingredients: { wood: 12 }, levelRequired: 3, requiresWorkbench: true },
  { id: 'craft_pickaxe', name: 'Pickaxe', output: { ...ITEMS.pickaxe }, ingredients: { wood: 5, stone: 15 }, levelRequired: 3 },
  { id: 'craft_road', name: 'Stone Road', output: { ...ITEMS.road, quantity: 5 }, ingredients: { stone: 10 }, levelRequired: 3 },

  // Level 5
  { id: 'craft_iron_sword', name: 'Iron Sword', output: { ...ITEMS.iron_sword }, ingredients: { wood: 5, stone: 10, iron: 15 }, levelRequired: 5, requiresWorkbench: true },
  { id: 'craft_bridge', name: 'Bridge', output: { ...ITEMS.bridge }, ingredients: { wood: 20, stone: 10 }, levelRequired: 5 },
  { id: 'craft_hut', name: 'Wooden Hut', output: { ...ITEMS.hut, quantity: 1 }, ingredients: { wood: 40, stone: 20 }, levelRequired: 5, requiresWorkbench: true },

  // Level 10+
  { id: 'craft_wall', name: 'Stone Wall', output: { ...ITEMS.stone_wall, quantity: 2 }, ingredients: { stone: 20 }, levelRequired: 10 },
  { id: 'craft_tower', name: 'Watchtower', output: { ...ITEMS.watchtower }, ingredients: { wood: 50, stone: 50, iron: 10 }, levelRequired: 15, requiresWorkbench: true },
];