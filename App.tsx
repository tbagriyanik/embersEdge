
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Inventory } from './components/Inventory';
import { Crafting } from './components/Crafting';
import { MainMenu } from './components/MainMenu';
import { DeathScreen } from './components/DeathScreen';
import { SoundManager } from './components/SoundManager';
import { Minimap } from './components/Minimap';
import { PlayerStats, Item, Entity, GameState, EntityType, TileType, GameSettings, Language, Projectile, WeatherType } from './types';
import { INITIAL_STATS, WORLD_SIZE, ITEMS, RECIPES, TRANSLATIONS, TILE_WIDTH, TILE_HEIGHT, SAVE_KEY, SETTINGS_SAVE_KEY, MAX_INVENTORY_SLOTS } from './constants';

export const getTileType = (x: number, y: number, level: number = 1): TileType => {
  const dx = x - WORLD_SIZE / 2;
  const dy = y - WORLD_SIZE / 2;
  const distToCenter = Math.sqrt(dx * dx + dy * dy);
  const borderSize = 4;
  if (x < borderSize || x >= WORLD_SIZE - borderSize || y < borderSize || y >= WORLD_SIZE - borderSize) return 'water';
  if (distToCenter < 5) return 'water';
  if (distToCenter < 7.5) return 'sand';
  const n1 = Math.sin(x * 0.4) * Math.cos(y * 0.4);
  const n2 = Math.sin(x * 0.2 + y * 0.2) * 0.5;
  const combinedNoise = n1 * 0.6 + n2 * 0.3;
  if (combinedNoise > 0.65) return 'water';
  if (combinedNoise > 0.45) return 'sand';
  return 'grass';
};

export const spawnEntities = (count: number, safeX?: number, safeY?: number, safeRadius: number = 15): Entity[] => {
  const entities: Entity[] = [];
  const types: EntityType[] = ['tree_oak', 'tree_pine', 'tree_palm', 'rock_standard', 'rock_iron', 'bush_berry', 'bush_flower', 'bush_dry', 'deer', 'rabbit', 'bear', 'scorpion', 'crab'];
  
  let attempts = 0;
  const maxAttempts = count * 3;

  while (entities.length < count && attempts < maxAttempts) {
    attempts++;
    const x = Math.random() * (WORLD_SIZE - 10) + 5;
    const y = Math.random() * (WORLD_SIZE - 10) + 5;
    const tile = getTileType(x, y);
    
    if (tile === 'water') continue;

    let nearWater = false;
    const offsets = [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5]];
    for (const [ox, oy] of offsets) {
      if (getTileType(x + ox, y + oy) === 'water') {
        nearWater = true;
        break;
      }
    }

    if (!nearWater && Math.random() < 0.85) continue;

    let type = types[Math.floor(Math.random() * types.length)];
    if (tile === 'sand') type = Math.random() > 0.5 ? 'tree_palm' : (Math.random() > 0.5 ? 'scorpion' : 'crab');
    else if (type === 'tree_palm' || type === 'scorpion' || type === 'crab') type = 'tree_oak';
    
    const hostiles = ['bear', 'scorpion', 'crab'];
    if (hostiles.includes(type) && safeX !== undefined && safeY !== undefined) {
      const distToSpawn = Math.sqrt((x - safeX)**2 + (y - safeY)**2);
      if (distToSpawn < safeRadius) continue;
    }

    if (type === 'bear' && Math.random() > 0.1) continue;
    if (type === 'scorpion' && Math.random() > 0.2) continue;

    entities.push({ 
      id: `ent-${entities.length}-${Date.now()}`, 
      x, y, 
      type: type as EntityType, 
      health: 5, 
      maxHealth: 5, 
      spawnTime: Date.now(), 
      aiState: 'idle', 
      lastAiTick: Date.now() + Math.random() * 2000 
    });
  }
  return entities;
};

export const findSafePlayerSpawn = (startX: number, startY: number, entities: Entity[]): { x: number; y: number } => {
  const isOccupied = (tx: number, ty: number) => {
    if (getTileType(tx, ty) === 'water') return true;
    return entities.some(e => 
      !['road', 'bridge', 'rabbit', 'scorpion', 'deer', 'crab'].includes(e.type) && 
      Math.sqrt((e.x - tx) ** 2 + (e.y - ty) ** 2) < 1.0
    );
  };
  if (!isOccupied(startX, startY)) return { x: startX, y: startY };
  for (let radius = 1; radius < 20; radius++) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const tx = startX + Math.cos(angle) * radius;
      const ty = startY + Math.sin(angle) * radius;
      if (tx > 5 && tx < WORLD_SIZE - 5 && ty > 5 && ty < WORLD_SIZE - 5 && !isOccupied(tx, ty)) {
        return { x: tx, y: ty };
      }
    }
  }
  return { x: startX, y: startY }; 
};

export const findPlacementSpot = (x: number, y: number, entities: Entity[]): { x: number; y: number } | null => {
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
  const distance = 1.6;
  for (const angle of angles) {
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;
    if (targetX < 2 || targetX >= WORLD_SIZE - 2 || targetY < 2 || targetY >= WORLD_SIZE - 2) continue;
    if (getTileType(targetX, targetY) === 'water') continue;
    const collides = entities.some((e: Entity) => !['road', 'bridge', 'rabbit', 'scorpion', 'deer'].includes(e.type) && Math.sqrt((e.x - targetX) ** 2 + (e.y - targetY) ** 2) < 0.8);
    if (!collides) return { x: targetX, y: targetY };
  }
  return null;
};

