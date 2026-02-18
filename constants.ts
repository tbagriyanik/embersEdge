
import { Item, Recipe, PlayerStats, Language } from './types';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 64; 
export const CHUNK_SIZE = 16;
export const MAX_INVENTORY_SLOTS = 25; 
export const SAVE_KEY = 'embers_edge_save_v12';
export const SETTINGS_SAVE_KEY = 'embers_edge_settings_v2';

export const GATHER_BASE_DAMAGE = 20; 
export const GATHER_HAND_DAMAGE = 10; 
export const GATHER_TOOL_BOOST = 2.0; 
export const GATHER_XP_PER_HIT = 5; 

export const GATHER_ITEM_QUANTITY = {
  tree_oak: { item: 'wood', quantity: 1, particle: 'wood' },
  rock_standard: { item: 'stone', quantity: 1, particle: 'stone' },
  flower: { item: 'berry', quantity: 1, particle: 'leaf' },
  grass_clump: { item: 'wood', quantity: 1, particle: 'leaf' },
  deer: { item: 'meat_raw', quantity: 2, particle: 'blood' },
  rabbit: { item: 'meat_raw', quantity: 1, particle: 'blood' },
  gather_item_quantity_wood: { item: 'wood', quantity: 1, particle: 'wood' },
  bush_berry: { item: 'berry', quantity: 2, particle: 'leaf' },
};

export const GATHER_TOOL_REQUIREMENTS: { [key: string]: string[] } = {
  tree_oak: ['axe'],
  rock_standard: ['pickaxe'],
  deer: ['bow', 'axe'],
  rabbit: ['bow', 'axe'],
};

export const VILLAGE_NAMES: Record<Language, string[]> = {
  en: [
    "Ember's Edge", "Oakheart", "Stonecreek", "Windy Peaks", "Raven's Rest", 
    "Shadowmere", "Ironhold", "Dusty Basin", "Silent Grove", "Winterfell"
  ],
  tr: [
    "Köz Köyü", "Meşekalb", "Taşdere", "Rüzgarlı Tepe", "Kuzgun Durağı", 
    "Gölgehisar", "Demirhan", "Tozlu Havza", "Sessiz Koru", "Kışyarı"
  ]
};

