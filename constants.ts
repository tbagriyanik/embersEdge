
import { Item, Recipe, PlayerStats, Language } from './types';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64; 
export const CHUNK_SIZE = 16;
export const MAX_INVENTORY_SLOTS = 25; 
export const SAVE_KEY = 'embers_edge_save_v8';
export const SETTINGS_SAVE_KEY = 'embers_edge_settings_v1';

export const GATHER_BASE_DAMAGE = 20; 
export const GATHER_HAND_DAMAGE = 5; 
export const GATHER_TOOL_BOOST = 2.0; 
export const GATHER_XP_PER_HIT = 5; 

export const GATHER_ITEM_QUANTITY = {
  tree_oak: { item: 'wood', quantity: 1, particle: 'wood' },
  rock_standard: { item: 'stone', quantity: 1, particle: 'stone' },
  bush_berry: { item: 'berry', quantity: 2, particle: 'leaf' },
  deer: { item: 'meat_raw', quantity: 2, particle: 'blood' },
};

export const GATHER_TOOL_REQUIREMENTS: { [key: string]: string[] } = {
  tree_oak: ['axe', 'pickaxe'],
  rock_standard: ['pickaxe', 'axe'],
  deer: ['stone_sword', 'iron_sword', 'bow', 'axe'],
};

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    new_game: "NEW GAME", continue: "CONTINUE", settings: "OPTIONS", language: "LANGUAGE", sound: "SOUND", gender: "GENDER", male: "MALE", female: "FEMALE", outfit: "OUTFIT COLOR", back: "BACK", level: "LEVEL", health: "HEALTH", hunger: "HUNGER", thirst: "THIRST", stamina: "STAMINA", inventory: "INVENTORY", crafting: "CRAFTING", ui_workbench: "WORKBENCH", at_workbench: "AT WORKBENCH", basic_crafting: "BASIC CRAFTING", level_up: "LEVEL UP!", dehydrated: "YOU ARE DEHYDRATED!", crafted: "CRAFTED!", placed: "PLACED", perished: "YOU PERISHED", retry: "RETRY", clear: "Clear Skies", rain: "Stormy Rain", fog: "Dense Fog", snow: "Cold Snow", full: "FULL", inv_full: "INVENTORY FULL!", tree_oak: "Oak Tree", rock_standard: "Rock", bush_berry: "Berry Bush", well: "Well", deer: "Deer", campfire: "Campfire", tent: "Tent", workbench: "Workbench", farm_plot: "Farm Plot", wood: "Log", stone: "Stone", berry: "Berries", meat_raw: "Raw Meat", meat_cooked: "Steak", axe: "Stone Axe", pickaxe: "Pickaxe", bow: "Survival Bow", arrow: "Arrows", active_gear: "ACTIVE GEAR", need_raw_food: "Need raw food!", out_of_arrows: "Out of arrows!", bare_hands: "Bare hands (Slow)...", tool_broken: "Tool broken!", planted: "Planted!", harvested: "Harvested!", rest_tent: "Resting... Zzz", drink_water: "Drinking water..."
  },
  tr: {
    new_game: "YENİ OYUN", continue: "DEVAM ET", settings: "SEÇENEKLER", language: "DİL", sound: "SES", gender: "CİNSİYET", male: "ERKEK", female: "KADIN", outfit: "KIYAFET RENGİ", back: "GERİ", level: "SEVİYE", health: "SAĞLIK", hunger: "AÇLIK", thirst: "SUSUZLUK", stamina: "ENERJİ", inventory: "ENVANTER", zanaat: "CRAFTING", ui_workbench: "TEZGAH", at_workbench: "TEZGAHTA", basic_crafting: "TEMEL ZANAAT", level_up: "SEVİYE ATLADIN!", dehydrated: "SUSUZ KALDIN!", crafted: "ÜRETİLDİ!", placed: "YERLEŞTİRİLDİ", perished: "ÖLDÜN", retry: "TEKRAR DENE", clear: "Açık Hava", rain: "Yağmur", fog: "Sis", snow: "Kar", full: "DOLU", inv_full: "ENVANTER DOLU!", tree_oak: "Meşe Ağacı", rock_standard: "Kaya", bush_berry: "Meyve Çalısı", well: "Kuyu", deer: "Geyik", campfire: "Kamp Ateşi", tent: "Çadır", workbench: "Tezgah", farm_plot: "Tarla", wood: "Odun", stone: "Taş", berry: "Böğürtlen", meat_raw: "Çiğ Et", meat_cooked: "Pişmiş Et", axe: "Taş Balta", pickaxe: "Kazma", bow: "Yay", arrow: "Ok", active_gear: "AKTİF EKİPMAN", need_raw_food: "Yiyecek yok!", out_of_arrows: "Ok kalmadı!", bare_hands: "Çıplak eller (Yavaş)...", tool_broken: "Alet kırıldı!", planted: "Ekildi!", harvested: "Toplandı!", rest_tent: "Dinleniliyor... Zzz", drink_water: "Su içiliyor..."
  }
};

