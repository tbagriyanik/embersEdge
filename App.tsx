
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Inventory } from './components/Inventory';
import { Crafting } from './components/Crafting';
import { MobileControls } from './components/MobileControls';
import { MainMenu } from './components/MainMenu';
import { DeathScreen } from './components/DeathScreen';
import { SoundManager } from './components/SoundManager';
import { Minimap } from './components/Minimap';
import { PlayerStats, Item, Entity, GameState, EntityType, TileType, GameSettings, Language, Projectile, WeatherType } from './types';
import { INITIAL_STATS, WORLD_SIZE, ITEMS, TIME_SCALE, RECIPES, TRANSLATIONS, TILE_WIDTH, TILE_HEIGHT, SAVE_KEY, MAX_INVENTORY_SLOTS } from './constants';

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

export const spawnEntities = (count: number): Entity[] => {
  const entities: Entity[] = [];
  const types: EntityType[] = [
    'tree_oak', 'tree_pine', 'tree_palm', 
    'rock_standard', 'rock_iron', 
    'bush_berry', 'bush_flower', 'bush_dry',
    'deer', 'rabbit', 'bear', 'scorpion', 'crab'
  ];

  for (let i = 0; i < count; i++) {
    const x = Math.random() * (WORLD_SIZE - 10) + 5;
    const y = Math.random() * (WORLD_SIZE - 10) + 5;
    const tile = getTileType(x, y);
    if (tile === 'water') continue;
    let type = types[Math.floor(Math.random() * types.length)];
    if (tile === 'sand') {
      type = Math.random() > 0.5 ? 'tree_palm' : (Math.random() > 0.5 ? 'scorpion' : 'crab');
    } else {
      if (type === 'tree_palm' || type === 'scorpion' || type === 'crab') type = 'tree_oak';
    }
    if (type === 'bear' && Math.random() > 0.1) continue;
    entities.push({
      id: `ent-${i}-${Date.now()}`,
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

export const findPlacementSpot = (x: number, y: number, entities: Entity[]): { x: number; y: number } | null => {
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
  const distance = 1.6;
  for (const angle of angles) {
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;
    
    if (targetX < 2 || targetX >= WORLD_SIZE - 2 || targetY < 2 || targetY >= WORLD_SIZE - 2) continue;
    if (getTileType(targetX, targetY) === 'water') continue;
    
    const collides = entities.some(e => 
      !['road', 'bridge', 'rabbit', 'scorpion', 'deer'].includes(e.type) && 
      Math.sqrt((e.x - targetX) ** 2 + (e.y - targetY) ** 2) < 0.8
    );
    
    if (!collides) return { x: targetX, y: targetY };
  }
  return null;
};

const CAMPFIRE_LIFESPAN = 60000;
const PLAYER_INVINCIBILITY_MS = 1000;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState & { 
    birds: {x: number, y: number, vx: number, vy: number, flap: number}[],
    ripples: {x: number, y: number, startTime: number}[],
    particles: {id: string, x: number, y: number, vx: number, vy: number, life: number, color: string, size: number}[],
    shake: number,
    isRecentlyAttackedByAnimal: boolean,
    isDead: boolean
  }>({
    playerPos: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 + 8 },
    playerStats: INITIAL_STATS,
    inventory: [],
    entities: [],
    projectiles: [],
    birds: [],
    ripples: [],
    particles: [],
    shake: 0,
    isRecentlyAttackedByAnimal: false,
    isDead: false,
    time: 600,
    isDay: true,
    gameStarted: false,
    weather: { type: 'clear', intensity: 0, transition: 0 },
    settings: { language: 'en', soundEnabled: true },
    viewConfig: { zoom: 1.0, rotation: 0, cameraOffsetX: 0, cameraOffsetY: 0 }
  });

  const [hasSave, setHasSave] = useState(false);
  const gameStateRef = useRef<any>(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { JSON.parse(saved); setHasSave(true); } catch(e) { setHasSave(false); } }
  }, []);

  useEffect(() => {
    if (!gameState.gameStarted || gameState.isDead) return;
    const saveInterval = setInterval(() => {
      const { birds, ripples, particles, shake, isRecentlyAttackedByAnimal, isDead, ...stateToSave } = gameStateRef.current;
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateToSave, gameStarted: false }));
      setHasSave(true);
    }, 10000);
    return () => clearInterval(saveInterval);
  }, [gameState.gameStarted, gameState.isDead]);

  const [uiState, setUiState] = useState({ inventoryOpen: false, craftingOpen: false, settingsOpen: false, message: '' });
  const [isResting, setIsResting] = useState(false);
  const isRestingRef = useRef(false);
  useEffect(() => { isRestingRef.current = isResting; }, [isResting]);
  
  const requestRef = useRef<number>(0);
  const activeKeys = useRef<Set<string>>(new Set());
  const velocity = useRef({ x: 0, y: 0 });
  const lastUpdate = useRef(performance.now());
  const nextWeatherTime = useRef(performance.now() + 60000 + Math.random() * 60000);
  const targetWeather = useRef<WeatherType>('clear');
  
  const mouseTargetPos = useRef<{ x: number, y: number } | null>(null);
  const targetEntityId = useRef<string | null>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const lang = gameState.settings.language;
  const t = (key: string) => TRANSLATIONS[lang][key] || key;

  const isPaused = uiState.inventoryOpen || uiState.craftingOpen || uiState.settingsOpen || gameState.isDead;

  const showMessage = useCallback((msgKey: string, direct: boolean = false) => {
    const msg = direct ? msgKey : t(msgKey);
    setUiState(prev => ({ ...prev, message: msg }));
    setTimeout(() => setUiState(prev => ({ ...prev, message: '' })), 4000);
  }, [t]);

  const handleRetry = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      playerPos: { x: WORLD_SIZE/2, y: WORLD_SIZE/2 + 8 },
      playerStats: INITIAL_STATS,
      inventory: [],
      entities: spawnEntities(8000),
      isDead: false,
      gameStarted: true
    }));
  }, []);

  const canCarryItem = useCallback((itemId: string, quantity: number, currentInventory: Item[]): boolean => {
    const itemTemplate = ITEMS[itemId];
    if (!itemTemplate) return true;
    if (itemTemplate.stackable) {
      const existingStack = currentInventory.find(i => i.id === itemId && i.quantity < (i.maxStack || 99));
      if (existingStack) return true;
    }
    return currentInventory.length < MAX_INVENTORY_SLOTS;
  }, []);

  const triggerDrink = useCallback(() => {
    setGameState(prev => {
      if (prev.playerStats.thirst >= 100) { showMessage('full'); return prev; }
      showMessage('drink_water');
      return { ...prev, playerStats: { ...prev.playerStats, thirst: Math.min(100, prev.playerStats.thirst + 20) } };
    });
  }, [showMessage]);

  const triggerRest = useCallback(() => {
    const state = gameStateRef.current;
    if (!state) return;
    const nearTent = state.entities.find((e: Entity) => e.type === 'tent' && Math.sqrt((e.x - state.playerPos.x)**2 + (e.y - state.playerPos.y)**2) < 2.0);
    if (!nearTent) { showMessage('need_tent'); return; }
    if (isResting) return;
    setIsResting(true);
    SoundManager.playUI('fanfare');
    setTimeout(() => {
      setIsResting(false);
      setGameState(prev => ({
        ...prev,
        time: (prev.time + 600) % 2400,
        playerStats: {
          ...prev.playerStats,
          health: Math.min(prev.playerStats.maxHealth, prev.playerStats.health + 40),
          stamina: prev.playerStats.maxStamina,
          hunger: Math.max(0, prev.playerStats.hunger - 15)
        }
      }));
    }, 2000);
  }, [isResting, showMessage]);

  const handleEntityDeath = useCallback((target: Entity, prev: any): any => {
    const xpGain = ['deer', 'rabbit', 'bear', 'scorpion', 'crab'].includes(target.type) ? 60 : 30;
    const updatedEntities = prev.entities.filter((e: Entity) => e.id !== target.id);
    let rewardId = 'berry';
    let qty = 1;
    if (target.type.includes('tree')) rewardId = 'wood';
    else if (target.type.includes('rock')) {
        rewardId = target.type === 'rock_iron' ? 'iron' : 'stone';
    }
    else if (['deer', 'bear', 'scorpion', 'crab'].includes(target.type)) { 
      rewardId = 'meat_raw'; 
      qty = target.type === 'bear' ? 3 : (target.type === 'deer' ? 2 : 1); 
    }
    else if (target.type === 'rabbit') { rewardId = 'meat_raw'; qty = 1; }
    
    const rewardItem = { ...ITEMS[rewardId], quantity: qty };
    const newInv = [...prev.inventory];
    
    if (!canCarryItem(rewardId, qty, newInv)) {
       showMessage('inv_full');
       return { ...prev, entities: updatedEntities };
    }

    const existingIdx = newInv.findIndex(i => i.id === rewardItem.id && (i.quantity + qty <= (i.maxStack || 99)));
    if (existingIdx > -1) newInv[existingIdx].quantity += qty;
    else newInv.push(rewardItem);
    
    let newXp = prev.playerStats.xp + xpGain;
    let newLevel = prev.playerStats.level;
    const threshold = newLevel * 250;
    if (newXp >= threshold) {
      newLevel += 1;
      newXp -= threshold;
      SoundManager.playUI('fanfare');
      setTimeout(() => showMessage('level_up'), 500);
    }
    return {
      ...prev,
      entities: updatedEntities,
      inventory: newInv,
      playerStats: { 
        ...prev.playerStats, 
        xp: newXp, level: newLevel,
        health: newLevel > prev.playerStats.level ? prev.playerStats.maxHealth : prev.playerStats.health,
        stamina: newLevel > prev.playerStats.level ? prev.playerStats.maxStamina : prev.playerStats.stamina,
        lastInteractTime: performance.now() 
      }
    };
  }, [showMessage, canCarryItem]);

  const executeInteraction = useCallback((entityId: string) => {
    if (isPaused) return;

    setGameState(prev => {
      const target = prev.entities.find(e => e.id === entityId);
      if (!target) return prev;
      
      const isTool = prev.playerStats.equippedItemId !== null;
      const interactRange = isTool ? 1.8 : 1.6;
      const dist = Math.sqrt((target.x - prev.playerPos.x)**2 + (target.y - prev.playerPos.y)**2);
      if (dist > interactRange) return prev;
      
      if (target.type === 'tent') { triggerRest(); return prev; }

      if (target.type === 'workbench') {
        setUiState(s => ({ ...s, inventoryOpen: true }));
        showMessage('Repair Workbench ready!', true);
        return prev;
      }

      const gatherables = ['tree_oak', 'tree_pine', 'tree_palm', 'rock_standard', 'rock_iron', 'bush_berry', 'deer', 'rabbit', 'bear', 'scorpion', 'crab'];
      if (gatherables.includes(target.type)) {
         let predictedReward = 'berry';
         if (target.type.includes('tree')) predictedReward = 'wood';
         else if (target.type.includes('rock')) predictedReward = target.type === 'rock_iron' ? 'iron' : 'stone';
         else if (['deer', 'rabbit', 'bear', 'scorpion', 'crab'].includes(target.type)) predictedReward = 'meat_raw';
         
         if (!canCarryItem(predictedReward, 1, prev.inventory)) {
             showMessage('inv_full');
             return prev;
         }
      }

      if (target.type === 'campfire') {
         const rawIdx = prev.inventory.findIndex(i => i.id === 'meat_raw');
         if (rawIdx > -1) {
            SoundManager.playGather('bush_berry'); showMessage('meat_cooked');
            let ni = [...prev.inventory]; ni[rawIdx].quantity -= 1;
            if (ni[rawIdx].quantity <= 0) ni.splice(rawIdx, 1);
            const cookedIdx = ni.findIndex(i => i.id === 'meat_cooked');
            if (cookedIdx > -1) ni[cookedIdx].quantity += 1;
            else ni.push({ ...ITEMS.meat_cooked, quantity: 1 });
            return { ...prev, inventory: ni };
         } else { showMessage('Need Raw Meat!', true); return prev; }
      }

      SoundManager.playGather(target.type, prev.playerStats.equippedItemId);
      
      const newParticles = [...prev.particles];
      const isRock = target.type.includes('rock');
      const isTree = target.type.includes('tree');
      const particleColor = isTree ? '#78350f' : (isRock ? '#475569' : '#166534');
      for (let i = 0; i < 5; i++) {
        newParticles.push({
          id: `p-${Date.now()}-${i}-${Math.random()}`,
          x: target.x + (Math.random() - 0.5) * 0.5,
          y: target.y + (Math.random() - 0.5) * 0.5,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 2,
          life: 0.8 + Math.random() * 0.5,
          color: particleColor,
          size: 2 + Math.random() * 3
        });
      }

      const damage = prev.playerStats.equippedItemId ? (ITEMS[prev.playerStats.equippedItemId]?.effect?.damage || 1) : 1;
      const newHealth = target.health - damage;
      
      let newInventory = [...prev.inventory];
      let newEquippedId = prev.playerStats.equippedItemId;
      if (newEquippedId) {
        const itemIdx = newInventory.findIndex(i => i.id === newEquippedId);
        if (itemIdx > -1) {
          const item = { ...newInventory[itemIdx] };
          if (item.durability !== undefined) {
            const isDesperate = prev.playerStats.health < 25 || prev.playerStats.hunger < 20 || prev.playerStats.thirst < 20;
            const consumeDurability = !isDesperate || Math.random() > 0.5;
            if (consumeDurability) item.durability -= 1;
            if (item.durability <= 0) {
              newInventory.splice(itemIdx, 1);
              showMessage('broken');
              newEquippedId = null;
            } else {
              newInventory[itemIdx] = item;
            }
          }
        }
      }

      const updatedEntities = prev.entities.map(e => {
        if (e.id === target.id) {
          const isHostile = ['bear', 'scorpion', 'crab'].includes(e.type);
          return { ...e, health: newHealth, aiState: isHostile ? 'hunting' : 'fleeing', isFleeing: !isHostile } as Entity;
        }
        return e;
      });

      const nextStateBase = { 
        ...prev, 
        inventory: newInventory, 
        entities: updatedEntities, 
        particles: newParticles,
        shake: 0,
        playerStats: { ...prev.playerStats, equippedItemId: newEquippedId, lastInteractTime: performance.now() } 
      };

      if (newHealth <= 0) return handleEntityDeath(target, nextStateBase);
      return nextStateBase;
    });
  }, [showMessage, triggerRest, handleEntityDeath, isPaused, canCarryItem]);

  const handleInteract = useCallback(() => {
    if (isPaused) return;
    const state = gameStateRef.current;
    const nearestAnimal = state.entities.find((e: Entity) => ['deer', 'rabbit', 'bear', 'scorpion', 'crab'].includes(e.type) && Math.sqrt((e.x - state.playerPos.x)**2 + (e.y - state.playerPos.y)**2) < 1.8);
    if (nearestAnimal) { executeInteraction(nearestAnimal.id); return; }
    const nearestObj = state.entities.find((e: any) => !['deer', 'rabbit', 'bear', 'scorpion', 'crab', 'road', 'bridge'].includes(e.type) && Math.sqrt((e.x - state.playerPos.x)**2 + (e.y - state.playerPos.y)**2) < 1.6);
    if (nearestObj) { executeInteraction(nearestObj.id); return; } 
    let nearWater = false;
    for (let dx = -1.2; dx <= 1.2; dx += 0.4) {
      for (let dy = -1.2; dy <= 1.2; dy += 0.4) {
        if (getTileType(state.playerPos.x + dx, state.playerPos.y + dy) === 'water') { nearWater = true; break; }
      }
      if (nearWater) break;
    }
    if (nearWater) { triggerDrink(); return; }
    triggerRest();
  }, [triggerRest, executeInteraction, triggerDrink, isPaused]);

  const handleHUDAction = useCallback((action: 'use' | 'reorder' | 'equip' | 'repair' | 'repair_all', data: any) => {
    if (action === 'use' || action === 'equip') {
       const item = data as Item;
       if (item.type === 'food') {
          setGameState(prev => ({
            ...prev,
            playerStats: {
              ...prev.playerStats,
              hunger: Math.min(100, prev.playerStats.hunger + (item.effect?.hunger || 0)),
              thirst: Math.min(100, prev.playerStats.thirst + (item.effect?.thirst || 0)),
              health: Math.min(prev.playerStats.maxHealth, prev.playerStats.health + (item.effect?.health || 0))
            },
            inventory: prev.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0)
          }));
          SoundManager.playGather('bush_berry');
       } else if (item.type === 'tool' || item.type === 'weapon') {
          SoundManager.playUI('equip');
          setGameState(prev => ({ ...prev, playerStats: { ...prev.playerStats, equippedItemId: prev.playerStats.equippedItemId === item.id ? null : item.id } }));
       }
    } else if (action === 'reorder') {
       setGameState(prev => {
          const { fromIdx, toIdx } = data;
          const ni = [...prev.inventory]; const it = ni[fromIdx];
          ni.splice(fromIdx, 1); ni.splice(toIdx, 0, it);
          return { ...prev, inventory: ni };
       });
    } else if (action === 'repair') {
      const itemToRepair = data as Item;
      setGameState(prev => {
        const ni = [...prev.inventory];
        const woodIdx = ni.findIndex(i => i.id === 'wood');
        const stoneIdx = ni.findIndex(i => i.id === 'stone');
        if (woodIdx > -1 && ni[woodIdx].quantity >= 2 && stoneIdx > -1 && ni[stoneIdx].quantity >= 2) {
          const itemIdx = ni.findIndex(i => i.id === itemToRepair.id);
          if (itemIdx > -1) {
            const item = { ...ni[itemIdx] };
            item.durability = item.maxDurability;
            ni[itemIdx] = item;
            ni[woodIdx].quantity -= 2;
            ni[stoneIdx].quantity -= 2;
            const filteredNi = ni.filter(i => i.quantity > 0);
            showMessage('Repaired!', true);
            SoundManager.playUI('fanfare');
            return { ...prev, inventory: filteredNi };
          }
        } else {
          showMessage('need_resources');
        }
        return prev;
      });
    } else if (action === 'repair_all') {
      setGameState(prev => {
        const ni = [...prev.inventory];
        const woodIdx = ni.findIndex(i => i.id === 'wood');
        const stoneIdx = ni.findIndex(i => i.id === 'stone');
        const damagedItems = ni.filter(item => (item.type === 'tool' || item.type === 'weapon') && (item.durability || 0) < (item.maxDurability || 0));
        
        if (damagedItems.length === 0) {
          showMessage('Nothing to repair.', true);
          return prev;
        }

        if (woodIdx > -1 && ni[woodIdx].quantity >= 5 && stoneIdx > -1 && ni[stoneIdx].quantity >= 5) {
          const finalInv = ni.map(item => {
            if (item.type === 'tool' || item.type === 'weapon') {
              return { ...item, durability: item.maxDurability };
            }
            if (item.id === 'wood') return { ...item, quantity: item.quantity - 5 };
            if (item.id === 'stone') return { ...item, quantity: item.quantity - 5 };
            return item;
          }).filter(i => i.quantity > 0);

          showMessage('All Tools Repaired!', true);
          SoundManager.playUI('fanfare');
          return { ...prev, inventory: finalInv };
        } else {
          showMessage('need_resources');
          return prev;
        }
      });
    }
  }, [showMessage]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const state = gameStateRef.current;
    if (!state) return null;
    const { zoom, cameraOffsetX, cameraOffsetY } = state.viewConfig;
    const tw = TILE_WIDTH * zoom;
    const th = TILE_HEIGHT * zoom;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const pScreenX = state.playerPos.x * tw;
    const pScreenY = state.playerPos.y * th;
    const offsetX = centerX - (pScreenX + tw / 2) + cameraOffsetX;
    const offsetY = centerY - (pScreenY + th / 2) + cameraOffsetY;
    return { x: (sx - offsetX) / tw, y: (sy - offsetY) / th };
  }, []);

  const update = useCallback((time: number) => {
    const dt = (time - lastUpdate.current) / 1000;
    lastUpdate.current = time;
    if (!gameStateRef.current.gameStarted || gameStateRef.current.isDead) { requestRef.current = requestAnimationFrame(update); return; }
    if (isPaused) { requestRef.current = requestAnimationFrame(update); return; }
    
    if (time > nextWeatherTime.current) {
      const weathers: WeatherType[] = ['clear', 'rain', 'fog', 'snow'];
      targetWeather.current = weathers[Math.floor(Math.random() * weathers.length)];
      nextWeatherTime.current = time + 60000 + Math.random() * 60000;
    }

    let dx = 0, dy = 0;
    if (!isResting) {
      if (activeKeys.current.has('w')) dy -= 1;
      if (activeKeys.current.has('s')) dy += 1;
      if (activeKeys.current.has('a')) dx -= 1;
      if (activeKeys.current.has('d')) dx += 1;
      if (dx !== 0 || dy !== 0) { mouseTargetPos.current = null; targetEntityId.current = null; }
      else if (mouseTargetPos.current) {
        const currentPos = gameStateRef.current.playerPos;
        const dist = Math.sqrt((mouseTargetPos.current.x - currentPos.x)**2 + (mouseTargetPos.current.y - currentPos.y)**2);
        if (dist > 0.2) { dx = (mouseTargetPos.current.x - currentPos.x) / dist; dy = (mouseTargetPos.current.y - currentPos.y) / dist; }
        else {
          if (targetEntityId.current) { if (targetEntityId.current === 'water_point') triggerDrink(); else executeInteraction(targetEntityId.current); targetEntityId.current = null; }
          mouseTargetPos.current = null;
        }
      }
    }

    let speedMod = 1.0;
    let staminaDrainMod = 1.0;
    let thirstDrainMod = 1.0;
    
    if (gameStateRef.current.weather.type === 'snow') speedMod = 0.75;
    if (gameStateRef.current.weather.type === 'rain') thirstDrainMod = 1.6;
    if (gameStateRef.current.weather.type === 'snow') staminaDrainMod = 1.4;

    const accel = 60 * speedMod; const friction = 15;
    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx*dx + dy*dy);
      velocity.current.x += (dx / mag) * accel * dt;
      velocity.current.y += (dy / mag) * accel * dt;
      const angle = Math.atan2(dy, dx);
      let facing: any = 'se';
      if (angle >= -Math.PI/4 && angle < Math.PI/4) facing = 'se';
      else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) facing = 'sw';
      else if (angle >= 3*Math.PI/4 || angle < -3*Math.PI/4) facing = 'nw';
      else facing = 'ne';
      setGameState(prev => ({ ...prev, playerStats: { ...prev.playerStats, facing } }));
    }
    velocity.current.x *= Math.max(0, 1 - friction * dt);
    velocity.current.y *= Math.max(0, 1 - friction * dt);
    
    setGameState(prev => {
      const now = Date.now();
      const isCurrentlyResting = isRestingRef.current;
      
      let nextWeather = { ...prev.weather };
      if (nextWeather.type !== targetWeather.current) {
        nextWeather.intensity = Math.max(0, nextWeather.intensity - dt * 0.2);
        if (nextWeather.intensity <= 0) {
          nextWeather.type = targetWeather.current;
        }
      } else {
        nextWeather.intensity = Math.min(1.0, nextWeather.intensity + dt * 0.2);
      }

      const nextParticles = prev.particles.map(p => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        vy: p.vy + 9.8 * dt,
        life: p.life - dt
      })).filter(p => p.life > 0);

      const nextProjectiles: Projectile[] = prev.projectiles.map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt, trail: [...(p.trail || []), { x: p.x, y: p.y }].slice(-15) })).filter(p => p.life > 0);
      
      let playerHealthMod = 0;
      let animalAttackTriggered = false;

      const nextEntities = prev.entities.map(ent => {
        if (['tree_oak', 'tree_pine', 'tree_palm', 'rock_standard', 'rock_iron', 'bush_berry', 'bush_flower', 'bush_dry', 'well', 'campfire', 'tent', 'workbench', 'hut', 'bridge', 'road', 'stone_wall', 'watchtower', 'castle_gate'].includes(ent.type)) return ent;
        const distToPlayer = Math.sqrt((ent.x - prev.playerPos.x)**2 + (ent.y - prev.playerPos.y)**2);
        let newX = ent.x; let newY = ent.y; let newState = ent.aiState || 'idle'; let targetX = ent.targetX; let targetY = ent.targetY; let attackCooldown = (ent.attackCooldown || 0) - dt;
        
        if (ent.type === 'deer' || ent.type === 'rabbit') {
          if (distToPlayer < 5 || ent.isFleeing) {
            newState = 'fleeing'; const edx = ent.x - prev.playerPos.x; const edy = ent.y - prev.playerPos.y; const emag = Math.sqrt(edx*edx + edy*edy); const speed = ent.type === 'rabbit' ? 6 : 4; newX += (edx/emag) * speed * dt; newY += (edy/emag) * speed * dt; if (distToPlayer > 12) ent.isFleeing = false;
          } else if (targetX === undefined || now - (ent.lastAiTick || 0) > 4000) {
            if (Math.random() > 0.7) { newState = 'grazing'; targetX = ent.x; targetY = ent.y; } else { newState = 'idle'; targetX = ent.x + (Math.random() - 0.5) * 8; targetY = ent.y + (Math.random() - 0.5) * 8; } ent.lastAiTick = now;
          } else if (newState === 'idle' && targetX !== undefined && targetY !== undefined) { const tdx = targetX - ent.x; const tdy = targetY - ent.y; const td = Math.sqrt(tdx*tdx + tdy*tdy); if (td > 0.2) { newX += (tdx/td) * 1.5 * dt; newY += (tdy/td) * 1.5 * dt; } }
        }

        if (ent.type === 'bear' || ent.type === 'scorpion' || ent.type === 'crab') {
          const huntRange = ent.health < ent.maxHealth ? 14 : 7;
          if (distToPlayer < huntRange) {
            if (distToPlayer < 1.3) {
              newState = 'attacking'; 
              if (!isCurrentlyResting && attackCooldown <= 0 && now - prev.playerStats.lastDamageTime > PLAYER_INVINCIBILITY_MS) { 
                playerHealthMod -= ent.type === 'bear' ? 3 : 1; 
                attackCooldown = 2.0; 
                animalAttackTriggered = true;
              }
            } else {
              newState = 'hunting'; const hdx = prev.playerPos.x - ent.x; const hdy = prev.playerPos.y - ent.y; const hmag = Math.sqrt(hdx*hdx + hdy*hdy); const speed = ent.type === 'bear' ? 3.0 : 2.2; newX += (hdx/hmag) * speed * dt; newY += (hdy/hmag) * speed * dt;
            }
          } else if (targetX === undefined || now - (ent.lastAiTick || 0) > 5000) {
            newState = 'prowling'; targetX = ent.x + (Math.random() - 0.5) * 6; targetY = ent.y + (Math.random() - 0.5) * 6; ent.lastAiTick = now;
          } else if (newState === 'prowling' && targetX !== undefined && targetY !== undefined) { const pdx = targetX - ent.x; const pdy = targetY - ent.y; const pd = Math.sqrt(pdx*pdx + pdy*pdy); if (pd > 0.2) { newX += (pdx/pd) * 1 * dt; newY += (pdy/pd) * 1 * dt; } }
        }
        newX = Math.max(2, Math.min(WORLD_SIZE - 2, newX)); newY = Math.max(2, Math.min(WORLD_SIZE - 2, newY));
        return { ...ent, x: newX, y: newY, aiState: newState, targetX, targetY, attackCooldown } as Entity;
      });

      let finalState = { ...prev, entities: nextEntities, projectiles: nextProjectiles, particles: nextParticles, weather: nextWeather, isRecentlyAttackedByAnimal: animalAttackTriggered };
      
      nextProjectiles.forEach(p => {
        const hitIdx = nextEntities.findIndex(e => !['road', 'bridge', 'campfire'].includes(e.type) && Math.sqrt((e.x - p.x)**2 + (e.y - p.y)**2) < 0.8);
        if (hitIdx > -1) {
          const target = nextEntities[hitIdx]; const isHostile = ['bear', 'scorpion', 'crab'].includes(target.type); target.health -= p.damage; target.aiState = isHostile ? 'hunting' : 'fleeing'; target.isFleeing = !isHostile; p.life = 0; if (target.health <= 0) finalState = handleEntityDeath(target, finalState);
        }
      });

      const updatedEntities = finalState.entities.filter((e: Entity) => e.type !== 'campfire' || !e.spawnTime || now - e.spawnTime < CAMPFIRE_LIFESPAN);
      const moveX = velocity.current.x * dt; const moveY = velocity.current.y * dt;
      const checkCollision = (px: number, py: number) => { if (getTileType(px, py) === 'water') return true; return updatedEntities.some((e: Entity) => !['rabbit', 'scorpion', 'deer', 'crab', 'road', 'bridge'].includes(e.type) && Math.sqrt((e.x - px)**2 + (e.y - py)**2) < 0.55); };
      let finalX = prev.playerPos.x; let finalY = prev.playerPos.y;
      if (!checkCollision(finalX + moveX, finalY + moveY)) { finalX += moveX; finalY += moveY; } else { if (!checkCollision(finalX + moveX, finalY)) finalX += moveX; if (!checkCollision(finalX, finalY + moveY)) finalY += moveY; }
      
      let nextHealth = prev.playerStats.health + playerHealthMod; 
      let lastDmgTime = prev.playerStats.lastDamageTime;
      let lastCombatTime = prev.playerStats.lastCombatDamageTime;

      if (playerHealthMod < 0) { 
        showMessage('danger'); 
        lastDmgTime = now; 
        if (animalAttackTriggered) {
          lastCombatTime = now;
        }
      }
      const hungerDrain = 0.0007; const thirstDrain = 0.0010 * thirstDrainMod;
      if (prev.playerStats.hunger <= 0 || prev.playerStats.thirst <= 0) nextHealth -= 0.1;
      
      if (nextHealth <= 0) {
        return { ...finalState, isDead: true, playerStats: { ...prev.playerStats, health: 0 } };
      }

      return { ...finalState, playerPos: { x: finalX, y: finalY }, entities: updatedEntities, playerStats: { ...finalState.playerStats, health: Math.min(prev.playerStats.maxHealth, nextHealth), lastDamageTime: lastDmgTime, lastCombatDamageTime: lastCombatTime, isWalking: Math.sqrt(velocity.current.x**2 + velocity.current.y**2) > 0.4, hunger: Math.max(0, finalState.playerStats.hunger - hungerDrain), thirst: Math.max(0, finalState.playerStats.thirst - thirstDrain) }, time: (prev.time + 0.1) % 2400 };
    });
    requestRef.current = requestAnimationFrame(update);
  }, [isResting, uiState, executeInteraction, triggerRest, triggerDrink, handleEntityDeath, isPaused, canCarryItem, showMessage]);

  useEffect(() => { requestRef.current = requestAnimationFrame(update); return () => cancelAnimationFrame(requestRef.current); }, [update]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase(); if (key === 'f') setUiState(prev => ({ ...prev, inventoryOpen: !prev.inventoryOpen, craftingOpen: false, settingsOpen: false })); if (key === 'c') setUiState(prev => ({ ...prev, craftingOpen: !prev.craftingOpen, inventoryOpen: false, settingsOpen: false })); if (key === 'escape') { if (uiState.craftingOpen || uiState.inventoryOpen || uiState.settingsOpen) setUiState(prev => ({ ...prev, craftingOpen: false, inventoryOpen: false, settingsOpen: false })); else setGameState(g => ({ ...g, gameStarted: false })); return; }
      if (isPaused) return;
      activeKeys.current.add(key); const numKey = parseInt(key); if (!isNaN(numKey) && numKey >= 1 && numKey <= 5) { const usableItems = gameStateRef.current.inventory.filter((i: Item) => ['tool', 'weapon', 'food'].includes(i.type)); const item = usableItems[numKey - 1]; if (item) handleHUDAction('use', item); return; }
      if (key === 'e') handleInteract();
    };
    const handleKeyUp = (e: KeyboardEvent) => activeKeys.current.delete(e.key.toLowerCase());
    const handleWheel = (e: WheelEvent) => { if (isPaused) return; e.preventDefault(); setGameState(prev => ({ ...prev, viewConfig: { ...prev.viewConfig, zoom: Math.max(0.4, Math.min(2.5, prev.viewConfig.zoom + (e.deltaY > 0 ? -0.1 : 0.1))) } })); };
    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
      if (e.button === 2 || e.button === 1) { isPanning.current = true; lastMousePos.current = { x: e.clientX, y: e.clientY }; e.preventDefault(); }
      else if (e.button === 0 && !isPaused && !isResting) {
        const worldPos = screenToWorld(e.clientX, e.clientY); const state = gameStateRef.current;
        if (state.playerStats.equippedItemId === 'bow') {
          const arrowIdx = state.inventory.findIndex((i: Item) => i.id === 'arrow');
          if (arrowIdx > -1 && worldPos) {
            const adx = worldPos.x - state.playerPos.x; const ady = worldPos.y - state.playerPos.y; const adist = Math.sqrt(adx*adx + ady*ady);
            if (adist > 0.1) {
              const speed = 12; const newProj: Projectile = { id: `arrow-${Date.now()}`, x: state.playerPos.x, y: state.playerPos.y, vx: (adx / adist) * speed, vy: (ady / adist) * speed, damage: 5, ownerId: 'player', life: 2.0, trail: [] };
              setGameState(prev => {
                const ni = [...prev.inventory]; ni[arrowIdx].quantity -= 1; let newEquippedId = prev.playerStats.equippedItemId; const bowIdx = ni.findIndex(i => i.id === 'bow'); if (bowIdx > -1) { const bow = { ...ni[bowIdx] }; if (bow.durability !== undefined) { bow.durability -= 1; if (bow.durability <= 0) { ni.splice(bowIdx, 1); showMessage('broken'); newEquippedId = null; } else ni[bowIdx] = bow; } } const filteredInv = ni.filter(i => i.quantity > 0);
                return { ...prev, inventory: filteredInv, playerStats: { ...prev.playerStats, equippedItemId: newEquippedId }, projectiles: [...prev.projectiles, newProj] };
              });
              SoundManager.playToolAction('bow'); return;
            }
          } else { showMessage('Out of arrows!', true); }
        }
        if (worldPos) {
          const clickedEntity = state.entities.find((ent: any) => Math.sqrt((ent.x - worldPos.x)**2 + (ent.y - worldPos.y)**2) < 2.0);
          if (clickedEntity) { const mdist = Math.sqrt((clickedEntity.x - state.playerPos.x)**2 + (clickedEntity.y - state.playerPos.y)**2); if (mdist < 2.0) executeInteraction(clickedEntity.id); else { mouseTargetPos.current = { x: clickedEntity.x, y: clickedEntity.y }; targetEntityId.current = clickedEntity.id; } }
          else { const tile = getTileType(worldPos.x, worldPos.y); if (tile === 'water') { mouseTargetPos.current = worldPos; targetEntityId.current = 'water_point'; } else { mouseTargetPos.current = worldPos; targetEntityId.current = null; } }
        }
      }
    };
    const handleMouseMove = (e: MouseEvent) => { if (isPanning.current) { const pdx = e.clientX - lastMousePos.current.x; const pdy = e.clientY - lastMousePos.current.y; lastMousePos.current = { x: e.clientX, y: e.clientY }; setGameState(prev => ({ ...prev, viewConfig: { ...prev.viewConfig, cameraOffsetX: prev.viewConfig.cameraOffsetX + pdx, cameraOffsetY: prev.viewConfig.cameraOffsetY + pdy } })); } };
    const handleMouseUp = (e: MouseEvent) => { if (e.button === 2 || e.button === 1) isPanning.current = false; };
    const handleContextMenu = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('wheel', handleWheel, { passive: false }); window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); window.addEventListener('contextmenu', handleContextMenu);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('wheel', handleWheel); window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); window.removeEventListener('contextmenu', handleContextMenu); };
  }, [handleInteract, uiState, handleHUDAction, isResting, screenToWorld, showMessage, executeInteraction, isPaused]);

  if (!gameState.gameStarted) {
    return <MainMenu hasActiveSession={hasSave} onStart={() => { SoundManager.init(); SoundManager.startForestAmbience(); setGameState(prev => ({ ...prev, gameStarted: true, entities: spawnEntities(8000), inventory: [], playerPos: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 + 8 }, playerStats: INITIAL_STATS })); }} onContinue={() => { const saved = localStorage.getItem(SAVE_KEY); if (saved) { try { const loadedState = JSON.parse(saved); setGameState({ ...loadedState, gameStarted: true, birds: [], ripples: [], particles: [], shake: 0, isRecentlyAttackedByAnimal: false, isDead: false }); SoundManager.init(); SoundManager.startForestAmbience(); } catch(e) { showMessage("Failed to load game save.", true); } } }} settings={gameState.settings} onUpdateSettings={s => setGameState(prev => ({ ...prev, settings: s }))} playerStats={gameState.playerStats} onUpdatePlayerStats={ps => setGameState(prev => ({ ...prev, playerStats: ps }))} />;
  }

  const isNearWorkbench = !!gameState.entities.find(e => e.type === 'workbench' && Math.sqrt((e.x - gameState.playerPos.x)**2 + (e.y - gameState.playerPos.y)**2) < 2.5);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950">
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
            <span>💤</span> 
            <span className="text-[12px] mt-2 opacity-50 tracking-[0.3em] uppercase">{t('rest_tent')}</span>
          </div>
        </div>
      )}

      <HUD stats={gameState.playerStats} time={gameState.time} message={uiState.message} gameState={gameState} onAction={handleHUDAction} onZoom={() => {}} onRotate={() => {}} onOpenSettings={() => setUiState(s => ({ ...s, settingsOpen: true, inventoryOpen: false, craftingOpen: false }))} />
      
      <div className="absolute top-6 right-6 pointer-events-none z-50 flex flex-col items-end gap-6">
        <Minimap playerPos={gameState.playerPos} entities={gameState.entities} playerStats={gameState.playerStats} />
      </div>

      {uiState.inventoryOpen && <Inventory items={gameState.inventory} equippedItemId={gameState.playerStats.equippedItemId} isNearWorkbench={isNearWorkbench} onAction={handleHUDAction} onClose={() => setUiState(s => ({...s, inventoryOpen: false}))} onSwitchToCrafting={() => setUiState(s => ({...s, inventoryOpen: false, craftingOpen: true}))} language={gameState.settings.language} />}
      
      {uiState.craftingOpen && <Crafting inventory={gameState.inventory} playerLevel={gameState.playerStats.level} isNearWorkbench={isNearWorkbench} onCraft={(recipeId) => {
          const recipe = RECIPES.find(r => r.id === recipeId); if (!recipe) return;
          setGameState((prev: any) => {
             const canCraft = Object.entries(recipe.ingredients).every(([id, qty]) => { const item = prev.inventory.find((i: Item) => i.id === id); return item && item.quantity >= (qty as number); });
             if (!canCraft) return prev;
             const outputId = recipe.output.id;
             if (!canCarryItem(outputId, recipe.output.quantity, prev.inventory)) {
                 showMessage('inv_full');
                 return prev;
             }
             let ni = [...prev.inventory]; Object.entries(recipe.ingredients).forEach(([id, qty]) => { const idx = ni.findIndex(i => i.id === id); if (idx > -1) { ni[idx].quantity -= (qty as number); if (ni[idx].quantity <= 0) ni.splice(idx, 1); } });
             const newItem = { ...recipe.output }; let updatedEntities = [...prev.entities]; let placedDirectly = false;
             if (newItem.type === 'structure') { const spot = findPlacementSpot(prev.playerPos.x, prev.playerPos.y, updatedEntities); if (spot) { updatedEntities.push({ id: `struct-${Date.now()}`, x: spot.x, y: spot.y, type: newItem.id as EntityType, health: 10, maxHealth: 10, spawnTime: Date.now() }); placedDirectly = true; showMessage(t('placed') + ': ' + recipe.name, true); SoundManager.playUI('fanfare'); } }
             if (!placedDirectly) { const existingIdx = ni.findIndex(i => i.id === newItem.id && (i.quantity + newItem.quantity <= (i.maxStack || 99))); if (existingIdx > -1) ni[existingIdx].quantity += newItem.quantity; else ni.push(newItem); SoundManager.playUI('fanfare'); showMessage(t('crafted') + ': ' + recipe.name, true); }
             let newEquippedId = prev.playerStats.equippedItemId; if (!placedDirectly && (newItem.type === 'tool' || newItem.type === 'weapon')) newEquippedId = newItem.id;
             return { ...prev, inventory: ni, entities: updatedEntities, playerStats: { ...prev.playerStats, equippedItemId: newEquippedId } };
          });
      }} onClose={() => setUiState(s => ({...s, craftingOpen: false}))} onSwitchToInventory={() => setUiState(s => ({...s, inventoryOpen: true, craftingOpen: false}))} language={gameState.settings.language} />}
      
      {uiState.settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-white">
            <h2 className="text-3xl font-black mb-8 tracking-tighter text-amber-500 uppercase">{t('settings')}</h2>
            <div className="flex flex-col gap-4">
              <button onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, soundEnabled: !prev.settings.soundEnabled}}))} className={`py-3.5 rounded-xl font-black text-[12px] border ${gameState.settings.soundEnabled ? 'bg-amber-500 text-stone-900 border-amber-500' : 'bg-white/5 border-white/10 text-white/50'}`}>{t('sound')}: {gameState.settings.soundEnabled ? 'ON' : 'OFF'}</button>
              <div className="flex flex-col gap-3 mt-4">
                <span className="text-[12px] font-black tracking-widest text-white/40 uppercase">{t('language')}</span>
                <div className="grid grid-cols-2 gap-3">{(['en', 'tr'] as Language[]).map(l => (<button key={l} onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, language: l}}))} className={`py-3.5 rounded-xl font-black text-[12px] uppercase border transition-all ${gameState.settings.language === l ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-white/5 border-white/10 text-white/50'}`}>{l === 'en' ? 'English' : 'Türkçe'}</button>))}</div>
              </div>
            </div>
            <button onClick={() => setUiState(s => ({...s, settingsOpen: false}))} className="w-full py-4 mt-10 bg-white text-stone-950 font-black rounded-xl uppercase tracking-widest text-[12px] hover:bg-amber-500 transition-colors shadow-lg active:scale-95">{t('back')}</button>
          </div>
        </div>
      )}

      {gameState.isDead && (
        <DeathScreen stats={gameState.playerStats} language={gameState.settings.language} onRetry={handleRetry} />
      )}
    </div>
  );
};

export default App;