export const VILLAGER_DIALOGUE: Record<Language, string[]> = {
  en: [
    "Safe travels, wanderer.",
    "The bears to the north are quite grumpy today.",
    "Have you spoken to the shopkeeper? He has new seeds.",
    "Nice weather we're having. Good for planting.",
    "I heard there are other villages scattered far to the north-east.",
    "Keep your hoe sharp, the soil here is tough.",
    "Don't stay out too late, it gets dangerous at night.",
    "The water in the well is always fresh."
  ],
  tr: [
    "Güvenli yolculuklar, gezgin.",
    "Kuzeydeki ayılar bugün oldukça huysuz.",
    "Dükkan sahibiyle konuştun mu? Yeni tohumlar gelmiş.",
    "Hava bugün ne kadar güzel. Ekim yapmak için ideal.",
    "Uzak kuzey-doğuda başka köyler olduğunu duydum.",
    "Çapanı keskin tut, buranın toprağı serttir.",
    "Dışarıda çok geç kalma, gece tehlikeli olur.",
    "Kuyudaki su her zaman tazedir."
  ]
};

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    new_game: "NEW GAME", continue: "CONTINUE", settings: "OPTIONS", language: "LANGUAGE", sound: "SOUND", gender: "GENDER", male: "MALE", female: "FEMALE", outfit: "OUTFIT COLOR", back: "BACK", level: "LEVEL", health: "HEALTH", hunger: "HUNGER", thirst: "THIRST", stamina: "STAMINA", inventory: "INVENTORY", crafting: "CRAFTING", level_up: "LEVEL UP!", placed: "PLACED", perished: "YOU PERISHED", retry: "RETRY", clear: "Clear Skies", wood: "Log", stone: "Stone", berry: "Berries", meat_raw: "Raw Meat", meat_cooked: "Steak", axe: "Stone Axe", pickaxe: "Stone Pickaxe", bow: "Survival Bow", arrow: "Arrows", active_gear: "ACTIVE GEAR", need_raw_food: "Need raw food!", out_of_arrows: "Out of arrows!", bare_hands: "Bare hands...", tool_broken: "Tool broken!", planted: "Planted!", harvested: "Harvested!", rest_tent: "Resting...", drink_water: "Drinking water...", daytime: "Day", nighttime: "Night", empty: "Empty", stock: "Stock", slots: "Slots", categories: { tools: "Tools & Weapons", buildings: "Buildings", survival: "Survival", trade: "Trading" }, shop: "VILLAGE SHOP", gold_coin: "Gold Coin", buy: "BUY", sell: "SELL", sell_all: "SELL ALL", villager: "Villager", shopkeeper: "Shopkeeper", trade_with_villagers: "Trade resources for coins or supplies.", hoe: "Stone Hoe", berry_seed: "Berry Seeds", tilled_soil: "Tilled Soil", grow_stage: "Growing...", ripe: "Ripe!", need_village: "Must be in a village to trade!", hand_slots: "Hotbar Slots", give_gift: "Give Gift", gift_thanks: "Oh, for me? Thank you so much!", no_gifts: "No giftable items found!", village: "Village", no_building_village: "Cannot build in the village!", upgrade: "UPGRADE", use: "USE", upgraded: "UPGRADED!", needs_upgrade: "Advanced Workbench required!"
  },
  tr: {
    new_game: "YENİ OYUN", continue: "DEVAM ET", settings: "SEÇENEKLER", language: "DİL", sound: "SES", gender: "CİNSİYET", male: "ERKEK", female: "KADIN", outfit: "KIYAFET RENGİ", back: "GERİ", level: "SEVİYE", health: "SAĞLIK", hunger: "AÇLIK", thirst: "SUSUZLUK", stamina: "ENERJİ", inventory: "ENVANTER", zanaat: "ZANAAT", level_up: "SEVİYE ATLADIN!", placed: "YERLEŞTİRİLDİ", perished: "ÖLDÜN", retry: "TEKRAR DENE", clear: "Açık Hava", wood: "Odun", stone: "Taş", berry: "Meyve", meat_raw: "Çiğ Et", meat_cooked: "Pişmiş Et", axe: "Taş Balta", pickaxe: "Taş Kazma", bow: "Yay", arrow: "Ok", active_gear: "AKTİF EKİPMAN", need_raw_food: "Çiğ gıda lazım!", out_of_arrows: "Ok kalmadı!", bare_hands: "Çıplak eller...", tool_broken: "Alet kırıldı!", planted: "Ekildi!", harvested: "Toplandı!", rest_tent: "Dinleniliyor...", drink_water: "Su içiliyor...", daytime: "Gündüz", nighttime: "Gece", empty: "Boş", stock: "Stok", slots: "Slotlar", categories: { tools: "Aletler & Silahlar", buildings: "Yapılar", survival: "Hayatta Kalma", trade: "Ticaret" }, shop: "KÖY DÜKKANI", gold_coin: "Altın Sikke", buy: "SATIN AL", sell: "SAT", sell_all: "HEPSİNİ SAT", villager: "Köylü", shopkeeper: "Dükkan Sahibi", trade_with_villagers: "Sikke veya erzak için takas yap.", hoe: "Taş Çapa", berry_seed: "Meyve Tohumu", tilled_soil: "Sürülmüş Toprak", grow_stage: "Büyüyor...", ripe: "Olgun!", need_village: "Ticaret için bir köyde olmalısın!", hand_slots: "Hızlı Erişim Slotları", give_gift: "Hediye Ver", gift_thanks: "Oh, benim için mi? Çok teşekkürler!", no_gifts: "Verilecek hediye bulunamadı!", village: "Köy", no_building_village: "Köy içine yapı yapılamaz!", upgrade: "GELİŞTİR", use: "KULLAN", upgraded: "GELİŞTİRİLDİ!", needs_upgrade: "Gelişmiş Tezgah gerekli!"
  }
};

export const INITIAL_STATS: PlayerStats = { health: 100, maxHealth: 100, hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100, stamina: 100, maxStamina: 100, level: 1, xp: 0, facing: 'se', equippedItemId: null, character: { gender: 'male', outfitColor: '#451a03' }, isWalking: false, lastInteractTime: 0, lastDamageTime: 0, lastCombatDamageTime: 0, interactionAnim: 0 };

