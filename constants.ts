
import { Item, Recipe, PlayerStats, Language } from './types';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64; 
export const WORLD_SIZE = 40; 

export const TIME_SCALE = 0.02777; 
export const SAVE_KEY = 'embers_edge_save_v4';

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
    // Entity Names
    tree: "Tree",
    rock: "Rock",
    bush: "Berry Bush",
    well: "Well",
    deer: "Deer",
    rabbit: "Rabbit",
    campfire: "Campfire",
    tent: "Tent",
    hut: "Hut",
    scorpion: "Scorpion",
    bear: "Bear",
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
    // Entity Names
    tree: "Ağaç",
    rock: "Kaya",
    bush: "Meyve Çalısı",
    well: "Kuyu",
    deer: "Geyik",
    rabbit: "Tavşan",
    campfire: "Kamp Ateşi",
    tent: "Çadır",
    hut: "Kulübe",
    scorpion: "Akrep",
    bear: "Ayı",
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
  berry: { id: 'berry', name: 'Berries', type: 'food', icon: '🫐', description: 'Sweet snack.', stackable: true, quantity: 0, maxStack: 99, effect: { hunger: 10, thirst: 5 } },
  meat_raw: { id: 'meat_raw', name: 'Raw Meat', type: 'food', icon: '🥩', description: 'Needs cooking.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 5, health: -5 } },
  meat_cooked: { id: 'meat_cooked', name: 'Steak', type: 'food', icon: '🍖', description: 'Hearty meal.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 40, health: 10 } },
  axe: { id: 'axe', name: 'Stone Axe', type: 'tool', icon: '🪓', description: 'Chops trees.', stackable: false, quantity: 1, maxStack: 1 },
  bow: { id: 'bow', name: 'Bow', type: 'tool', icon: '🏹', description: 'Ranged hunting.', stackable: false, quantity: 1, maxStack: 1 },
  arrow: { id: 'arrow', name: 'Arrows', type: 'resource', icon: '↗️', description: 'Ammunition.', stackable: true, quantity: 5, maxStack: 99 },
  campfire: { id: 'campfire', name: 'Campfire Kit', type: 'structure', icon: '🔥', description: 'Cooks raw meat.', stackable: true, quantity: 1, maxStack: 10 },
  tent: { id: 'tent', name: 'Tent Kit', type: 'structure', icon: '⛺', description: 'Sleep through night.', stackable: true, quantity: 1, maxStack: 5 },
  workbench: { id: 'workbench', name: 'Workbench', type: 'structure', icon: '⚒️', description: 'Essential for crafting.', stackable: true, quantity: 0, maxStack: 5 },
  hut: { id: 'hut', name: 'Wooden Hut', type: 'structure', icon: '🏠', description: 'Solid protection.', stackable: true, quantity: 0, maxStack: 1 },
};

export const RECIPES: Recipe[] = [
  { id: 'craft_axe', name: 'Stone Axe', output: { ...ITEMS.axe }, ingredients: { wood: 5, stone: 3 }, levelRequired: 1 },
  { id: 'craft_campfire', name: 'Campfire', output: { ...ITEMS.campfire }, ingredients: { wood: 10, stone: 5 }, levelRequired: 1 },
  { id: 'craft_arrows', name: 'Arrows (5)', output: { ...ITEMS.arrow, quantity: 5 }, ingredients: { wood: 2, stone: 1 }, levelRequired: 1 },
  { id: 'craft_workbench', name: 'Workbench', output: { ...ITEMS.workbench, quantity: 1 }, ingredients: { wood: 15, stone: 8 }, levelRequired: 2 },
  { id: 'craft_tent', name: 'Tent', output: { ...ITEMS.tent }, ingredients: { wood: 15, stone: 5 }, levelRequired: 2 },
  { id: 'craft_bow', name: 'Survival Bow', output: { ...ITEMS.bow }, ingredients: { wood: 8 }, levelRequired: 3, requiresWorkbench: true },
  { id: 'craft_hut', name: 'Wooden Hut', output: { ...ITEMS.hut, quantity: 1 }, ingredients: { wood: 40, stone: 20 }, levelRequired: 5, requiresWorkbench: true },
];