const CAMPFIRE_LIFESPAN = 60000;
const PLAYER_INVINCIBILITY_MS = 1000;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<any>(() => {
    let initialSettings: GameSettings = { language: 'en', soundEnabled: true };
    let initialCharacter = INITIAL_STATS.character;
    const savedSettings = localStorage.getItem(SETTINGS_SAVE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.settings) initialSettings = parsed.settings;
        if (parsed.character) initialCharacter = parsed.character;
      } catch (e) { console.error("Persistence: Settings load failed", e); }
    }
    return {
      playerPos: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 + 8 },
      playerStats: { ...INITIAL_STATS, character: initialCharacter },
      inventory: [], entities: [], projectiles: [], birds: [], ripples: [], particles: [], shake: 0,
      isRecentlyAttackedByAnimal: false, isDead: false, time: 600, isDay: true, gameStarted: false,
      weather: { type: 'clear', intensity: 0, transition: 0 }, settings: initialSettings,
      viewConfig: { zoom: 1.0, rotation: 0, cameraOffsetX: 0, cameraOffsetY: 0 }
    };
  });

  const [uiState, setUiState] = useState({ inventoryOpen: false, craftingOpen: false, settingsOpen: false, message: '' });
  const [hasSave, setHasSave] = useState(false);
  const [isResting, setIsResting] = useState(false);

  const gameStateRef = useRef<any>(gameState);
  const uiStateRef = useRef<any>(uiState);
  const isRestingRef = useRef<boolean>(false);
  const activeKeys = useRef<Set<string>>(new Set());
  const velocity = useRef({ x: 0, y: 0 });
  const lastUpdate = useRef(performance.now());
  const nextWeatherTime = useRef(performance.now() + 60000);
  const targetWeather = useRef<WeatherType>('clear');
  const mouseTargetPos = useRef<{ x: number, y: number } | null>(null);
  const targetEntityId = useRef<string | null>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);
  useEffect(() => { isRestingRef.current = isResting; }, [isResting]);

  const lang = gameState.settings.language;
  const t = useCallback((key: string) => TRANSLATIONS[lang][key] || key, [lang]);
  const isPaused = useMemo(() => uiState.inventoryOpen || uiState.craftingOpen || uiState.settingsOpen || gameState.isDead, [uiState, gameState.isDead]);
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { JSON.parse(saved); setHasSave(true); } catch(e) { setHasSave(false); } }
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_SAVE_KEY, JSON.stringify({ settings: gameState.settings, character: gameState.playerStats.character }));
  }, [gameState.settings, gameState.playerStats.character]);

  useEffect(() => {
    const onBlur = () => {
      if (gameStateRef.current.gameStarted && !gameStateRef.current.isDead) {
        setGameState((p: any) => ({ ...p, gameStarted: false }));
      }
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);

  const showMessage = useCallback((msgKey: string, direct: boolean = false) => {
    const currentLang = gameStateRef.current.settings.language;
    const msg = direct ? msgKey : TRANSLATIONS[currentLang][msgKey] || msgKey;
    setUiState(prev => ({ ...prev, message: msg }));
    setTimeout(() => setUiState(prev => ({ ...prev, message: '' })), 4000);
  }, []);

  const canCarryItem = useCallback((itemId: string, quantity: number, currentInventory: Item[]): boolean => {
    const itemTemplate = ITEMS[itemId];
    if (!itemTemplate) return true;
    let remaining = quantity;
    if (itemTemplate.stackable) {
      currentInventory.filter(i => i.id === itemId && i.quantity < (i.maxStack || 99)).forEach(s => { remaining -= Math.min(remaining, (s.maxStack || 99) - s.quantity); });
    }
    if (remaining <= 0) return true;
    const slotsNeeded = itemTemplate.stackable ? Math.ceil(remaining / (itemTemplate.maxStack || 99)) : remaining;
    return (currentInventory.length + slotsNeeded) <= MAX_INVENTORY_SLOTS;
  }, []);

  const addItemsToInventory = useCallback((itemId: string, quantity: number, currentInventory: Item[]): Item[] => {
    const itemTemplate = ITEMS[itemId];
    if (!itemTemplate) return currentInventory;
    const newInv = [...currentInventory];
    let remaining = quantity;
    if (itemTemplate.stackable) {
      for (let i = 0; i < newInv.length && remaining > 0; i++) {
        if (newInv[i].id === itemId && newInv[i].quantity < (newInv[i].maxStack || 99)) {
          const add = Math.min(remaining, (newInv[i].maxStack || 99) - newInv[i].quantity);
          newInv[i] = { ...newInv[i], quantity: newInv[i].quantity + add };
          remaining -= add;
        }
      }
    }
    while (remaining > 0) {
      const add = itemTemplate.stackable ? Math.min(remaining, (itemTemplate.maxStack || 99)) : 1;
      newInv.push({ ...itemTemplate, quantity: add });
      remaining -= itemTemplate.stackable ? add : 1;
    }
    return newInv;
  }, []);

  const triggerDrink = useCallback(() => {
    setGameState((prev: any) => {
      if (prev.playerStats.thirst >= 100) { showMessage('full'); return prev; }
      showMessage('drink_water');
      return { ...prev, playerStats: { ...prev.playerStats, thirst: Math.min(100, prev.playerStats.thirst + 20) } };
    });
  }, [showMessage]);

  const handleEntityDeath = useCallback((target: Entity, prev: any): any => {
    const xpGain = ['deer', 'rabbit', 'bear', 'scorpion', 'crab'].includes(target.type) ? 60 : 30;
    const updatedEntities = prev.entities.filter((e: Entity) => e.id !== target.id);
    let rewardId = 'berry'; let qty = 1;
    if (target.type.includes('tree')) rewardId = 'wood';
    else if (target.type.includes('rock')) rewardId = target.type === 'rock_iron' ? 'iron' : 'stone';
    else if (['deer', 'bear', 'scorpion', 'crab', 'rabbit'].includes(target.type)) { rewardId = 'meat_raw'; qty = target.type === 'bear' ? 3 : (target.type === 'deer' ? 2 : 1); }
    if (!canCarryItem(rewardId, qty, prev.inventory)) { showMessage('inv_full'); return { ...prev, entities: updatedEntities }; }
    const newInv = addItemsToInventory(rewardId, qty, prev.inventory);
    let newXp = prev.playerStats.xp + xpGain; let newLevel = prev.playerStats.level;
    const threshold = newLevel * 250;
    if (newXp >= threshold) { newLevel += 1; newXp -= threshold; SoundManager.playUI('fanfare'); setTimeout(() => showMessage('level_up'), 500); }
    return { ...prev, entities: updatedEntities, inventory: newInv, playerStats: { ...prev.playerStats, xp: newXp, level: newLevel, health: newLevel > prev.playerStats.level ? prev.playerStats.maxHealth : prev.playerStats.health, stamina: newLevel > prev.playerStats.level ? prev.playerStats.maxStamina : prev.playerStats.stamina, lastInteractTime: performance.now() } };
  }, [showMessage, canCarryItem, addItemsToInventory]);

  const executeInteraction = useCallback((entityId: string) => {
    if (isPausedRef.current) return;
    setGameState((prev: any) => {
      const target = prev.entities.find((e: Entity) => e.id === entityId);
      if (!target) return prev;
      const isTool = prev.playerStats.equippedItemId !== null;
      if (Math.sqrt((target.x - prev.playerPos.x)**2 + (target.y - prev.playerPos.y)**2) > (isTool ? 1.8 : 1.6)) return prev;
      if (target.type === 'tent') {
        if (isRestingRef.current) return prev;
        setIsResting(true); SoundManager.playUI('fanfare');
        setTimeout(() => { setIsResting(false); setGameState((p: any) => ({ ...p, time: (p.time + 600) % 2400, playerStats: { ...p.playerStats, health: Math.min(p.playerStats.maxHealth, p.playerStats.health + 40), stamina: p.playerStats.maxStamina, hunger: Math.max(0, p.playerStats.hunger - 15) } })); }, 2000);
        return prev;
      }
      if (target.type === 'workbench') { setUiState(s => ({ ...s, inventoryOpen: true })); showMessage('workbench_ready'); return prev; }
      if (target.type === 'campfire') {
        const rawIdx = prev.inventory.findIndex((i: Item) => i.id === 'meat_raw');
        const berryIdx = prev.inventory.findIndex((i: Item) => i.id === 'berry');
        if (rawIdx > -1) {
          SoundManager.playGather('bush_berry'); showMessage('meat_cooked');
          let ni = [...prev.inventory]; ni[rawIdx].quantity -= 1; if (ni[rawIdx].quantity <= 0) ni.splice(rawIdx, 1);
          if (canCarryItem('meat_cooked', 1, ni)) return { ...prev, inventory: addItemsToInventory('meat_cooked', 1, ni) };
          showMessage('inv_full'); return prev;
        } else if (berryIdx > -1) {
          SoundManager.playGather('bush_berry'); showMessage('berry_cooked');
          let ni = [...prev.inventory]; ni[berryIdx].quantity -= 1; if (ni[berryIdx].quantity <= 0) ni.splice(berryIdx, 1);
          if (canCarryItem('berry_cooked', 1, ni)) return { ...prev, inventory: addItemsToInventory('berry_cooked', 1, ni) };
          showMessage('inv_full'); return prev;
        } else { showMessage('need_raw_food'); return prev; }
      }
      SoundManager.playGather(target.type, prev.playerStats.equippedItemId);
      const damage = prev.playerStats.equippedItemId ? (ITEMS[prev.playerStats.equippedItemId]?.effect?.damage || 1) : 1;
      const newHealth = target.health - damage;
      let ni = [...prev.inventory]; let newEq = prev.playerStats.equippedItemId;
      if (newEq) {
        const idx = ni.findIndex(i => i.id === newEq);
        if (idx > -1) { 
          const item = { ...ni[idx] };
          if (item.durability !== undefined) {
            item.durability -= 1; 
            if (item.durability <= 0) { ni.splice(idx, 1); showMessage('broken'); newEq = null; } 
            else ni[idx] = item;
          }
        }
      }
      const updated = prev.entities.map((e: Entity) => e.id === target.id ? { ...e, health: newHealth, aiState: ['bear', 'scorpion', 'crab'].includes(e.type) ? 'hunting' : 'fleeing', isFleeing: !['bear', 'scorpion', 'crab'].includes(e.type) } : e);
      const nextBase = { ...prev, inventory: ni, entities: updated, playerStats: { ...prev.playerStats, equippedItemId: newEq, lastInteractTime: performance.now() } };
      return newHealth <= 0 ? handleEntityDeath(target, nextBase) : nextBase;
    });
  }, [showMessage, handleEntityDeath, canCarryItem, addItemsToInventory]);

  const handleInteract = useCallback(() => {
    const s = gameStateRef.current;
    if (!s.gameStarted || isPausedRef.current) return;
    const nearest = s.entities.find((e: any) => Math.sqrt((e.x - s.playerPos.x)**2 + (e.y - s.playerPos.y)**2) < 1.8);
    if (nearest) { executeInteraction(nearest.id); return; }
    let nearWater = false;
    for (let dx = -1.2; dx <= 1.2; dx += 0.4) { for (let dy = -1.2; dy <= 1.2; dy += 0.4) { if (getTileType(s.playerPos.x + dx, s.playerPos.y + dy) === 'water') { nearWater = true; break; } } if (nearWater) break; }
    if (nearWater) triggerDrink();
  }, [executeInteraction, triggerDrink]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const state = gameStateRef.current; if (!state) return null;
    const { zoom, cameraOffsetX, cameraOffsetY } = state.viewConfig;
    const tw = TILE_WIDTH * zoom; const th = TILE_HEIGHT * zoom;
    const offsetX = (window.innerWidth / 2) - (state.playerPos.x * tw + tw / 2) + cameraOffsetX;
    const offsetY = (window.innerHeight / 2) - (state.playerPos.y * th + th / 2) + cameraOffsetY;
    return { x: (sx - offsetX) / tw, y: (sy - offsetY) / th };
  }, []);

  const update = useCallback((time: number) => {
    const dt = (time - lastUpdate.current) / 1000;
    lastUpdate.current = time;
    const state = gameStateRef.current;
    if (!state.gameStarted || state.isDead || isPausedRef.current) { requestRef.current = requestAnimationFrame(update); return; }
    
    if (time > nextWeatherTime.current) {
      const weathers: WeatherType[] = ['clear', 'rain', 'fog', 'snow'];
      targetWeather.current = weathers[Math.floor(Math.random() * weathers.length)];
      nextWeatherTime.current = time + 60000;
    }

    let dx = 0, dy = 0;
    if (!isRestingRef.current) {
      if (activeKeys.current.has('w')) dy -= 1; if (activeKeys.current.has('s')) dy += 1;
      if (activeKeys.current.has('a')) dx -= 1; if (activeKeys.current.has('d')) dx += 1;
      
      if (dx !== 0 || dy !== 0) { 
        mouseTargetPos.current = null; 
        targetEntityId.current = null; 
      } else if (mouseTargetPos.current) {
        const cur = state.playerPos; 
        const dist = Math.sqrt((mouseTargetPos.current.x - cur.x)**2 + (mouseTargetPos.current.y - cur.y)**2);
        
        const interactRange = targetEntityId.current ? 1.4 : 0.3;
        
        if (dist > interactRange) { 
          dx = (mouseTargetPos.current.x - cur.x) / dist; 
          dy = (mouseTargetPos.current.y - cur.y) / dist; 
        } else { 
          if (targetEntityId.current) { 
            if (targetEntityId.current === 'water_point') triggerDrink(); 
            else executeInteraction(targetEntityId.current); 
          } 
          mouseTargetPos.current = null; 
          targetEntityId.current = null;
        }
      }
    }

    const moveSpeed = state.weather.type === 'snow' ? 45 : 60;
    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx*dx + dy*dy);
      velocity.current.x += (dx / mag) * moveSpeed * dt;
      velocity.current.y += (dy / mag) * moveSpeed * dt;
    }
    velocity.current.x *= Math.max(0, 1 - 15 * dt); velocity.current.y *= Math.max(0, 1 - 15 * dt);

    setGameState((prev: any) => {
      const now = Date.now();
      const perfNow = performance.now();
      let nextT = (prev.time + 0.1) % 2400;
      let respawned: Entity[] = []; if (nextT < prev.time) { respawned = spawnEntities(280); showMessage('new_day'); }
      
      let nextWeather = { ...prev.weather };
      // Soft transition speed reduced significantly from 0.2 to 0.04 per second
      const transitionSpeed = 0.04;
      if (nextWeather.type !== targetWeather.current) { 
        nextWeather.intensity = Math.max(0, nextWeather.intensity - dt * transitionSpeed); 
        if (nextWeather.intensity <= 0) nextWeather.type = targetWeather.current; 
      } else {
        nextWeather.intensity = Math.min(1.0, nextWeather.intensity + dt * transitionSpeed);
      }

      const nextProjectiles = prev.projectiles.map((p: any) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt })).filter((p: any) => p.life > 0);
      const nextRipples = (prev.ripples || []).filter((r: any) => perfNow - r.startTime < 1000);
      let pHealthMod = 0; let attacked = false;

      const nextEntities = [...prev.entities, ...respawned].map(ent => {
        if (!['deer', 'rabbit', 'bear', 'scorpion', 'crab'].includes(ent.type)) return ent;
        const d = Math.sqrt((ent.x - prev.playerPos.x)**2 + (ent.y - prev.playerPos.y)**2);
        let nX = ent.x; let nY = ent.y; let aC = (ent.attackCooldown || 0) - dt;
        if (['deer', 'rabbit'].includes(ent.type)) {
          if (d < 5 || ent.isFleeing) { const edx = ent.x - prev.playerPos.x; const edy = ent.y - prev.playerPos.y; const em = Math.sqrt(edx*edx + edy*edy); nX += (edx/em) * 4 * dt; nY += (edy/em) * 4 * dt; if (d > 12) ent.isFleeing = false; }
        } else if (['bear', 'scorpion', 'crab'].includes(ent.type)) {
          if (d < 7) {
            if (d < 1.3) { if (!isRestingRef.current && aC <= 0 && now - prev.playerStats.lastDamageTime > PLAYER_INVINCIBILITY_MS) { pHealthMod -= ent.type === 'bear' ? 3 : 1; aC = 2.0; attacked = true; } }
            else {
              const hdx = prev.playerPos.x - ent.x; const hdy = prev.playerPos.y - ent.y; const hm = Math.sqrt(hdx*hdx + hdy*hdy);
              let hostileSpeed = 2.5;
              if (ent.type === 'bear') hostileSpeed = 4.5;
              if (ent.type === 'crab') hostileSpeed = 1.2;
              nX += (hdx/hm) * hostileSpeed * dt; nY += (hdy/hm) * hostileSpeed * dt; 
            }
          }
        }
        return { ...ent, x: Math.max(2, Math.min(WORLD_SIZE-2, nX)), y: Math.max(2, Math.min(WORLD_SIZE-2, nY)), attackCooldown: aC };
      });

      const updatedEnts = nextEntities.filter(e => e.type !== 'campfire' || !e.spawnTime || now - e.spawnTime < CAMPFIRE_LIFESPAN);
      const mX = velocity.current.x * dt; const mY = velocity.current.y * dt;
      const coll = (px: number, py: number) => getTileType(px, py) === 'water' || updatedEnts.some(e => !['rabbit', 'scorpion', 'deer', 'crab', 'road', 'bridge'].includes(e.type) && Math.sqrt((e.x - px)**2 + (e.y - py)**2) < 0.55);
      
      let fX = prev.playerPos.x; let fY = prev.playerPos.y;
      
      if (!coll(fX + mX, fY + mY)) { 
        fX += mX; fY += mY; 
      } else { 
        if (mouseTargetPos.current) {
          mouseTargetPos.current = null;
          targetEntityId.current = null;
        }
        if (!coll(fX + mX, fY)) fX += mX; 
        if (!coll(fX, fY + mY)) fY += mY; 
      }
      
      let nH = prev.playerStats.health + pHealthMod; if (pHealthMod < 0) showMessage('danger');
      if (prev.playerStats.hunger <= 0 || prev.playerStats.thirst <= 0) nH -= 0.1;
      if (nH <= 0) return { ...prev, isDead: true, playerStats: { ...prev.playerStats, health: 0 } };

      let facing = prev.playerStats.facing;
      if (dx !== 0 || dy !== 0) { const a = Math.atan2(dy, dx); if (a >= -Math.PI/4 && a < Math.PI/4) facing = 'se'; else if (a >= Math.PI/4 && a < 3*Math.PI/4) facing = 'sw'; else if (a >= 3*Math.PI/4 || a < -3*Math.PI/4) facing = 'nw'; else facing = 'ne'; }

      return { ...prev, playerPos: { x: fX, y: fY }, entities: updatedEnts, projectiles: nextProjectiles, ripples: nextRipples, weather: nextWeather, playerStats: { ...prev.playerStats, facing, health: Math.min(prev.playerStats.maxHealth, nH), lastDamageTime: pHealthMod < 0 ? now : prev.playerStats.lastDamageTime, lastCombatDamageTime: attacked ? now : prev.playerStats.lastCombatDamageTime, isWalking: Math.sqrt(velocity.current.x**2 + velocity.current.y**2) > 0.4, hunger: Math.max(0, prev.playerStats.hunger - 0.0007), thirst: Math.max(0, prev.playerStats.thirst - 0.0010) }, time: nextT };
    });
    requestRef.current = requestAnimationFrame(update);
  }, [showMessage, executeInteraction, triggerDrink]);

  useEffect(() => { requestRef.current = requestAnimationFrame(update); return () => cancelAnimationFrame(requestRef.current); }, [update]);

  useEffect(() => {
    const onKD = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'f') setUiState(s => ({ ...s, inventoryOpen: !s.inventoryOpen, craftingOpen: false, settingsOpen: false }));
      if (k === 'c') setUiState(s => ({ ...s, craftingOpen: !s.craftingOpen, inventoryOpen: false, settingsOpen: false }));
      if (k === 'escape') {
        if (uiStateRef.current.inventoryOpen || uiStateRef.current.craftingOpen || uiStateRef.current.settingsOpen) {
          setUiState(s => ({ ...s, craftingOpen: false, inventoryOpen: false, settingsOpen: false }));
        } else if (gameStateRef.current.gameStarted && !gameStateRef.current.isDead) {
          setGameState((p: any) => ({ ...p, gameStarted: false }));
        }
      }
      
      if (isPausedRef.current) return;
      activeKeys.current.add(k);
      
      if (k >= '1' && k <= '9') {
        const usable = (gameStateRef.current.inventory as Item[]).filter(i => ['tool', 'weapon', 'food'].includes(i.type));
        const uniqueItems = Array.from(new Set(usable.map(i => i.id))).map(id => usable.find(i => i.id === id));
        const item = uniqueItems[parseInt(k) - 1];
        if (item) {
          if (item.type === 'food') {
            setGameState((p: any) => {
              const idx = p.inventory.findIndex((i: any) => i.id === item.id);
              if (idx === -1) return p;
              let ni = [...p.inventory]; ni[idx].quantity -= 1; if (ni[idx].quantity <= 0) ni.splice(idx, 1);
              return { ...p, inventory: ni, playerStats: { ...p.playerStats, hunger: Math.min(100, p.playerStats.hunger + (item.effect?.hunger || 0)), thirst: Math.min(100, p.playerStats.thirst + (item.effect?.thirst || 0)), health: Math.min(p.playerStats.maxHealth, p.playerStats.health + (item.effect?.health || 0)) } };
            });
            SoundManager.playGather('bush_berry');
          } else {
            setGameState((p: any) => ({ ...p, playerStats: { ...p.playerStats, equippedItemId: p.playerStats.equippedItemId === item.id ? null : item.id } }));
            SoundManager.playUI('equip');
          }
        }
      }
      if (k === 'e') handleInteract();
    };
    const onKU = (e: KeyboardEvent) => activeKeys.current.delete(e.key.toLowerCase());
    const onWheel = (e: WheelEvent) => { if (isPausedRef.current) return; setGameState((p: any) => ({ ...p, viewConfig: { ...p.viewConfig, zoom: Math.max(0.4, Math.min(2.5, p.viewConfig.zoom + (e.deltaY > 0 ? -0.1 : 0.1))) } })); };
    
    const onMD = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName !== 'CANVAS' || isPausedRef.current) return;
      if (e.button === 1 || e.button === 2) { 
        isPanning.current = true; 
        lastMousePos.current = { x: e.clientX, y: e.clientY }; 
        e.preventDefault();
        return; 
      }
      const wp = screenToWorld(e.clientX, e.clientY); if (!wp) return;
      
      if (getTileType(wp.x, wp.y) === 'water') {
        setGameState((prev: any) => ({
          ...prev,
          ripples: [...(prev.ripples || []), { id: `ripple-${Date.now()}-${Math.random()}`, x: wp.x, y: wp.y, startTime: performance.now() }]
        }));
      }

      if (gameStateRef.current.playerStats.equippedItemId === 'bow') {
        const arrowIdx = (gameStateRef.current.inventory as Item[]).findIndex(i => i.id === 'arrow');
        if (arrowIdx > -1) {
          const adx = wp.x - gameStateRef.current.playerPos.x; const ady = wp.y - gameStateRef.current.playerPos.y; const ad = Math.sqrt(adx*adx + ady*ady);
          if (ad > 0.1) {
            const p: Projectile = { id: `arrow-${Date.now()}`, x: gameStateRef.current.playerPos.x, y: gameStateRef.current.playerPos.y, vx: (adx/ad)*12, vy: (ady/ad)*12, damage: 5, ownerId: 'player', life: 2.0 };
            setGameState((prev: any) => {
              let ni = [...prev.inventory]; ni[arrowIdx].quantity -= 1; if (ni[arrowIdx].quantity <= 0) ni.splice(arrowIdx, 1);
              return { ...prev, inventory: ni, projectiles: [...prev.projectiles, p] };
            }); SoundManager.playToolAction('bow'); return;
          }
        } else showMessage('out_of_arrows');
      }

      // Mouse click unified interaction:
      // Clicking an entity now immediately evaluates if interaction is possible, or schedules movement to it.
      const clickedEntity = gameStateRef.current.entities.find((ent: any) => Math.sqrt((ent.x - wp.x)**2 + (ent.y - wp.y)**2) < 1.2);
      if (clickedEntity) {
        // If already in range, act like 'E' was pressed immediately.
        const d = Math.sqrt((clickedEntity.x - gameStateRef.current.playerPos.x)**2 + (clickedEntity.y - gameStateRef.current.playerPos.y)**2);
        if (d < 1.8) {
          executeInteraction(clickedEntity.id);
          mouseTargetPos.current = null;
        } else {
          mouseTargetPos.current = { x: clickedEntity.x, y: clickedEntity.y };
          targetEntityId.current = clickedEntity.id;
        }
      } else {
        mouseTargetPos.current = wp;
        targetEntityId.current = getTileType(wp.x, wp.y) === 'water' ? 'water_point' : null;
        // If clicking water and in range, drink immediately.
        if (targetEntityId.current === 'water_point') {
           let nearWater = false;
           for (let dx = -1.2; dx <= 1.2; dx += 0.4) { for (let dy = -1.2; dy <= 1.2; dy += 0.4) { if (getTileType(gameStateRef.current.playerPos.x + dx, gameStateRef.current.playerPos.y + dy) === 'water') { nearWater = true; break; } } if (nearWater) break; }
           if (nearWater) { triggerDrink(); mouseTargetPos.current = null; }
        }
      }
    };
    
    const onMM = (e: MouseEvent) => { if (isPanning.current) { const dx = e.clientX - lastMousePos.current.x; const dy = e.clientY - lastMousePos.current.y; lastMousePos.current = { x: e.clientX, y: e.clientY }; setGameState((p: any) => ({ ...p, viewConfig: { ...p.viewConfig, cameraOffsetX: p.viewConfig.cameraOffsetX + dx, cameraOffsetY: p.viewConfig.cameraOffsetY + dy } })); } };
    const onMU = () => isPanning.current = false;
    
    window.addEventListener('keydown', onKD); 
    window.addEventListener('keyup', onKU); 
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousedown', onMD); 
    window.addEventListener('mousemove', onMM); 
    window.addEventListener('mouseup', onMU);
    window.addEventListener('contextmenu', e => e.preventDefault());
    
    return () => {
      window.removeEventListener('keydown', onKD); 
      window.removeEventListener('keyup', onKU); 
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousedown', onMD); 
      window.removeEventListener('mousemove', onMM); 
      window.removeEventListener('mouseup', onMU);
    };
  }, [handleInteract, screenToWorld, showMessage, executeInteraction, triggerDrink]);

  const handleStart = useCallback(() => {
    SoundManager.init(); SoundManager.startForestAmbience(); window.focus();
    const spawnX = WORLD_SIZE / 2;
    const spawnY = WORLD_SIZE / 2 + 8;
    // Reduced entity count by 30% from 10,000 to 7,000
    const newEntities = spawnEntities(7000, spawnX, spawnY, 15);
    const safePos = findSafePlayerSpawn(spawnX, spawnY, newEntities);
    setGameState((prev: any) => ({ 
      ...prev, 
      gameStarted: true, 
      entities: newEntities, 
      inventory: [], 
      playerPos: safePos, 
      playerStats: { ...INITIAL_STATS, character: prev.playerStats.character }, 
      isDead: false 
    }));
  }, []);

  const handleContinue = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { const loaded = JSON.parse(saved); setGameState((p: any) => ({ ...loaded, settings: p.settings, gameStarted: true, isDead: false })); SoundManager.init(); SoundManager.startForestAmbience(); window.focus(); } catch(e) { showMessage("Failed to load.", true); } }
  }, [showMessage]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950">
      {!gameState.gameStarted ? (
        <MainMenu hasActiveSession={hasSave} onStart={handleStart} onContinue={handleContinue} settings={gameState.settings} onUpdateSettings={s => setGameState((p: any) => ({...p, settings: s}))} playerStats={gameState.playerStats} onUpdatePlayerStats={ps => setGameState((p: any) => ({...p, playerStats: ps}))} />
      ) : (
        <>
          <GameCanvas gameState={gameState} gameStateRef={gameStateRef} mouseTargetRef={mouseTargetPos} />
          {isPaused && !gameState.isDead && (
            <div className="absolute inset-0 z-40 bg-black/10 backdrop-blur-[1px] pointer-events-none flex items-start justify-center pt-24">
              <div className="px-8 py-3 bg-stone-900/80 border border-white/10 rounded-full shadow-2xl">
                <span className="text-white/60 font-black text-[12px] uppercase tracking-[0.5em] animate-pulse">Game Paused</span>
              </div>
            </div>
          )}
          {isResting && (
            <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
              <div className="text-white font-black text-4xl animate-pulse flex flex-col items-center">
                <span>💤</span> <span className="text-[12px] mt-2 opacity-50 tracking-[0.3em] uppercase">{t('rest_tent')}</span>
              </div>
            </div>
          )}
          <HUD stats={gameState.playerStats} time={gameState.time} message={uiState.message} gameState={gameState} onAction={(action, data) => {
            if (action === 'use' || action === 'equip') {
              const item = data as Item;
              if (item.type === 'food') setGameState((p: any) => {
                const idx = p.inventory.findIndex((i: any) => i.id === item.id);
                if (idx === -1) return p;
                let ni = [...p.inventory]; ni[idx].quantity -= 1; if (ni[idx].quantity <= 0) ni.splice(idx, 1);
                return { ...p, inventory: ni, playerStats: { ...p.playerStats, hunger: Math.min(100, p.playerStats.hunger + (item.effect?.hunger || 0)), thirst: Math.min(100, p.playerStats.thirst + (item.effect?.thirst || 0)), health: Math.min(p.playerStats.maxHealth, p.playerStats.health + (item.effect?.health || 0)) } };
              });
              else {
                setGameState((p: any) => ({ ...p, playerStats: { ...p.playerStats, equippedItemId: p.playerStats.equippedItemId === item.id ? null : item.id } }));
                SoundManager.playUI('equip');
              }
            } else if (action === 'reorder') {
              setGameState((p: any) => { let ni = [...p.inventory]; const it = ni[data.fromIdx]; ni.splice(data.fromIdx, 1); ni.splice(data.toIdx, 0, it); return { ...p, inventory: ni }; });
            } else if (action === 'repair_all') {
              setGameState((p: any) => {
                let ni = [...p.inventory]; const cost = 5;
                const wood = ni.filter(i => i.id === 'wood').reduce((s, i) => s + i.quantity, 0);
                const stone = ni.filter(i => i.id === 'stone').reduce((s, i) => s + i.quantity, 0);
                if (wood >= cost && stone >= cost) {
                  ni = ni.map(i => (['tool', 'weapon'].includes(i.type) && i.durability !== undefined) ? { ...i, durability: i.maxDurability } : i);
                  let wD = cost; let sD = cost;
                  ni = ni.map(i => {
                    if (i.id === 'wood' && wD > 0) { const d = Math.min(i.quantity, wD); wD -= d; return { ...i, quantity: i.quantity - d }; }
                    if (i.id === 'stone' && sD > 0) { const d = Math.min(i.quantity, sD); sD -= d; return { ...i, quantity: i.quantity - d }; }
                    return i;
                  }).filter(i => i.quantity > 0);
                  showMessage('Repaired!', true); SoundManager.playUI('fanfare'); return { ...p, inventory: ni };
                } else { showMessage('need_resources'); return p; }
              });
            }
          }} onZoom={() => {}} onRotate={() => {}} onOpenSettings={() => setUiState(s => ({ ...s, settingsOpen: true, inventoryOpen: false, craftingOpen: false }))} />
          <div className="absolute top-6 right-6 pointer-events-none z-50">
            <Minimap playerPos={gameState.playerPos} entities={gameState.entities} playerStats={gameState.playerStats} language={gameState.settings.language} />
          </div>
          {uiState.inventoryOpen && <Inventory items={gameState.inventory} equippedItemId={gameState.playerStats.equippedItemId} isNearWorkbench={!!gameState.entities.find(e => e.type === 'workbench' && Math.sqrt((e.x-gameState.playerPos.x)**2+(e.y-gameState.playerPos.y)**2)<2.5)} onAction={() => {}} onClose={() => setUiState(s => ({...s, inventoryOpen: false}))} onSwitchToCrafting={() => setUiState(s => ({...s, inventoryOpen: false, craftingOpen: true}))} language={gameState.settings.language} />}
          {uiState.craftingOpen && <Crafting inventory={gameState.inventory} playerLevel={gameState.playerStats.level} isNearWorkbench={!!gameState.entities.find(e => e.type === 'workbench' && Math.sqrt((e.x-gameState.playerPos.x)**2+(e.y-gameState.playerPos.y)**2)<2.5)} onCraft={(recipeId) => {
              const recipe = RECIPES.find(r => r.id === recipeId); if (!recipe) return;
              setGameState((prev: any) => {
                if (!Object.entries(recipe.ingredients).every(([id, q]) => prev.inventory.filter((i: any) => i.id === id).reduce((acc: number, curr: any) => acc + curr.quantity, 0) >= (q as number))) return prev;
                if (!canCarryItem(recipe.output.id, recipe.output.quantity, prev.inventory)) { showMessage('inv_full'); return prev; }
                let ni = [...prev.inventory];
                Object.entries(recipe.ingredients).forEach(([id, q]) => { let rem = q as number; while (rem > 0) { const idx = ni.findIndex(i => i.id === id); if (idx > -1) { const d = Math.min(rem, ni[idx].quantity); ni[idx].quantity -= d; rem -= d; if (ni[idx].quantity <= 0) ni.splice(idx, 1); } else break; } });
                let uE = [...prev.entities]; 
                let pD = false;
                let nextEq = prev.playerStats.equippedItemId;
                
                if (recipe.output.type === 'structure') {
                   const spot = findPlacementSpot(prev.playerPos.x, prev.playerPos.y, uE); 
                   if (spot) { 
                     uE.push({ id: `struct-${Date.now()}`, x: spot.x, y: spot.y, type: recipe.output.id as EntityType, health: 10, maxHealth: 10, spawnTime: Date.now() }); 
                     pD = true; showMessage(t('placed')+': '+recipe.name, true); SoundManager.playUI('fanfare'); 
                   } 
                }
                
                if (!pD) { 
                  ni = addItemsToInventory(recipe.output.id, recipe.output.quantity, ni); 
                  SoundManager.playUI('fanfare'); 
                  showMessage(t('crafted')+': '+recipe.name, true);
                  if ((recipe.output.type === 'tool' || recipe.output.type === 'weapon') && !nextEq) {
                    nextEq = recipe.output.id;
                  }
                }
                return { ...prev, inventory: ni, entities: uE, playerStats: { ...prev.playerStats, equippedItemId: nextEq } };
              });
          }} onClose={() => setUiState(s => ({...s, craftingOpen: false}))} onSwitchToInventory={() => setUiState(s => ({...s, inventoryOpen: true, craftingOpen: false}))} language={gameState.settings.language} />}
          {uiState.settingsOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-[2.5rem] p-8 text-white shadow-2xl">
                <h2 className="text-3xl font-black mb-8 tracking-tighter text-amber-500 uppercase">{t('settings')}</h2>
                <button onClick={() => setGameState((p: any) => ({...p, settings: {...p.settings, soundEnabled: !p.settings.soundEnabled}}))} className={`w-full py-3.5 rounded-xl font-black text-[12px] border mb-6 ${gameState.settings.soundEnabled ? 'bg-amber-500 text-stone-900 border-amber-500' : 'bg-white/5 border-white/10 text-white/50'}`}>{t('sound')}: {gameState.settings.soundEnabled ? 'ON' : 'OFF'}</button>
                <div className="flex flex-col gap-3 mb-8">
                  <span className="text-[12px] font-black tracking-widest text-white/40 uppercase">{t('language')}</span>
                  <div className="grid grid-cols-2 gap-3">{(['en', 'tr'] as Language[]).map(l => ( <button key={l} onClick={() => setGameState((p: any) => ({...p, settings: {...p.settings, language: l}}))} className={`py-3.5 rounded-xl font-black text-[12px] uppercase border transition-all ${gameState.settings.language === l ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-white/5 border-white/10 text-white/50'}`}>{l === 'en' ? 'English' : 'Türkçe'}</button>)) }</div>
                </div>
                <button onClick={() => setUiState(s => ({...s, settingsOpen: false}))} className="w-full py-4 bg-white text-stone-950 font-black rounded-xl uppercase tracking-widest text-[12px] hover:bg-amber-500 transition-colors shadow-lg active:scale-95">{t('back')}</button>
              </div>
            </div>
          )}
          {gameState.isDead && <DeathScreen stats={gameState.playerStats} language={gameState.settings.language} onRetry={() => { handleStart(); }} />}
        </>
      )}
    </div>
  );
};
export default App;
