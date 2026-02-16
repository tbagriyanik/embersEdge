
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, PlayerStats, Entity, Particle, Projectile, FloatingText, WeatherState, Item, TileType, GameSettings, WeatherType, EntityType } from './types';
import { INITIAL_STATS, TILE_WIDTH, TILE_HEIGHT, ITEMS, RECIPES, CHUNK_SIZE, SAVE_KEY, SETTINGS_SAVE_KEY, TRANSLATIONS, GATHER_BASE_DAMAGE, GATHER_XP_PER_HIT, GATHER_ITEM_QUANTITY, GATHER_TOOL_REQUIREMENTS, MAX_INVENTORY_SLOTS, GATHER_HAND_DAMAGE, GATHER_TOOL_BOOST } from './constants';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { MobileControls } from './components/MobileControls';
import { Inventory } from './components/Inventory';
import { Crafting } from './components/Crafting';
import { Container } from './components/Container';
import { MainMenu } from './components/MainMenu';
import { DeathScreen } from './components/DeathScreen';
import { Minimap } from './components/Minimap';
import { SoundManager } from './components/SoundManager';
import { InputManager } from './InputManager';

export const calculateTileType = (x: number, y: number): TileType => {
  const sin = Math.sin;
  const val = sin(x * 0.1) + sin(y * 0.1) + sin(x * 0.3 + y * 0.3) * 0.5;
  if (val < -1.2) return 'water';
  if (val < -1.0) return 'sand';
  if (val > 1.5) return 'snow_tile';
  if (val > 1.2) return 'stone';
  return 'grass';
};

