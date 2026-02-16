
import { Item, Recipe, PlayerStats, Language } from './types';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64; 
export const CHUNK_SIZE = 16;
export const MAX_INVENTORY_SLOTS = 25; 
export const SAVE_KEY = 'embers_edge_save_v9';
export const SETTINGS_SAVE_KEY = 'embers_edge_settings_v2';

export const GATHER_BASE_DAMAGE = 20; 
export const GATHER_HAND_DAMAGE = 5; 
export const GATHER_TOOL_BOOST = 2.0; 
export const GATHER_XP_PER_HIT = 5; 

export const GATHER_ITEM_QUANTITY = {
  tree_oak: { item: 'wood', quantity: 1, particle: 'wood' },
  deer: { item: 'meat_raw', quantity: 2, particle: 'blood' },
};

export const GATHER_TOOL_REQUIREMENTS: { [key: string]: string[] } = {
  tree_oak: ['axe'],
  deer: ['bow', 'axe'],
};

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    new_game: "NEW GAME", continue: "CONTINUE", settings: "OPTIONS", language: "LANGUAGE", sound: "SOUND", gender: "GENDER", male: "MALE", female: "FEMALE", outfit: "OUTFIT COLOR", back: "BACK", level: "LEVEL", health: "HEALTH", hunger: "HUNGER", thirst: "THIRST", stamina: "STAMINA", inventory: "INVENTORY", crafting: "CRAFTING", level_up: "LEVEL UP!", placed: "PLACED", perished: "YOU PERISHED", retry: "RETRY", clear: "Clear Skies", wood: "Log", berry: "Berries", meat_raw: "Raw Meat", meat_cooked: "Steak", axe: "Stone Axe", bow: "Survival Bow", arrow: "Arrows", active_gear: "ACTIVE GEAR", need_raw_food: "Need raw food!", out_of_arrows: "Out of arrows!", bare_hands: "Bare hands...", tool_broken: "Tool broken!", planted: "Planted!", harvested: "Harvested!", rest_tent: "Resting...", drink_water: "Drinking water..."
  },
  tr: {
    new_game: "YENİ OYUN", continue: "DEVAM ET", settings: "SEÇENEKLER", language: "DİL", sound: "SES", gender: "CİNSİYET", male: "ERKEK", female: "KADIN", outfit: "KIYAFET RENGİ", back: "GERİ", level: "SEVİYE", health: "SAĞLIK", hunger: "AÇLIK", thirst: "SUSUZLUK", stamina: "ENERJİ", inventory: "ENVANTER", crafting: "ZANAAT", level_up: "SEVİYE ATLADIN!", placed: "YERLEŞTİRİLDİ", perished: "ÖLDÜN", retry: "TEKRAR DENE", clear: "Açık Hava", wood: "Odun", berry: "Meyve", meat_raw: "Çiğ Et", meat_cooked: "Pişmiş Et", axe: "Taş Balta", bow: "Yay", arrow: "Ok", active_gear: "AKTİF EKİPMAN", need_raw_food: "Çiğ gıda lazım!", out_of_arrows: "Ok kalmadı!", bare_hands: "Çıplak eller...", tool_broken: "Alet kırıldı!", planted: "Ekildi!", harvested: "Toplandı!", rest_tent: "Dinleniliyor...", drink_water: "Su içiliyor..."
  }
};

export const INITIAL_STATS: PlayerStats = { health: 100, maxHealth: 100, hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100, stamina: 100, maxStamina: 100, level: 1, xp: 0, facing: 'se', equippedItemId: null, character: { gender: 'male', outfitColor: '#451a03' }, isWalking: false, lastInteractTime: 0, lastDamageTime: 0, lastCombatDamageTime: 0, interactionAnim: 0 };

export const ITEMS: { [key: string]: Item } = {
  wood: { id: 'wood', name: 'Log', type: 'resource', icon: '🪵', description: 'Strong timber.', stackable: true, quantity: 0, maxStack: 99 },
  berry: { id: 'berry', name: 'Berries', type: 'food', icon: '🫐', description: 'Sweet snack.', stackable: true, quantity: 0, maxStack: 99, effect: { hunger: 10, thirst: 5 } },
  berry_cooked: { id: 'berry_cooked', name: 'Berry Jam', type: 'food', icon: '🍯', description: 'Cooked berries.', stackable: true, quantity: 0, maxStack: 99, effect: { hunger: 25, thirst: 10 } },
  meat_raw: { id: 'meat_raw', name: 'Raw Meat', type: 'food', icon: '🥩', description: 'Needs cooking.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 5, health: -5 } },
  meat_cooked: { id: 'meat_cooked', name: 'Steak', type: 'food', icon: '🍖', description: 'Hearty meal.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 40, health: 10 } },
  axe: { id: 'axe', name: 'Stone Axe', type: 'tool', icon: '🪓', description: 'Chops trees.', stackable: false, quantity: 1, maxStack: 1, durability: 1500, maxDurability: 1500 },
  bow: { id: 'bow', name: 'Bow', type: 'weapon', icon: '🏹', description: 'Ranged hunting.', stackable: false, quantity: 1, maxStack: 1, durability: 2000, maxDurability: 2000 },
  arrow: { id: 'arrow', name: 'Arrows', type: 'resource', icon: '↗️', description: 'Ammunition.', stackable: true, quantity: 5, maxStack: 99 },
  campfire: { id: 'campfire', name: 'Campfire', type: 'structure', icon: '🔥', description: 'Cooks food.', stackable: false, quantity: 1, placeEntity: 'campfire' },
};

export const RECIPES: Recipe[] = [
  { id: 'craft_axe', name: 'Stone Axe', output: { ...ITEMS.axe }, ingredients: { wood: 5 }, levelRequired: 1 },
  { id: 'craft_campfire', name: 'Campfire', output: { ...ITEMS.campfire }, ingredients: { wood: 10 }, levelRequired: 1 },
  { id: 'craft_arrows', name: 'Arrows (5)', output: { ...ITEMS.arrow, quantity: 5 }, ingredients: { wood: 2 }, levelRequired: 1 },
  { id: 'craft_bow', name: 'Bow', output: { ...ITEMS.bow }, ingredients: { wood: 12 }, levelRequired: 3 },
];