export const INITIAL_STATS: PlayerStats = { health: 100, maxHealth: 100, hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100, stamina: 100, maxStamina: 100, level: 1, xp: 0, facing: 'se', equippedItemId: null, character: { gender: 'male', outfitColor: '#451a03' }, isWalking: false, lastInteractTime: 0, lastDamageTime: 0, lastCombatDamageTime: 0, interactionAnim: 0 };

export const ITEMS: { [key: string]: Item } = {
  wood: { id: 'wood', name: 'Log', type: 'resource', icon: '🪵', description: 'Strong timber.', stackable: true, quantity: 0, maxStack: 99 },
  stone: { id: 'stone', name: 'Stone', type: 'resource', icon: '🪨', description: 'Hard granite.', stackable: true, quantity: 0, maxStack: 99 },
  berry: { id: 'berry', name: 'Berries', type: 'food', icon: '🫐', description: 'Sweet snack.', stackable: true, quantity: 0, maxStack: 99, effect: { hunger: 10, thirst: 5 } },
  meat_raw: { id: 'meat_raw', name: 'Raw Meat', type: 'food', icon: '🥩', description: 'Needs cooking.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 5, health: -5 } },
  meat_cooked: { id: 'meat_cooked', name: 'Steak', type: 'food', icon: '🍖', description: 'Hearty meal.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 40, health: 10 } },
  axe: { id: 'axe', name: 'Stone Axe', type: 'tool', icon: '🪓', description: 'Chops trees.', stackable: false, quantity: 1, maxStack: 1, durability: 1500, maxDurability: 1500 },
  pickaxe: { id: 'pickaxe', name: 'Pickaxe', type: 'tool', icon: '⛏️', description: 'Mines rocks.', stackable: false, quantity: 1, maxStack: 1, durability: 1500, maxDurability: 1500 },
  bow: { id: 'bow', name: 'Bow', type: 'weapon', icon: '🏹', description: 'Ranged hunting.', stackable: false, quantity: 1, maxStack: 1, durability: 2000, maxDurability: 2000 },
  arrow: { id: 'arrow', name: 'Arrows', type: 'resource', icon: '↗️', description: 'Ammunition.', stackable: true, quantity: 5, maxStack: 99 },
  campfire: { id: 'campfire', name: 'Campfire', type: 'structure', icon: '🔥', description: 'Cooks food.', stackable: false, quantity: 1, placeEntity: 'campfire' },
  tent: { id: 'tent', name: 'Tent', type: 'structure', icon: '⛺', description: 'Sleep.', stackable: false, quantity: 1, placeEntity: 'tent' },
  workbench: { id: 'workbench', name: 'Workbench', type: 'structure', icon: '⚒️', description: 'Advanced crafting.', stackable: false, quantity: 1, placeEntity: 'workbench' },
};

export const RECIPES: Recipe[] = [
  { id: 'craft_axe', name: 'Stone Axe', output: { ...ITEMS.axe }, ingredients: { wood: 5, stone: 3 }, levelRequired: 1 },
  { id: 'craft_campfire', name: 'Campfire', output: { ...ITEMS.campfire }, ingredients: { wood: 10, stone: 5 }, levelRequired: 1 },
  { id: 'craft_arrows', name: 'Arrows (5)', output: { ...ITEMS.arrow, quantity: 5 }, ingredients: { wood: 2, stone: 1 }, levelRequired: 1 },
  { id: 'craft_workbench', name: 'Workbench', output: { ...ITEMS.workbench }, ingredients: { wood: 15, stone: 8 }, levelRequired: 2 },
  { id: 'craft_tent', name: 'Tent', output: { ...ITEMS.tent }, ingredients: { wood: 15, stone: 5 }, levelRequired: 2 },
  { id: 'craft_bow', name: 'Bow', output: { ...ITEMS.bow }, ingredients: { wood: 12 }, levelRequired: 3, requiresWorkbench: true },
];