export const STRUCTURE_UPGRADES: Record<string, Record<number, Record<string, number>>> = {
    workbench: {
        2: { wood: 30, stone: 20 }
    },
    hut: {
        2: { wood: 40, stone: 25 }
    }
};

export const ITEMS: { [key: string]: Item } = {
  wood: { id: 'wood', uniqueId: 'wood-base', name: 'Log', type: 'resource', icon: '🪵', description: 'Strong timber.', stackable: true, quantity: 0, maxStack: 99 },
  stone: { id: 'stone', uniqueId: 'stone-base', name: 'Stone', type: 'resource', icon: '🪨', description: 'Raw rock.', stackable: true, quantity: 0, maxStack: 99 },
  berry: { id: 'berry', uniqueId: 'berry-base', name: 'Berries', type: 'food', icon: '🫐', description: 'Sweet snack.', stackable: true, quantity: 0, maxStack: 99, effect: { hunger: 10, thirst: 8 } },
  meat_raw: { id: 'meat_raw', uniqueId: 'meat-raw-base', name: 'Raw Meat', type: 'food', icon: '🥩', description: 'Needs cooking.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 5, health: -5 } },
  meat_cooked: { id: 'meat_cooked', uniqueId: 'meat-cooked-base', name: 'Steak', type: 'food', icon: '🍖', description: 'Hearty meal.', stackable: true, quantity: 0, maxStack: 50, effect: { hunger: 40, health: 10, thirst: -5 } },
  axe: { id: 'axe', uniqueId: 'axe-base', name: 'Stone Axe', type: 'tool', icon: '🪓', description: 'Chops trees.', stackable: false, quantity: 1, maxStack: 1, durability: 1000, maxDurability: 1000 },
  pickaxe: { id: 'pickaxe', uniqueId: 'pick-base', name: 'Stone Pickaxe', type: 'tool', icon: '⛏️', description: 'Mines rock.', stackable: false, quantity: 1, maxStack: 1, durability: 1000, maxDurability: 1000 },
  hoe: { id: 'hoe', uniqueId: 'hoe-base', name: 'Stone Hoe', type: 'tool', icon: '🦯', description: 'Tills the soil.', stackable: false, quantity: 1, maxStack: 1, durability: 800, maxDurability: 800 },
  berry_seed: { id: 'berry_seed', uniqueId: 'seed-base', name: 'Berry Seeds', type: 'resource', icon: '🌱', description: 'Plant in tilled soil.', stackable: true, quantity: 0, maxStack: 50 },
  bow: { id: 'bow', uniqueId: 'bow-base', name: 'Bow', type: 'weapon', icon: '🏹', description: 'Ranged hunting.', stackable: false, quantity: 1, maxStack: 1, durability: 1500, maxDurability: 1500 },
  arrow: { id: 'arrow', uniqueId: 'arrow-base', name: 'Arrows', type: 'resource', icon: '↗️', description: 'Ammunition.', stackable: true, quantity: 5, maxStack: 99 },
  gold_coin: { id: 'gold_coin', uniqueId: 'coin-base', name: 'Gold Coin', type: 'currency', icon: '🪙', description: 'Village currency.', stackable: true, quantity: 0, maxStack: 999 },
  campfire: { id: 'campfire', uniqueId: 'campfire-base', name: 'Campfire', type: 'structure', icon: '🔥', description: 'Cooks food.', stackable: false, quantity: 1, placeEntity: 'campfire' },
  tent: { id: 'tent', uniqueId: 'tent-base', name: 'Tent', type: 'structure', icon: '⛺', description: 'Allows rest.', stackable: false, quantity: 1, placeEntity: 'tent' },
  hut: { id: 'hut', uniqueId: 'hut-base', name: 'Hut', type: 'structure', icon: '🏠', description: 'Sturdy shelter.', stackable: false, quantity: 1, placeEntity: 'hut' },
  workbench: { id: 'workbench', uniqueId: 'bench-base', name: 'Workbench', type: 'structure', icon: '⚒️', description: 'Complex crafting.', stackable: false, quantity: 1, placeEntity: 'workbench' },
};

export const RECIPES: Recipe[] = [
  { id: 'craft_axe', name: 'Stone Axe', output: { ...ITEMS.axe }, ingredients: { wood: 5, stone: 2 }, levelRequired: 1, category: 'tools' },
  { id: 'craft_pickaxe', name: 'Stone Pickaxe', output: { ...ITEMS.pickaxe }, ingredients: { wood: 5, stone: 5 }, levelRequired: 1, category: 'tools' },
  { id: 'craft_hoe', name: 'Stone Hoe', output: { ...ITEMS.hoe }, ingredients: { wood: 10, stone: 2 }, levelRequired: 1, category: 'tools' },
  { id: 'craft_bow', name: 'Bow', output: { ...ITEMS.bow }, ingredients: { wood: 15 }, levelRequired: 2, category: 'tools' },
  { id: 'craft_arrows', name: 'Arrows (5)', output: { ...ITEMS.arrow, quantity: 5 }, ingredients: { wood: 2 }, levelRequired: 1, category: 'tools' },
  { id: 'craft_campfire', name: 'Campfire', output: { ...ITEMS.campfire }, ingredients: { wood: 8 }, levelRequired: 1, category: 'buildings' },
  { id: 'craft_workbench', name: 'Workbench', output: { ...ITEMS.workbench }, ingredients: { wood: 15, stone: 10 }, levelRequired: 2, category: 'buildings' },
  { id: 'craft_tent', name: 'Tent', output: { ...ITEMS.tent }, ingredients: { wood: 20 }, levelRequired: 2, category: 'buildings' },
  { id: 'craft_hut', name: 'Hut', output: { ...ITEMS.hut }, ingredients: { wood: 30, stone: 15 }, levelRequired: 3, workbenchLevelRequired: 2, category: 'buildings' },
  
  // Shop Selling
  { id: 'sell_wood', name: 'Sell Wood (x10)', output: { ...ITEMS.gold_coin, quantity: 1 }, ingredients: { wood: 10 }, levelRequired: 1, category: 'trade' },
  { id: 'sell_stone', name: 'Sell Stone (x10)', output: { ...ITEMS.gold_coin, quantity: 2 }, ingredients: { stone: 10 }, levelRequired: 1, category: 'trade' },
  { id: 'sell_meat_raw', name: 'Sell Raw Meat', output: { ...ITEMS.gold_coin, quantity: 1 }, ingredients: { meat_raw: 1 }, levelRequired: 1, category: 'trade' },
  { id: 'sell_meat_raw_x5', name: 'Sell Raw Meat (x5)', output: { ...ITEMS.gold_coin, quantity: 5 }, ingredients: { meat_raw: 5 }, levelRequired: 1, category: 'trade' },
  { id: 'sell_meat_cooked', name: 'Sell Steak', output: { ...ITEMS.gold_coin, quantity: 3 }, ingredients: { meat_cooked: 1 }, levelRequired: 1, category: 'trade' },
  { id: 'sell_berries', name: 'Sell Berries (x20)', output: { ...ITEMS.gold_coin, quantity: 2 }, ingredients: { berry: 20 }, levelRequired: 1, category: 'trade' },
  { id: 'sell_berries_x5', name: 'Sell Berries (x5)', output: { ...ITEMS.gold_coin, quantity: 1 }, ingredients: { berry: 5 }, levelRequired: 1, category: 'trade' },

  // Shop Buying
  { id: 'buy_seeds', name: 'Buy Berry Seeds (x5)', output: { ...ITEMS.berry_seed, quantity: 5 }, ingredients: { gold_coin: 1 }, levelRequired: 1, category: 'trade' },
  { id: 'buy_arrows', name: 'Buy Arrows (x20)', output: { ...ITEMS.arrow, quantity: 20 }, ingredients: { gold_coin: 2 }, levelRequired: 1, category: 'trade' },
  { id: 'buy_axe', name: 'Buy Quality Axe', output: { ...ITEMS.axe }, ingredients: { gold_coin: 10 }, levelRequired: 1, category: 'trade' },
  { id: 'buy_pickaxe', name: 'Buy Quality Pickaxe', output: { ...ITEMS.pickaxe }, ingredients: { gold_coin: 10 }, levelRequired: 1, category: 'trade' },
  { id: 'buy_hoe', name: 'Buy Quality Hoe', output: { ...ITEMS.hoe }, ingredients: { gold_coin: 8 }, levelRequired: 1, category: 'trade' },
];