const FARM_GROWTH_TIME = 60; // seconds per stage

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'inventory' | 'crafting' | 'container' | 'settings'>('none');
  const [isDead, setIsDead] = useState(false);
  const [isNearWorkbench, setIsNearWorkbench] = useState(false);
  const [placingEntityType, setPlacingEntityType] = useState<EntityType | null>(null);
  
  const gameState = useRef<GameState>({
    playerPos: { x: 0, y: 0 },
    playerStats: { ...INITIAL_STATS },
    inventory: [],
    entities: [],
    projectiles: [],
    floatingTexts: [],
    particles: [],
    time: 800,
    isDay: true,
    gameStarted: false, 
    isPaused: false,
    weather: { type: 'clear', intensity: 0, transitionTimer: 0 },
    settings: { language: 'en', soundEnabled: true },
    viewConfig: { zoom: 1, rotation: 0, cameraOffsetX: 0, cameraOffsetY: 0 },
    chunks: {},
    hoveredEntityId: null
  });

  const velocity = useRef({ x: 0, y: 0 });
  const lastTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [uiState, setUiState] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hasSave, setHasSave] = useState(false);

  const inputManagerRef = useRef<InputManager | null>(null);

  const getTileAt = useCallback((x: number, y: number): TileType => {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const key = `${cx},${cy}`;
    const chunk = gameState.current.chunks[key];
    if (chunk) {
      const lx = ((Math.floor(x) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const ly = ((Math.floor(y) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      return chunk[lx][ly];
    }
    return calculateTileType(Math.floor(x), Math.floor(y));
  }, []);

  const saveSettings = useCallback(() => {
    localStorage.setItem(SETTINGS_SAVE_KEY, JSON.stringify(gameState.current.settings));
    localStorage.setItem('embers_character_config', JSON.stringify(gameState.current.playerStats.character));
    SoundManager.updateAmbienceState(gameState.current.isDay, gameState.current.settings.soundEnabled);
  }, []);

  const saveGame = useCallback(() => {
    if (!gameStarted) return;
    const data = {
      playerPos: gameState.current.playerPos,
      playerStats: gameState.current.playerStats,
      inventory: gameState.current.inventory,
      entities: gameState.current.entities,
      time: gameState.current.time,
      weather: gameState.current.weather,
      chunks: gameState.current.chunks
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    setHasSave(true);
  }, [gameStarted]);

  const checkLevelUp = useCallback((stats: PlayerStats) => {
    const threshold = stats.level * 250;
    if (stats.xp >= threshold) {
      stats.level++;
      stats.xp -= threshold;
      stats.health = 100;
      stats.hunger = 100;
      stats.thirst = 100;
      const t = (key: string) => TRANSLATIONS[gameState.current.settings.language][key] || key;
      showMessage(t('level_up'));
      addFloatingText(gameState.current.playerPos.x, gameState.current.playerPos.y, t('level_up'), '#fbbf24');
      SoundManager.playUI('fanfare');
      spawnParticles(gameState.current.playerPos.x, gameState.current.playerPos.y, 'spark', 15, '#fbbf24', 1.5);
    }
  }, []);

  const getUsableItemsForQuickSlots = useCallback((inventory: Item[]): Item[] => {
    const itemsInInventory = inventory.filter(i => ['tool', 'weapon', 'food', 'structure'].includes(i.type));
    const uniqueMap = new Map<string, { item: Item, total: number, hasOverflow: boolean, maxStack: number }>();
    itemsInInventory.forEach(i => {
        const existing = uniqueMap.get(i.id);
        if (!existing) {
            uniqueMap.set(i.id, { item: i, total: i.quantity, hasOverflow: false, maxStack: i.maxStack || 99 });
        } else {
            const updatedTotal = (existing.total || 0) + i.quantity;
            uniqueMap.set(i.id, { ...existing, total: updatedTotal, hasOverflow: updatedTotal > (existing.maxStack || 99) });
        }
    });
    return Array.from(uniqueMap.values()).map(data => data.item);
  }, []);

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    gameState.current.floatingTexts.push({
      id: Math.random().toString(),
      x, y, text, color,
      life: 1.5,
      vy: -0.5
    });
  };

  const spawnParticles = (x: number, y: number, type: Particle['type'], count: number, color: string, sizeScale = 1) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        id: Math.random(),
        x, y,
        vx: (Math.random() - 0.5) * (type === 'smoke' ? 1 : 5),
        vy: type === 'smoke' ? -1 - Math.random() : (Math.random() - 0.5) * 5,
        life: type === 'smoke' ? 2.0 : 1.0,
        maxLife: type === 'smoke' ? 2.0 : 1.0,
        size: (Math.random() * 0.5 + 0.2) * sizeScale,
        color,
        type
      });
    }
  };

  const handleAction = useCallback((action: 'use' | 'reorder' | 'equip' | 'place' | 'repair' | 'repair_all' | 'fire', data: any) => {
    const engine = gameState.current;
    const t = (key: string) => TRANSLATIONS[engine.settings.language][key] || key;

    if (action === 'use') {
        if (data.type === 'food') {
            const stats = engine.playerStats;
            if (data.effect) {
                stats.hunger = Math.min(100, stats.hunger + (data.effect.hunger || 0));
                stats.health = Math.min(100, stats.health + (data.effect.health || 0));
                SoundManager.play('eat');
                addFloatingText(engine.playerPos.x, engine.playerPos.y, `+${data.effect.hunger} Hunger`, '#fbbf24');
                const idx = engine.inventory.findIndex(i => i === data);
                if (idx > -1) {
                    engine.inventory[idx].quantity--;
                    if (engine.inventory[idx].quantity <= 0) engine.inventory.splice(idx, 1);
                }
            }
        } else if (data.type === 'tool' || data.type === 'weapon') {
            engine.playerStats.equippedItemId = engine.playerStats.equippedItemId === data.id ? null : data.id;
            SoundManager.playUI('equip');
        } else if (data.type === 'structure' || data.placeEntity) {
            setPlacingEntityType(data.placeEntity);
            setActiveModal('none');
        }
    } else if (action === 'reorder') {
        const { fromIdx, toIdx } = data;
        if (fromIdx !== undefined && toIdx !== undefined && fromIdx !== toIdx) {
            const inv = [...engine.inventory];
            const temp = inv[fromIdx];
            inv[fromIdx] = inv[toIdx];
            inv[toIdx] = temp;
            engine.inventory = inv;
            SoundManager.playUI('hover');
        }
    } else if (action === 'equip') {
        engine.playerStats.equippedItemId = data.id;
        SoundManager.playUI('equip');
    } else if (action === 'fire') {
        const arrowIdx = engine.inventory.findIndex(i => i.id === 'arrow');
        if (arrowIdx > -1) {
            engine.inventory[arrowIdx].quantity--;
            if (engine.inventory[arrowIdx].quantity <= 0) engine.inventory.splice(arrowIdx, 1);
            
            const dx = data.tx - engine.playerPos.x;
            const dy = data.ty - engine.playerPos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const speed = 25;
            
            engine.projectiles.push({
                id: Math.random().toString(),
                x: engine.playerPos.x,
                y: engine.playerPos.y,
                vx: (dx / dist) * speed,
                vy: (dy / dist) * speed,
                damage: 15,
                ownerId: 'player',
                life: 3,
                type: 'arrow'
            });
            SoundManager.playToolAction('bow');
            engine.playerStats.interactionAnim = 0.2;
        } else {
            showMessage(t('out_of_arrows'));
        }
    } else if (action === 'place') {
        const { x, y } = data;
        const newEntity: Entity = {
            id: Math.random().toString(),
            x, y,
            type: placingEntityType!,
            health: 100, maxHealth: 100
        };
        engine.entities.push(newEntity);
        SoundManager.play('build');
        showMessage(t('placed') + " " + t(placingEntityType!));
        setPlacingEntityType(null);
    } else if (action === 'repair_all') {
        engine.inventory.forEach(item => {
            if (item.durability !== undefined && item.maxDurability !== undefined) {
                item.durability = item.maxDurability;
            }
        });
        SoundManager.play('build');
        showMessage("All items repaired!");
    }
    setUiState(prev => prev + 1);
  }, [placingEntityType]);

  const handleQuickSlotActivated = useCallback((slotIndex: number) => {
    const usableItems = getUsableItemsForQuickSlots(gameState.current.inventory);
    if (slotIndex >= 0 && slotIndex < usableItems.length) {
      const item = usableItems[slotIndex];
      if (item) handleAction('use', item);
    }
  }, [getUsableItemsForQuickSlots, handleAction]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleInteract = useCallback((entityId: string | null) => {
    const engine = gameState.current;
    const t = (key: string) => TRANSLATIONS[engine.settings.language][key] || key;
    engine.playerStats.interactionAnim = 0.3;

    if (placingEntityType) {
        const facing = engine.playerStats.facing;
        let ox = 0, oy = 0;
        if (facing === 'nw') { ox = -1.2; oy = -1.2; }
        else if (facing === 'ne') { ox = 1.2; oy = -1.2; }
        else if (facing === 'sw') { ox = -1.2; oy = 1.2; }
        else { ox = 1.2; oy = 1.2; }
        handleAction('place', { x: engine.playerPos.x + ox, y: engine.playerPos.y + oy });
        return;
    }

    if (entityId) {
      const entity = engine.entities.find(e => e.id === entityId);
      if (entity) {
        if (entity.type === 'workbench') setActiveModal('crafting');
        else if (entity.type === 'well') {
          showMessage(t(`drink_water`));
          engine.playerStats.thirst = Math.min(100, engine.playerStats.thirst + 40);
          addFloatingText(engine.playerPos.x, engine.playerPos.y, `Refreshed!`, '#60a5fa');
          SoundManager.play('eat');
          setUiState(prev => prev + 1);
        } else if (entity.type === 'tent') {
          showMessage(t('rest_tent'));
          engine.playerStats.health = Math.min(100, engine.playerStats.health + 25);
          engine.playerStats.stamina = 100;
          addFloatingText(engine.playerPos.x, engine.playerPos.y, `Zzz... +25 HP`, '#a855f7');
          SoundManager.play('eat');
          setUiState(prev => prev + 1);
        } else if (entity.type === 'campfire') {
          const inventory = engine.inventory;
          const rawMeat = inventory.find(i => i.id === 'meat_raw');
          const berries = inventory.find(i => i.id === 'berry');
          let cookedItem: Item | null = null, consumedItem: Item | null = null;
          if (rawMeat) { consumedItem = rawMeat; cookedItem = { ...ITEMS.meat_cooked, quantity: 1 }; }
          else if (berries) { consumedItem = berries; cookedItem = { ...ITEMS.berry_cooked, quantity: 1 }; }

          if (consumedItem && cookedItem) {
            consumedItem.quantity--;
            if (consumedItem.quantity <= 0) inventory.splice(inventory.indexOf(consumedItem), 1);
            const existing = inventory.find(i => i.id === cookedItem!.id && i.quantity < (i.maxStack || 99));
            if (existing) existing.quantity++;
            else if (inventory.length < MAX_INVENTORY_SLOTS) inventory.push(cookedItem);
            showMessage(t('crafted') + " " + t(cookedItem.id));
            addFloatingText(entity.x, entity.y, t(cookedItem.id), '#fbbf24');
            SoundManager.play('craft');
            spawnParticles(entity.x, entity.y, 'spark', 8, '#f59e0b', 1.2);
            engine.playerStats.xp += 10;
            checkLevelUp(engine.playerStats);
          } else { showMessage(t('need_raw_food')); }
          setUiState(prev => prev + 1);
        } else if (entity.type === 'farm_plot') {
          if (entity.growthStage === 0 || entity.growthStage === undefined) {
             const seedItem = engine.inventory.find(i => i.id === 'seed_berry');
             if (seedItem) {
               entity.growthStage = 1; entity.growthTimer = 0;
               seedItem.quantity--;
               if (seedItem.quantity <= 0) engine.inventory.splice(engine.inventory.indexOf(seedItem), 1);
               showMessage(t('planted'));
               addFloatingText(entity.x, entity.y, t('planted'), '#4ade80');
               SoundManager.play('build');
               spawnParticles(entity.x, entity.y, 'leaf', 5, '#15803d');
             } else showMessage(t('need_seed_berry'));
          } else if (entity.growthStage === 3) {
             const berry = { ...ITEMS.berry, quantity: 3 };
             const existing = engine.inventory.find(i => i.id === 'berry' && i.quantity < (i.maxStack || 99));
             if (existing) existing.quantity += 3;
             else if (engine.inventory.length < MAX_INVENTORY_SLOTS) engine.inventory.push(berry);
             entity.growthStage = 0; entity.growthTimer = 0;
             showMessage(t('harvested'));
             addFloatingText(entity.x, entity.y, `+3 Berries`, '#4ade80');
             SoundManager.play('gather');
             spawnParticles(entity.x, entity.y, 'leaf', 8, '#1d4ed8');
             engine.playerStats.xp += 15;
             checkLevelUp(engine.playerStats);
          }
        }
      }
    } else {
        const playerPos = engine.playerPos;
        const neighbors = [{x:0, y:0}, {x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
        const isNearWater = neighbors.some(n => getTileAt(playerPos.x + n.x, playerPos.y + n.y) === 'water');
        if (isNearWater && engine.playerStats.thirst < 95) {
          showMessage(t(`drink_water`));
          engine.playerStats.thirst = Math.min(100, engine.playerStats.thirst + 20);
          addFloatingText(playerPos.x, playerPos.y, `+20 Thirst`, '#60a5fa');
          SoundManager.play('eat');
          setUiState(prev => prev + 1);
        }
    }
  }, [getTileAt, checkLevelUp, placingEntityType, handleAction]);

  const handleGather = useCallback((entityId: string) => {
    const engine = gameState.current;
    const t = (key: string) => TRANSLATIONS[engine.settings.language][key] || key;
    const entityIndex = engine.entities.findIndex(e => e.id === entityId);
    if (entityIndex === -1) return;
    engine.playerStats.interactionAnim = 0.3;
    const targetEntity = engine.entities[entityIndex];
    const playerStats = engine.playerStats;
    const inventory = engine.inventory;
    const equippedTool = inventory.find(item => item.id === playerStats.equippedItemId);
    const equippedToolType = equippedTool ? ITEMS[equippedTool.id]?.type : 'none';
    const preferredTools = GATHER_TOOL_REQUIREMENTS[targetEntity.type] || [];
    let damage = GATHER_HAND_DAMAGE;
    if (equippedToolType === 'tool' || equippedToolType === 'weapon') {
        damage = GATHER_BASE_DAMAGE;
        if (preferredTools.includes(equippedTool?.id || '')) damage *= GATHER_TOOL_BOOST;
        else if (equippedTool?.id === 'axe' || equippedTool?.id === 'pickaxe') damage *= GATHER_TOOL_BOOST;
    } else showMessage(t('bare_hands'));
    targetEntity.health -= damage;
    SoundManager.playGather(targetEntity.type, playerStats.equippedItemId);
    const gatherInfo = GATHER_ITEM_QUANTITY[targetEntity.type as keyof typeof GATHER_ITEM_QUANTITY];
    if (gatherInfo) {
      spawnParticles(targetEntity.x, targetEntity.y + 0.5, gatherInfo.particle as Particle['type'], 3, targetEntity.type.includes('tree') ? '#a16207' : (targetEntity.type === 'deer' || targetEntity.type === 'rabbit' ? '#ef4444' : '#fbbf24'), 0.6);
      addFloatingText(targetEntity.x, targetEntity.y, `+${gatherInfo.quantity} ${t(gatherInfo.item)}`, '#fbbf24');
    }
    if (targetEntity.health > 0 && gatherInfo) {
        const itemToAdd = { ...ITEMS[gatherInfo.item], quantity: gatherInfo.quantity };
        const existingItem = inventory.find(i => i.id === itemToAdd.id && i.stackable && (i.quantity < (i.maxStack || 99)));
        if (existingItem) existingItem.quantity += itemToAdd.quantity;
        else if (inventory.length < MAX_INVENTORY_SLOTS) inventory.push(itemToAdd);
        else showMessage(t('inv_full'));
    }
    let xpGain = GATHER_XP_PER_HIT;
    if (targetEntity.type === 'deer') xpGain = 25;
    if (targetEntity.type === 'rabbit') xpGain = 10;
    playerStats.xp += xpGain;
    checkLevelUp(playerStats);
    if (equippedTool && equippedTool.durability !== undefined) {
      equippedTool.durability = Math.max(0, equippedTool.durability - 10);
      if (equippedTool.durability <= 0) { showMessage(t('tool_broken')); playerStats.equippedItemId = null; }
    }
    if (targetEntity.health <= 0) {
      engine.entities.splice(entityIndex, 1);
      spawnParticles(targetEntity.x, targetEntity.y + 0.5, gatherInfo?.particle as Particle['type'] || 'dust', 10, '#a16207', 1.0);
    }
    setUiState(prev => prev + 1);
  }, [checkLevelUp]);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_SAVE_KEY);
    if (savedSettings) try { 
      gameState.current.settings = JSON.parse(savedSettings); 
    } catch (e) {}
    const savedChar = localStorage.getItem('embers_character_config');
    if (savedChar) try { 
      gameState.current.playerStats.character = JSON.parse(savedChar); 
    } catch (e) {}
    setHasSave(!!localStorage.getItem(SAVE_KEY));
    window.addEventListener('click', () => SoundManager.init(), { once: true });
    
    if (!inputManagerRef.current) {
      inputManagerRef.current = new InputManager({
        onOpenInventory: () => setActiveModal('inventory'),
        onOpenCrafting: () => setActiveModal('crafting'),
        onOpenSettings: () => setActiveModal('settings'),
        onInteract: handleInteract,
        onGather: handleGather,
        onPanCamera: (dx, dy) => {
          gameState.current.viewConfig.cameraOffsetX += dx;
          gameState.current.viewConfig.cameraOffsetY += dy;
        },
        onZoom: (delta) => {
          const zoomFactor = 0.1;
          if (delta < 0) gameState.current.viewConfig.zoom = Math.min(2, gameState.current.viewConfig.zoom + zoomFactor);
          else gameState.current.viewConfig.zoom = Math.max(0.5, gameState.current.viewConfig.zoom - zoomFactor);
        },
        onClickToMove: (worldX, worldY) => {
          const engine = gameState.current;
          if (engine.playerStats.equippedItemId === 'bow') {
             handleAction('fire', { tx: worldX, ty: worldY });
             return;
          }
          if (placingEntityType) {
              handleAction('place', { x: worldX, y: worldY });
              return;
          }
          inputManagerRef.current?.setPlayerTargetPos({ x: worldX, y: worldY });
          gameState.current.particles.push({
            id: Math.random(), x: worldX, y: worldY, vx: 0, vy: 0,
            life: 0.5, maxLife: 0.5, size: 1.0, color: 'rgba(255, 255, 255, 0.4)', type: 'ripple'
          });
        },
        onQuickSlotActivated: handleQuickSlotActivated,
        onEscape: () => {
          if (placingEntityType) { setPlacingEntityType(null); return; }
          if (activeModal !== 'none') setActiveModal('none');
          else setGameStarted(false);
        }
      }, gameState);
    }
    inputManagerRef.current.init(canvasRef.current);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    lastTime.current = performance.now();
    gameLoop(lastTime.current);
    const autoSaveInterval = setInterval(saveGame, 30000);
    return () => {
      inputManagerRef.current?.destroy();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId.current);
      clearInterval(autoSaveInterval);
    };
  }, [handleQuickSlotActivated, handleInteract, handleGather, saveGame, activeModal, getTileAt, gameStarted, placingEntityType, handleAction]);

  useEffect(() => {
    gameState.current.isPaused = activeModal !== 'none' || isDead;
  }, [activeModal, isDead]);

  const gameLoop = (timestamp: number) => {
    const dt = Math.min((timestamp - lastTime.current) / 1000, 0.1);
    lastTime.current = timestamp;
    if (gameStarted && !isDead && !gameState.current.isPaused) update(dt);
    if (Math.floor(timestamp / 100) > Math.floor((timestamp - dt * 1000) / 100)) setUiState(prev => prev + 1);
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const update = (dt: number) => {
    const engine = gameState.current;
    const now = performance.now();
    const keys = inputManagerRef.current?.getKeys() || {};
    const playerTargetPos = inputManagerRef.current?.getPlayerTargetPos();
    engine.time += dt * 5; if (engine.time >= 2400) engine.time = 0;
    engine.isDay = engine.time > 600 && engine.time < 1800;
    if (engine.playerStats.interactionAnim > 0) engine.playerStats.interactionAnim = Math.max(0, engine.playerStats.interactionAnim - dt);
    const workbenchInRange = engine.entities.some(e => e.type === 'workbench' && Math.sqrt((e.x - engine.playerPos.x)**2 + (e.y - engine.playerPos.y)**2) < 3);
    if (workbenchInRange !== isNearWorkbench) setIsNearWorkbench(workbenchInRange);

    // AI and Environment logic
    for (const ent of engine.entities) {
      // Animal Roaming
      if (ent.type === 'deer' || ent.type === 'rabbit') {
        if (!ent.aiState) ent.aiState = 'idle';
        if (!ent.lastAiTick) ent.lastAiTick = now;

        if (ent.aiState === 'idle') {
          if (now - ent.lastAiTick > 3000 + Math.random() * 5000) {
            // Chance to start walking
            if (Math.random() < 0.4) {
              ent.aiState = 'grazing';
              ent.targetX = ent.x + (Math.random() - 0.5) * 8;
              ent.targetY = ent.y + (Math.random() - 0.5) * 8;
              ent.lastAiTick = now;
              ent.facing = ent.targetX > ent.x ? 'right' : 'left';
            } else {
              ent.lastAiTick = now;
            }
          }
        } else if (ent.aiState === 'grazing') {
          const dx = ent.targetX! - ent.x;
          const dy = ent.targetY! - ent.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.2) {
            ent.aiState = 'idle';
            ent.lastAiTick = now;
          } else {
            const moveSpeed = ent.type === 'rabbit' ? 3 : 2;
            const stepX = (dx / dist) * moveSpeed * dt;
            const stepY = (dy / dist) * moveSpeed * dt;
            
            if (getTileAt(ent.x + stepX, ent.y) !== 'water') ent.x += stepX;
            if (getTileAt(ent.x, ent.y + stepY) !== 'water') ent.y += stepY;
          }
        }
      }
      
      // Campfire Smoke
      if (ent.type === 'campfire' && Math.random() < 8 * dt) {
        spawnParticles(ent.x, ent.y - 0.2, 'smoke', 1, 'rgba(150, 150, 150, 0.4)', 1.5);
      }
    }

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (playerTargetPos) {
        const targetDx = playerTargetPos.x - engine.playerPos.x, targetDy = playerTargetPos.y - engine.playerPos.y;
        const distToTarget = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        if (distToTarget > 0.3) {
            dx = targetDx / distToTarget; dy = targetDy / distToTarget;
            if (keys['w'] || keys['s'] || keys['a'] || keys['d']) inputManagerRef.current?.clearPlayerTargetPos();
        } else { inputManagerRef.current?.clearPlayerTargetPos(); dx = 0; dy = 0; velocity.current.x = 0; velocity.current.y = 0; }
    }
    const isSprinting = keys['shift'] && engine.playerStats.stamina > 0;
    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx*dx + dy*dy); dx /= mag; dy /= mag;
      const speed = isSprinting ? 14 : 7; const accel = 30; 
      velocity.current.x += (dx * speed - velocity.current.x) * accel * dt;
      velocity.current.y += (dy * speed - velocity.current.y) * accel * dt;
      if (isSprinting) engine.playerStats.stamina = Math.max(0, engine.playerStats.stamina - 15 * dt);
      engine.playerStats.isWalking = true;
    } else { velocity.current.x -= velocity.current.x * 15 * dt; velocity.current.y -= velocity.current.y * 15 * dt; engine.playerStats.isWalking = false; }
    const nextX = engine.playerPos.x + velocity.current.x * dt, nextY = engine.playerPos.y + velocity.current.y * dt;
    if (getTileAt(nextX, engine.playerPos.y) !== 'water') engine.playerPos.x = nextX; else velocity.current.x = 0;
    if (getTileAt(engine.playerPos.x, nextY) !== 'water') engine.playerPos.y = nextY; else velocity.current.y = 0;
    if (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.y) > 0.1) {
        const angle = Math.atan2(velocity.current.y, velocity.current.x);
        if (angle > -Math.PI/4 && angle <= Math.PI/4) engine.playerStats.facing = 'se';
        else if (angle > Math.PI/4 && angle <= 3*Math.PI/4) engine.playerStats.facing = 'sw';
        else if (angle > -3*Math.PI/4 && angle <= -Math.PI/4) engine.playerStats.facing = 'ne';
        else engine.playerStats.facing = 'nw';
    }
    if (!isSprinting && engine.playerStats.hunger > 0 && engine.playerStats.thirst > 0) engine.playerStats.stamina = Math.min(100, engine.playerStats.stamina + 10 * dt);
    engine.playerStats.hunger = Math.max(0, engine.playerStats.hunger - 0.05 * dt);
    engine.playerStats.thirst = Math.max(0, engine.playerStats.thirst - 0.08 * dt);
    if (engine.playerStats.hunger <= 0 || engine.playerStats.thirst <= 0) {
        engine.playerStats.health = Math.max(0, engine.playerStats.health - 1 * dt);
        if (engine.playerStats.health <= 0) handleDeath();
    }
    // Update Projectiles
    for (let i = engine.projectiles.length - 1; i >= 0; i--) {
        const p = engine.projectiles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        let hit = false;
        for (const ent of engine.entities) {
            const d = Math.sqrt((ent.x - p.x)**2 + (ent.y - p.y)**2);
            if (d < 0.8) {
                ent.health -= p.damage; hit = true;
                addFloatingText(ent.x, ent.y, `-${p.damage}`, '#ef4444');
                spawnParticles(ent.x, ent.y, 'spark', 5, '#ffffff', 0.5);
                if (ent.health <= 0) handleGather(ent.id);
                break;
            }
        }
        if (hit || p.life <= 0) engine.projectiles.splice(i, 1);
    }
    for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.type === 'smoke') {
          p.size += 0.5 * dt;
          p.vx += (Math.random() - 0.5) * 0.5 * dt;
        }
        if (p.life <= 0) engine.particles.splice(i, 1);
    }
    for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
        const ft = engine.floatingTexts[i]; ft.life -= dt; ft.y += ft.vy * dt;
        if (ft.life <= 0) engine.floatingTexts.splice(i, 1);
    }
    const chunkX = Math.floor(engine.playerPos.x / CHUNK_SIZE), chunkY = Math.floor(engine.playerPos.y / CHUNK_SIZE);
    for(let cx = chunkX - 1; cx <= chunkX + 1; cx++) for(let cy = chunkY - 1; cy <= chunkY + 1; cy++) {
        const key = `${cx},${cy}`; if (!engine.chunks[key]) engine.chunks[key] = generateChunk(cx, cy);
    }
  };

  const generateChunk = (cx: number, cy: number): TileType[][] => {
      const chunk: TileType[][] = [];
      for(let x=0; x<CHUNK_SIZE; x++) {
          chunk[x] = [];
          for(let y=0; y<CHUNK_SIZE; y++) {
              const wx = cx * CHUNK_SIZE + x, wy = cy * CHUNK_SIZE + y;
              chunk[x][y] = calculateTileType(wx, wy);
              if (chunk[x][y] === 'grass') {
                if (Math.random() < 0.04) gameState.current.entities.push({ id: Math.random().toString(), x: wx + 0.5, y: wy + 0.5, type: 'tree_oak', health: 100, maxHealth: 100 });
                else if (Math.random() < 0.015) gameState.current.entities.push({ id: Math.random().toString(), x: wx + 0.5, y: wy + 0.5, type: 'rock_standard', health: 80, maxHealth: 80 });
                else if (Math.random() < 0.02) gameState.current.entities.push({ id: Math.random().toString(), x: wx + 0.5, y: wy + 0.5, type: 'bush_berry', health: 50, maxHealth: 50 });
                else if (Math.random() < 0.005) gameState.current.entities.push({ id: Math.random().toString(), x: wx + 0.5, y: wy + 0.5, type: 'deer', health: 60, maxHealth: 60, aiState: 'idle', lastAiTick: performance.now() });
                else if (Math.random() < 0.008) gameState.current.entities.push({ id: Math.random().toString(), x: wx + 0.5, y: wy + 0.5, type: 'rabbit', health: 20, maxHealth: 20, aiState: 'idle', lastAiTick: performance.now() });
              }
          }
      }
      return chunk;
  };

  const handleDeath = () => { setIsDead(true); SoundManager.playUI('fanfare'); };
  const startNewGame = () => {
    gameState.current = { ...gameState.current, playerPos: { x: 0, y: 0 }, playerStats: { ...INITIAL_STATS, character: gameState.current.playerStats.character }, inventory: [{ ...ITEMS.axe }, { ...ITEMS.pickaxe }, { ...ITEMS.wood, quantity: 20 }, { ...ITEMS.berry, quantity: 20 }, { ...ITEMS.arrow, quantity: 50 }, { ...ITEMS.bow }], entities: [], projectiles: [], particles: [], chunks: {}, time: 800, gameStarted: true, isPaused: false };
    setIsDead(false); setActiveModal('none'); setGameStarted(true);
  };

  const continueGame = () => {
    const dataStr = localStorage.getItem(SAVE_KEY);
    if (!dataStr) return;
    try { const data = JSON.parse(dataStr); gameState.current = { ...gameState.current, ...data, gameStarted: true, isPaused: false }; setIsDead(false); setActiveModal('none'); setGameStarted(true); } catch(e) {}
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-900 select-none">
        {gameStarted ? (
            <>
                <GameCanvas gameState={gameState.current} canvasRef={canvasRef} placingEntityType={placingEntityType} />
                <HUD stats={gameState.current.playerStats} time={gameState.current.time} message={message} gameState={gameState.current} onAction={handleAction} usableItemsForQuickSlots={getUsableItemsForQuickSlots(gameState.current.inventory)} onZoom={(d) => inputManagerRef.current?.handleWheel({ deltaY: d } as WheelEvent)} onRotate={() => {}} onOpenSettings={() => setActiveModal('settings')} />
                <div className="absolute top-4 right-4 z-50 flex gap-4">
                    <Minimap gameState={gameState.current} />
                    <button onClick={() => setActiveModal('inventory')} className="w-12 h-12 bg-black/40 rounded-full border border-white/20 flex items-center justify-center text-2xl">🎒</button>
                    <button onClick={() => setActiveModal('crafting')} className="w-12 h-12 bg-black/40 rounded-full border border-white/20 flex items-center justify-center text-2xl">⚒️</button>
                </div>
                {activeModal === 'inventory' && <Inventory items={gameState.current.inventory} equippedItemId={gameState.current.playerStats.equippedItemId} isNearWorkbench={isNearWorkbench} onAction={handleAction} onClose={() => setActiveModal('none')} onSwitchToCrafting={() => setActiveModal('crafting')} language={gameState.current.settings.language} />}
                {activeModal === 'crafting' && <Crafting inventory={gameState.current.inventory} playerLevel={gameState.current.playerStats.level} isNearWorkbench={isNearWorkbench} onCraft={(recipeId) => {
                    const recipe = RECIPES.find(r => r.id === recipeId);
                    if (recipe) {
                        recipe.ingredients && Object.entries(recipe.ingredients).forEach(([id, qty]) => {
                            const item = gameState.current.inventory.find(i => i.id === id);
                            if (item) item.quantity -= (qty as number);
                        });
                        if (recipe.output.type === 'structure') {
                            setPlacingEntityType(recipe.output.placeEntity!);
                            setActiveModal('none');
                        } else {
                            gameState.current.inventory.push({ ...recipe.output, id: recipe.output.id + Math.random() });
                        }
                        showMessage(TRANSLATIONS[gameState.current.settings.language].crafted);
                        SoundManager.play('craft');
                        gameState.current.playerStats.xp += 20; checkLevelUp(gameState.current.playerStats);
                    }
                }} onClose={() => setActiveModal('none')} onSwitchToInventory={() => setActiveModal('inventory')} language={gameState.current.settings.language} />}
                {isDead && <DeathScreen stats={gameState.current.playerStats} language={gameState.current.settings.language} onRetry={startNewGame} />}
                {placingEntityType && (
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-amber-600 rounded-full border border-stone-900 shadow-2xl font-black text-stone-950 uppercase tracking-widest animate-pulse z-50">
                        Placement Mode: Click to Place {placingEntityType} (ESC to cancel)
                    </div>
                )}
            </>
        ) : (
            <MainMenu 
                onStart={startNewGame} 
                onContinue={continueGame} 
                hasActiveSession={hasSave} 
                settings={gameState.current.settings} 
                onUpdateSettings={(s) => { 
                  gameState.current.settings = s; 
                  saveSettings(); 
                  setUiState(u => u + 1); 
                }} 
                playerStats={gameState.current.playerStats} 
                onUpdatePlayerStats={(p) => { 
                  gameState.current.playerStats = p; 
                  saveSettings(); 
                  setUiState(u => u + 1); 
                }} 
            />
        )}
    </div>
  );
};

export default App;
