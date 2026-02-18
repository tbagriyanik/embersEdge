
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, PlayerStats, Entity, Particle, Projectile, FloatingText, WeatherState, Item, TileType, GameSettings, WeatherType, EntityType } from './types';
import { INITIAL_STATS, TILE_WIDTH, TILE_HEIGHT, ITEMS, RECIPES, CHUNK_SIZE, SAVE_KEY, SETTINGS_SAVE_KEY, TRANSLATIONS, GATHER_BASE_DAMAGE, GATHER_XP_PER_HIT, GATHER_ITEM_QUANTITY, GATHER_TOOL_REQUIREMENTS, MAX_INVENTORY_SLOTS, GATHER_HAND_DAMAGE, GATHER_TOOL_BOOST, VILLAGER_DIALOGUE, VILLAGE_NAMES } from './constants';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { MobileControls } from './components/MobileControls';
import { Inventory } from './components/Inventory';
import { Crafting } from './components/Crafting';
import { MainMenu } from './components/MainMenu';
import { DeathScreen } from './components/DeathScreen';
import { Minimap } from './components/Minimap';
import { DialogueModal } from './components/DialogueModal';
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

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'inventory' | 'crafting' | 'shop' | 'settings' | 'dialogue'>('none');
  const [activeDialogueId, setActiveDialogueId] = useState<string | null>(null);
  const [isDead, setIsDead] = useState(false);
  const [isNearWorkbench, setIsNearWorkbench] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [placingEntityType, setPlacingEntityType] = useState<EntityType | null>(null);
  const [isInVillage, setIsInVillage] = useState(false);
  
  const gameState = useRef<GameState>({
    playerPos: { x: 0, y: 0 },
    playerStats: { ...INITIAL_STATS },
    inventory: [],
    quickSlots: Array(9).fill(null),
    entities: [],
    projectiles: [],
    floatingTexts: [],
    particles: [],
    time: 800,
    isDay: true,
    gameStarted: false, 
    isPaused: false,
    isResting: false,
    weather: { type: 'clear', intensity: 0, transitionTimer: 0 },
    settings: { language: 'en', soundEnabled: true },
    viewConfig: { zoom: 1, rotation: 0, cameraOffsetX: 0, cameraOffsetY: 0 },
    chunks: {},
    hoveredEntityId: null,
    clickMarker: null
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

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const getVillageName = useCallback((cx: number, cy: number) => {
      const lang = gameState.current.settings.language;
      const names = VILLAGE_NAMES[lang];
      const hash = Math.abs((cx * 31) ^ cy);
      return names[hash % names.length];
  }, []);

  const addItemToInventory = useCallback((itemProto: Item, quantity: number) => {
    const engine = gameState.current;
    const inventory = engine.inventory;
    const t = (key: string) => TRANSLATIONS[engine.settings.language][key] || key;

    const existing = inventory.find(i => i.id === itemProto.id && i.stackable && (i.quantity < (i.maxStack || 99)));
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      if (inventory.length >= MAX_INVENTORY_SLOTS) {
        showMessage(t('inv_full'));
        return false;
      }

      const newUniqueId = `${itemProto.id}-${Math.random()}`;
      const newItem = { ...itemProto, quantity, uniqueId: newUniqueId };
      inventory.push(newItem);

      const autoSlotTypes = ['tool', 'weapon', 'food', 'structure'];
      if (autoSlotTypes.includes(newItem.type)) {
          const emptySlotIdx = engine.quickSlots.findIndex(slot => slot === null);
          if (emptySlotIdx !== -1) {
              engine.quickSlots[emptySlotIdx] = newUniqueId;
          }
      }
    }
    return true;
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
      quickSlots: gameState.current.quickSlots,
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
      stats.health = 100; stats.hunger = 100; stats.thirst = 100;
      const t = (key: string) => TRANSLATIONS[gameState.current.settings.language][key] || key;
      showMessage(t('level_up'));
      addFloatingText(gameState.current.playerPos.x, gameState.current.playerPos.y, t('level_up'), '#fbbf24');
      SoundManager.playUI('fanfare');
      spawnParticles(gameState.current.playerPos.x, gameState.current.playerPos.y, 'spark', 15, '#fbbf24', 1.5);
    }
  }, []);

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    gameState.current.floatingTexts.push({
      id: Math.random().toString(), x, y, text, color, life: 1.5, vy: -0.5
    });
  };

  const spawnParticles = (x: number, y: number, type: Particle['type'], count: number, color: string, sizeScale = 1) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        id: Math.random(),
        x, y,
        vx: (Math.random() - 0.5) * (type === 'smoke' ? 0.3 : 5),
        vy: type === 'smoke' ? -1 - Math.random() * 0.5 : (Math.random() - 0.5) * 5,
        life: type === 'smoke' ? 2.5 : 1.0,
        maxLife: type === 'smoke' ? 2.5 : 1.0,
        size: (Math.random() * 0.5 + 0.2) * sizeScale,
        color,
        type
      });
    }
  };

  const handleGift = useCallback((entityId: string) => {
    const engine = gameState.current;
    const t = (key: string) => TRANSLATIONS[engine.settings.language][key] || key;
    
    const giftableIds = ['berry', 'meat_cooked', 'flower', 'berry_seed'];
    const giftItem = engine.inventory.find(i => giftableIds.includes(i.id));
    
    if (giftItem) {
        giftItem.quantity--;
        if (giftItem.quantity <= 0) {
            engine.quickSlots = engine.quickSlots.map(uid => uid === giftItem.uniqueId ? null : uid);
            engine.inventory = engine.inventory.filter(i => i.uniqueId !== giftItem.uniqueId);
        }
        
        const entity = engine.entities.find(e => e.id === entityId);
        if (entity) {
            spawnParticles(entity.x, entity.y - 1, 'heart', 10, '#f43f5e', 1.2);
            showMessage(`${t('give_gift')}: ${t(giftItem.id)}!`);
            addFloatingText(entity.x, entity.y, "❤️", "#f43f5e");
            SoundManager.playUI('fanfare');
            engine.playerStats.xp += 50;
            checkLevelUp(engine.playerStats);
        }
        setUiState(prev => prev + 1);
        return true;
    } else {
        showMessage(t('no_gifts'));
        return false;
    }
  }, [checkLevelUp]);

  const handleAction = useCallback((action: 'use' | 'reorder' | 'equip' | 'assign_quickslot' | 'place' | 'repair' | 'repair_all' | 'fire', data: any) => {
    const engine = gameState.current;
    const t = (key: string) => TRANSLATIONS[engine.settings.language][key] || key;

    if (action === 'use' || action === 'equip') {
        const item = data as Item;
        if (item.type === 'food') {
            const stats = engine.playerStats;
            if (item.effect) {
                stats.hunger = Math.min(100, stats.hunger + (item.effect.hunger || 0));
                stats.health = Math.min(100, stats.health + (item.effect.health || 0));
                stats.thirst = Math.min(100, stats.thirst + (item.effect.thirst || 0));
                SoundManager.play('eat');
                addFloatingText(engine.playerPos.x, engine.playerPos.y, `+${item.effect.hunger} Hunger`, '#fbbf24');
                const idx = engine.inventory.findIndex(i => i.uniqueId === item.uniqueId);
                if (idx > -1) {
                    engine.inventory[idx].quantity--;
                    if (engine.inventory[idx].quantity <= 0) {
                      engine.quickSlots = engine.quickSlots.map(uid => uid === item.uniqueId ? null : uid);
                      engine.inventory.splice(idx, 1);
                    }
                }
            }
        } else if (item.type === 'tool' || item.type === 'weapon') {
            engine.playerStats.equippedItemId = engine.playerStats.equippedItemId === item.id ? null : item.id;
            SoundManager.playUI('equip');
        } else if (item.type === 'structure' || item.placeEntity) {
            const facing = engine.playerStats.facing;
            let ox = 0, oy = 0;
            if (facing === 'nw') { ox = -1.5; oy = -1.5; } else if (facing === 'ne') { ox = 1.5; oy = -1.5; } else if (facing === 'sw') { ox = -1.5; oy = 1.5; } else { ox = 1.5; oy = 1.5; }
            handleAction('place', { x: engine.playerPos.x + ox, y: engine.playerPos.y + oy, type: item.placeEntity });
        }
    } else if (action === 'assign_quickslot') {
        const { uniqueId, slotIdx } = data;
        const item = engine.inventory.find(i => i.uniqueId === uniqueId);
        if (item) {
          engine.quickSlots = engine.quickSlots.map(uid => uid === uniqueId ? null : uid);
          engine.quickSlots[slotIdx] = uniqueId;
          SoundManager.playUI('click');
        }
    } else if (action === 'fire') {
        const arrowIdx = engine.inventory.findIndex(i => i.id === 'arrow');
        if (arrowIdx > -1) {
            const targetItem = engine.inventory[arrowIdx];
            targetItem.quantity--;
            if (targetItem.quantity <= 0) {
              engine.quickSlots = engine.quickSlots.map(uid => uid === targetItem.uniqueId ? null : uid);
              engine.inventory.splice(arrowIdx, 1);
            }
            const dx = data.tx - engine.playerPos.x, dy = data.ty - engine.playerPos.y;
            const dist = Math.sqrt(dx*dx + dy*dy), speed = 25;
            engine.projectiles.push({
                id: Math.random().toString(), x: engine.playerPos.x, y: engine.playerPos.y,
                vx: (dx / dist) * speed, vy: (dy / dist) * speed, damage: 30, ownerId: 'player', life: 3, type: 'arrow'
            });
            SoundManager.playToolAction('bow');
            engine.playerStats.interactionAnim = 0.3;
        } else {
            showMessage(t('out_of_arrows'));
        }
    } else if (action === 'place') {
        const { x, y, type } = data;
        const collisionRadius = 1.2;
        const isSpaceOccupied = engine.entities.some(ent => {
            const dist = Math.sqrt((ent.x - x)**2 + (ent.y - y)**2);
            return dist < collisionRadius;
        });

        if (isSpaceOccupied) {
            showMessage("Space occupied!");
            return;
        }

        engine.entities.push({ id: Math.random().toString(), x, y, type: type, health: 100, maxHealth: 100 });
        SoundManager.play('build');
        showMessage(t('placed') + " " + t(type));
    } else if (action === 'reorder') {
        const { fromIdx, toIdx } = data;
        const [movedItem] = engine.inventory.splice(fromIdx, 1);
        engine.inventory.splice(toIdx, 0, movedItem);
    }
    setUiState(prev => prev + 1);
  }, []);

  const handleQuickSlotActivated = useCallback((slotIndex: number) => {
    const engine = gameState.current;
    const uniqueId = engine.quickSlots[slotIndex];
    if (uniqueId) {
      const item = engine.inventory.find(i => i.uniqueId === uniqueId);
      if (item) handleAction('use', item);
    }
  }, [handleAction]);

  const handleInteract = useCallback((entityId: string | null) => {
    const engine = gameState.current;
    const t = (key: string) => TRANSLATIONS[engine.settings.language][key] || key;
    engine.playerStats.interactionAnim = 0.3;

    if (entityId) {
      const entity = engine.entities.find(e => e.id === entityId);
      if (!entity) return;
      
      if (entity.type === 'loot_bag') {
          if (entity.storage && entity.storage.length > 0) {
              entity.storage.forEach(itemToAdd => {
                  addItemToInventory(itemToAdd, itemToAdd.quantity);
                  addFloatingText(engine.playerPos.x, engine.playerPos.y, `+${itemToAdd.quantity} ${t(itemToAdd.id)}`, '#fbbf24');
              });
              SoundManager.playUI('click');
              engine.entities = engine.entities.filter(e => e.id !== entityId);
          } else {
              engine.entities = engine.entities.filter(e => e.id !== entityId);
          }
          setUiState(prev => prev + 1);
          return;
      }

      if (entity.type === 'farm_plot') {
        if (!entity.growthStage) {
          const seeds = engine.inventory.find(i => i.id === 'berry_seed');
          if (seeds) {
            seeds.quantity--;
            if (seeds.quantity <= 0) {
              engine.quickSlots = engine.quickSlots.map(uid => uid === seeds.uniqueId ? null : uid);
              engine.inventory.splice(engine.inventory.indexOf(seeds), 1);
            }
            entity.growthStage = 1;
            entity.growthTimer = 3000;
            showMessage(t('planted'));
            SoundManager.play('build');
          } else {
            showMessage(t('berry_seed') + " ?");
          }
        } else if (entity.growthStage === 3) {
          entity.growthStage = undefined;
          entity.growthTimer = undefined;
          
          addItemToInventory(ITEMS.berry, 3);
          addItemToInventory(ITEMS.berry_seed, 1);

          showMessage(t('harvested'));
          SoundManager.play('eat');
          addFloatingText(entity.x, entity.y, "+3 Berry", "#fbbf24");
        }
        setUiState(p => p + 1);
        return;
      }

      if (entity.type === 'workbench') setActiveModal('crafting');
      else if (entity.type === 'shopkeeper' || entity.type === 'villager') {
          setActiveDialogueId(entityId);
          setActiveModal('dialogue');
          SoundManager.playUI('click');
      }
      else if (entity.type === 'well') {
        showMessage(t(`drink_water`));
        engine.playerStats.thirst = Math.min(100, engine.playerStats.thirst + 40);
        addFloatingText(engine.playerPos.x, engine.playerPos.y, `Refreshed!`, '#60a5fa');
        SoundManager.play('eat');
        setUiState(prev => prev + 1);
      } else if (entity.type === 'tent' || entity.type === 'hut') {
        setIsResting(true);
        engine.isResting = true;
        SoundManager.play('eat');
        showMessage(t('rest_tent'));
        
        setTimeout(() => {
            const innerEngine = gameState.current;
            innerEngine.time = (innerEngine.time + 500) % 2400;
            innerEngine.playerStats.health = Math.min(100, innerEngine.playerStats.health + 50);
            innerEngine.playerStats.stamina = 100;
            innerEngine.playerStats.hunger = Math.max(0, innerEngine.playerStats.hunger - 15);
            innerEngine.playerStats.thirst = Math.max(0, innerEngine.playerStats.thirst - 20);
            
            addFloatingText(entity.x, entity.y, `+50 HP / +5 Hours`, '#a855f7');
            setIsResting(false);
            engine.isResting = false;
            setUiState(prev => prev + 1);
        }, 2000);
      } else if (entity.type === 'campfire') {
        const inventory = engine.inventory;
        const rawMeat = inventory.find(i => i.id === 'meat_raw');
        const berries = inventory.find(i => i.id === 'berry');
        let cookedItemProto: Item | null = null, consumedItem: Item | null = null;
        if (rawMeat) { consumedItem = rawMeat; cookedItemProto = ITEMS.meat_cooked; }
        else if (berries) { consumedItem = berries; cookedItemProto = ITEMS.berry_cooked; }

        if (consumedItem && cookedItemProto) {
          consumedItem.quantity--;
          if (consumedItem.quantity <= 0) {
            engine.quickSlots = engine.quickSlots.map(uid => uid === consumedItem!.uniqueId ? null : uid);
            inventory.splice(inventory.indexOf(consumedItem), 1);
          }
          
          addItemToInventory(cookedItemProto, 1);
          
          showMessage(t('crafted') + " " + t(cookedItemProto.id));
          addFloatingText(entity.x, entity.y, t(cookedItemProto.id), '#fbbf24');
          SoundManager.play('craft');
          spawnParticles(entity.x, entity.y, 'spark', 8, '#f59e0b', 1.2);
          engine.playerStats.xp += 10; checkLevelUp(engine.playerStats);
        } else showMessage(t('need_raw_food'));
        setUiState(prev => prev + 1);
      }
    } else {
        const playerPos = engine.playerPos;
        const equippedTool = engine.inventory.find(i => i.id === engine.playerStats.equippedItemId);
        if (equippedTool?.id === 'hoe') {
          engine.entities.push({ id: `farm-${Math.random()}`, x: Math.floor(playerPos.x) + 0.5, y: Math.floor(playerPos.y) + 0.5, type: 'farm_plot', health: 100, maxHealth: 100 });
          showMessage(t('tilled_soil'));
          SoundManager.play('build');
          return;
        }

        const waterCheckRadius = 2.0;
        let nearWater = false;
        for (let ox = -waterCheckRadius; ox <= waterCheckRadius; ox += 0.5) {
            for (let oy = -waterCheckRadius; oy <= waterCheckRadius; oy += 0.5) {
                if (getTileAt(playerPos.x + ox, playerPos.y + oy) === 'water') {
                    nearWater = true;
                    break;
                }
            }
            if (nearWater) break;
        }

        if (nearWater && engine.playerStats.thirst < 98) {
          showMessage(t(`drink_water`));
          engine.playerStats.thirst = Math.min(100, engine.playerStats.thirst + 20);
          addFloatingText(playerPos.x, playerPos.y, `+20 Thirst`, '#60a5fa');
          SoundManager.play('eat');
          setUiState(prev => prev + 1);
        }
    }
  }, [getTileAt, checkLevelUp, handleAction, addItemToInventory]);

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
    const preferredTools = GATHER_TOOL_REQUIREMENTS[targetEntity.type as keyof typeof GATHER_TOOL_REQUIREMENTS] || [];
    let damage = GATHER_HAND_DAMAGE;
    if (equippedToolType === 'tool' || equippedToolType === 'weapon') {
        damage = GATHER_BASE_DAMAGE;
        if (preferredTools.includes(equippedTool?.id || '')) damage *= GATHER_TOOL_BOOST;
    }
    
    targetEntity.health -= damage;
    SoundManager.playGather(targetEntity.type, playerStats.equippedItemId);
    
    const gatherInfo = GATHER_ITEM_QUANTITY[targetEntity.type as keyof typeof GATHER_ITEM_QUANTITY];
    
    if (gatherInfo) {
      spawnParticles(targetEntity.x, targetEntity.y + 0.5, gatherInfo.particle as Particle['type'], 3, targetEntity.type.includes('tree') ? '#a16207' : '#fbbf24', 0.6);
      addFloatingText(targetEntity.x, targetEntity.y, `+${gatherInfo.quantity} ${t(gatherInfo.item)}`, '#fbbf24');
      
      const proto = ITEMS[gatherInfo.item];
      addItemToInventory(proto, gatherInfo.quantity);
    }
    
    playerStats.xp += GATHER_XP_PER_HIT; checkLevelUp(playerStats);
    
    if (equippedTool && equippedTool.durability !== undefined) {
      equippedTool.durability = Math.max(0, equippedTool.durability - 10);
      if (equippedTool.durability <= 0) { 
        showMessage(t('tool_broken')); 
        const toolIdx = inventory.indexOf(equippedTool);
        if (toolIdx > -1) {
          engine.quickSlots = engine.quickSlots.map(uid => uid === equippedTool.uniqueId ? null : uid);
          playerStats.equippedItemId = null; 
          inventory.splice(toolIdx, 1);
        }
      }
    }
    
    if (targetEntity.health <= 0) {
      engine.entities.splice(entityIndex, 1);
      spawnParticles(targetEntity.x, targetEntity.y + 0.5, gatherInfo?.particle as Particle['type'] || 'dust', 10, '#a16207', 1.0);
    }
    setUiState(prev => prev + 1);
  }, [checkLevelUp, addItemToInventory]);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_SAVE_KEY);
    if (savedSettings) try { gameState.current.settings = JSON.parse(savedSettings); } catch (e) {}
    const savedChar = localStorage.getItem('embers_character_config');
    if (savedChar) try { gameState.current.playerStats.character = JSON.parse(savedChar); } catch (e) {}
    setHasSave(!!localStorage.getItem(SAVE_KEY));
    window.addEventListener('click', () => SoundManager.init(), { once: true });
    
    if (!inputManagerRef.current) {
      inputManagerRef.current = new InputManager({
        onToggleInventory: () => setActiveModal(prev => prev === 'inventory' ? 'none' : 'inventory'),
        onToggleCrafting: () => setActiveModal(prev => prev === 'crafting' ? 'none' : 'crafting'),
        onToggleShop: () => {
          if (gameState.current.entities.some(e => (e.type === 'shopkeeper' || e.type === 'house_village') && Math.sqrt((e.x - gameState.current.playerPos.x)**2 + (e.y - gameState.current.playerPos.y)**2) < 15)) {
            setActiveModal(prev => prev === 'shop' ? 'none' : 'shop');
          } else {
            showMessage(TRANSLATIONS[gameState.current.settings.language]['need_village']);
          }
        },
        onOpenSettings: () => setActiveModal('settings'),
        onInteract: handleInteract,
        onGather: handleGather,
        onPanCamera: (dx, dy) => { gameState.current.viewConfig.cameraOffsetX += dx; gameState.current.viewConfig.cameraOffsetY += dy; },
        onZoom: (delta) => {
          if (delta < 0) gameState.current.viewConfig.zoom = Math.min(2, gameState.current.viewConfig.zoom + 0.1);
          else gameState.current.viewConfig.zoom = Math.max(0.5, gameState.current.viewConfig.zoom - 0.1);
        },
        onClickToMove: (worldX, worldY) => {
          if (gameState.current.playerStats.equippedItemId === 'bow') { handleAction('fire', { tx: worldX, ty: worldY }); return; }
          inputManagerRef.current?.setPlayerTargetPos({ x: worldX, y: worldY });
          gameState.current.clickMarker = { x: worldX, y: worldY, life: 1.0 };
        },
        onQuickSlotActivated: handleQuickSlotActivated,
        onEscape: () => { 
          setActiveModal(prev => {
            if (prev !== 'none') return 'none';
            setGameStarted(false);
            return 'none';
          });
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
      inputManagerRef.current?.destroy(); window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId.current); clearInterval(autoSaveInterval);
    };
  }, [handleQuickSlotActivated, handleInteract, handleGather, saveGame, activeModal, getTileAt, gameStarted]);

  useEffect(() => {
    gameState.current.isPaused = activeModal !== 'none' || isDead || isResting;
  }, [activeModal, isDead, isResting]);

  const gameLoop = (timestamp: number) => {
    const dt = Math.min((timestamp - lastTime.current) / 1000, 0.1);
    lastTime.current = timestamp;
    if (gameStarted && !isDead && !gameState.current.isPaused) update(dt);
    if (Math.floor(timestamp / 100) > Math.floor((timestamp - dt * 1000) / 100)) setUiState(prev => prev + 1);
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  const update = (dt: number) => {
    const engine = gameState.current; const now = performance.now();
    const keys = inputManagerRef.current?.getKeys() || {};
    const playerTargetPos = inputManagerRef.current?.getPlayerTargetPos();
    engine.time += dt * 5; if (engine.time >= 2400) engine.time = 0;
    engine.isDay = engine.time > 600 && engine.time < 1800;
    
    const nearVillage = engine.entities.some(e => (e.type === 'shopkeeper' || e.type === 'house_village') && Math.sqrt((e.x - engine.playerPos.x)**2 + (e.y - engine.playerPos.y)**2) < 15);
    if (nearVillage !== isInVillage) setIsInVillage(nearVillage);

    if (engine.playerStats.interactionAnim > 0) engine.playerStats.interactionAnim = Math.max(0, engine.playerStats.interactionAnim - dt);
    
    for (let k = engine.floatingTexts.length - 1; k >= 0; k--) {
      const ft = engine.floatingTexts[k];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) engine.floatingTexts.splice(k, 1);
    }

    for (let j = engine.particles.length - 1; j >= 0; j--) {
      const p = engine.particles[j];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) engine.particles.splice(j, 1);
    }

    for (let l = engine.projectiles.length - 1; l >= 0; l--) {
      const p = engine.projectiles[l];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) engine.projectiles.splice(l, 1);
    }

    if (engine.clickMarker) {
      engine.clickMarker.life -= dt * 2;
      if (engine.clickMarker.life <= 0) engine.clickMarker = null;
    }

    for (let i = engine.entities.length - 1; i >= 0; i--) {
      const ent = engine.entities[i];
      
      if (ent.type === 'farm_plot' && ent.growthStage && ent.growthStage < 3) {
        if (!ent.growthTimer) ent.growthTimer = 3000;
        ent.growthTimer -= dt * 1000;
        if (ent.growthTimer <= 0) {
          ent.growthStage++;
          ent.growthTimer = 3000;
          spawnParticles(ent.x, ent.y, 'leaf', 5, '#15803d', 0.8);
        }
      }

      if (ent.health <= 0 && ent.type !== 'loot_bag' && ent.type !== 'player') {
          const gatherInfo = GATHER_ITEM_QUANTITY[ent.type as keyof typeof GATHER_ITEM_QUANTITY];
          if (gatherInfo) {
              const proto = ITEMS[gatherInfo.item];
              const itemToDrop = { ...proto, quantity: gatherInfo.quantity, uniqueId: `${proto.id}-${Math.random()}` };
              engine.entities.push({ id: `loot-${Math.random()}`, x: ent.x, y: ent.y, type: 'loot_bag', health: 100, maxHealth: 100, storage: [itemToDrop] });
          }
          engine.entities.splice(i, 1);
          continue;
      }
      
      // ANIMAL & VILLAGER AI
      if ((ent.type === 'deer' || ent.type === 'rabbit' || ent.type === 'villager')) {
          if (!ent.aiState) ent.aiState = 'idle';
          if (!ent.lastAiTick) ent.lastAiTick = now;
          const isVillager = ent.type === 'villager';
          const wanderTime = isVillager ? 6000 : 3000;

          if (isVillager) {
              // VILLAGER AI LOGIC
              if (ent.aiState === 'idle') {
                if (now - ent.lastAiTick > wanderTime + Math.random() * 5000) {
                    // Decide: Wander locally or Travel to next village?
                    const r = Math.random();
                    if (r < 0.2 && ent.homeVillage) {
                        // Picking a neighboring target village
                        const neighbors = [
                            { cx: ent.homeVillage.cx + 10, cy: ent.homeVillage.cy },
                            { cx: ent.homeVillage.cx - 10, cy: ent.homeVillage.cy },
                            { cx: ent.homeVillage.cx, cy: ent.homeVillage.cy + 10 },
                            { cx: ent.homeVillage.cx, cy: ent.homeVillage.cy - 10 }
                        ];
                        ent.targetVillage = neighbors[Math.floor(Math.random() * neighbors.length)];
                        ent.aiState = 'traveling';
                        // Move to road center first
                        const roadWorldCenterLocal = 8.5;
                        const alongRoad = ent.targetVillage.cx !== ent.homeVillage.cx; // True if horizontal move
                        ent.targetX = alongRoad ? ent.x : (ent.homeVillage.cx * CHUNK_SIZE + roadWorldCenterLocal);
                        ent.targetY = alongRoad ? (ent.homeVillage.cy * CHUNK_SIZE + roadWorldCenterLocal) : ent.y;
                    } else {
                        ent.aiState = 'wandering';
                        // Keep within village bounds (roughly 8-tile radius from center)
                        const centerX = (ent.homeVillage?.cx || 0) * CHUNK_SIZE + 8.5;
                        const centerY = (ent.homeVillage?.cy || 0) * CHUNK_SIZE + 8.5;
                        ent.targetX = centerX + (Math.random() - 0.5) * 12;
                        ent.targetY = centerY + (Math.random() - 0.5) * 12;
                    }
                    ent.lastAiTick = now;
                }
              } else if (ent.aiState === 'wandering') {
                  const dx = ent.targetX! - ent.x, dy = ent.targetY! - ent.y, dist = Math.sqrt(dx*dx + dy*dy);
                  if (dist < 0.3) { ent.aiState = 'idle'; ent.lastAiTick = now; }
                  else {
                      const speed = 1.8;
                      ent.x += (dx/dist)*speed*dt; ent.y += (dy/dist)*speed*dt;
                      ent.facing = dx > 0 ? 'right' : 'left';
                  }
              } else if (ent.aiState === 'traveling') {
                  if (!ent.targetVillage) { ent.aiState = 'idle'; return; }
                  const targetX = ent.targetVillage.cx * CHUNK_SIZE + 8.5;
                  const targetY = ent.targetVillage.cy * CHUNK_SIZE + 8.5;
                  
                  const dx = targetX - ent.x, dy = targetY - ent.y, dist = Math.sqrt(dx*dx + dy*dy);
                  if (dist < 0.5) {
                      // Arrived at target village! Swap home and idle
                      ent.homeVillage = ent.targetVillage;
                      ent.targetVillage = undefined;
                      ent.aiState = 'idle';
                      ent.lastAiTick = now;
                  } else {
                      // Alignment step: villagers favor road centers
                      const speed = 2.5;
                      const roadX = Math.floor(ent.x / CHUNK_SIZE) * CHUNK_SIZE + 8.5;
                      const roadY = Math.floor(ent.y / CHUNK_SIZE) * CHUNK_SIZE + 8.5;

                      // Move along the major axis of the road
                      if (Math.abs(targetX - ent.x) > 0.5) {
                          // Horizontal road movement
                          ent.x += (targetX > ent.x ? 1 : -1) * speed * dt;
                          // Smooth alignment to road Y
                          ent.y += (roadY - ent.y) * 2 * dt;
                          ent.facing = targetX > ent.x ? 'right' : 'left';
                      } else {
                          // Vertical road movement
                          ent.y += (targetY > ent.y ? 1 : -1) * speed * dt;
                          // Smooth alignment to road X
                          ent.x += (roadX - ent.x) * 2 * dt;
                          ent.facing = targetX > ent.x ? 'right' : 'left';
                      }
                  }
              }
          } else {
              // ANIMAL AI LOGIC (Deer, Rabbit)
              if (ent.aiState === 'idle' && now - ent.lastAiTick > wanderTime + Math.random() * 4000) {
                  ent.aiState = 'grazing'; 
                  ent.targetX = ent.x + (Math.random() - 0.5) * 8; 
                  ent.targetY = ent.y + (Math.random() - 0.5) * 8;
                  ent.facing = ent.targetX > ent.x ? 'right' : 'left'; ent.lastAiTick = now;
              } else if (ent.aiState === 'grazing' || ent.aiState === 'fleeing') {
                  const dx = ent.targetX! - ent.x, dy = ent.targetY! - ent.y, dist = Math.sqrt(dx*dx + dy*dy);
                  if (dist < 0.2) { ent.aiState = 'idle'; ent.lastAiTick = now; }
                  else { 
                      const speed = (ent.type === 'rabbit' ? 3 : 2) * (ent.aiState === 'fleeing' ? 3 : 1);
                      const nextX = ent.x + (dx/dist)*speed*dt, nextY = ent.y + (dy/dist)*speed*dt;
                      if (getTileAt(nextX, nextY) !== 'water') { ent.x = nextX; ent.y = nextY; } else { ent.aiState = 'idle'; ent.lastAiTick = now; }
                  }
              }
          }
      }
    }

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1;
    if (playerTargetPos) {
        const targetDx = playerTargetPos.x - engine.playerPos.x, targetDy = playerTargetPos.y - engine.playerPos.y;
        const dist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        if (dist > 0.3) { dx = targetDx / dist; dy = targetDy / dist; } else { inputManagerRef.current?.clearPlayerTargetPos(); dx = 0; dy = 0; }
    }
    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx*dx + dy*dy); const speed = keys['shift'] && engine.playerStats.stamina > 0 ? 14 : 7;
      velocity.current.x += (dx/mag * speed - velocity.current.x) * 30 * dt; velocity.current.y += (dy/mag * speed - velocity.current.y) * 30 * dt;
      engine.playerStats.isWalking = true;
    } else { velocity.current.x -= velocity.current.x * 15 * dt; velocity.current.y -= velocity.current.y * 15 * dt; engine.playerStats.isWalking = false; }
    const nX = engine.playerPos.x + velocity.current.x * dt, nY = engine.playerPos.y + velocity.current.y * dt;
    if (getTileAt(nX, engine.playerPos.y) !== 'water') engine.playerPos.x = nX;
    if (getTileAt(engine.playerPos.x, nY) !== 'water') engine.playerPos.y = nY;
    
    engine.playerStats.hunger = Math.max(0, engine.playerStats.hunger - 0.05 * dt);
    engine.playerStats.thirst = Math.max(0, engine.playerStats.thirst - 0.08 * dt);
    
    const chunkX = Math.floor(engine.playerPos.x / CHUNK_SIZE), chunkY = Math.floor(engine.playerPos.y / CHUNK_SIZE);
    for(let cx = chunkX - 1; cx <= chunkX + 1; cx++) for(let cy = chunkY - 1; cy <= chunkY + 1; cy++) {
        const key = `${cx},${cy}`; if (!engine.chunks[key]) engine.chunks[key] = generateChunk(cx, cy);
    }
  };

  const generateChunk = (cx: number, cy: number): TileType[][] => {
      const chunk: TileType[][] = [];
      const isRoadChunkX = cx % 10 === 0;
      const isRoadChunkY = cy % 10 === 0;
      const isVillageChunk = isRoadChunkX && isRoadChunkY;

      for(let x=0; x<CHUNK_SIZE; x++) {
          chunk[x] = [];
          for(let y=0; y<CHUNK_SIZE; y++) {
              const wx = cx * CHUNK_SIZE + x, wy = cy * CHUNK_SIZE + y;
              
              const isRoad = (isRoadChunkX && x >= 7 && x <= 9) || (isRoadChunkY && y >= 7 && y <= 9);
              
              if (isVillageChunk && x > 4 && x < 12 && y > 4 && y < 12) {
                  chunk[x][y] = 'stone';
                  if (x === 8 && y === 8) gameState.current.entities.push({ id: `shop-${cx}-${cy}`, x: wx + 0.5, y: wy + 0.5, type: 'shopkeeper', health: 1000, maxHealth: 1000 });
                  else if ((x === 6 || x === 10) && (y === 6 || y === 10)) gameState.current.entities.push({ id: `h-${cx}-${cy}-${x}-${y}`, x: wx + 0.5, y: wy + 0.5, type: 'house_village', health: 500, maxHealth: 500 });
                  else if (Math.random() < 0.1) {
                      gameState.current.entities.push({ 
                          id: `v-${cx}-${cy}-${x}-${y}`, 
                          x: wx + 0.5, 
                          y: wy + 0.5, 
                          type: 'villager', 
                          health: 100, 
                          maxHealth: 100, 
                          aiState: 'idle',
                          homeVillage: { cx, cy }
                      });
                  }
                  continue;
              }

              if (isRoad) {
                  chunk[x][y] = 'road_tile';
                  continue;
              }

              chunk[x][y] = calculateTileType(wx, wy);

              if (chunk[x][y] === 'grass' && Math.random() < 0.05) {
                const types: EntityType[] = ['tree_oak', 'flower', 'grass_clump', 'rock_standard', 'deer', 'rabbit', 'bush_berry'];
                const t = types[Math.floor(Math.random() * types.length)];
                gameState.current.entities.push({ id: Math.random().toString(), x: wx + 0.5, y: wy + 0.5, type: t, health: 100, maxHealth: 100 });
              }
          }
      }
      return chunk;
  };

  const startNewGame = () => {
    gameState.current.playerPos = { x: 0, y: 0 };
    gameState.current.playerStats = { ...INITIAL_STATS, character: gameState.current.playerStats.character };
    gameState.current.inventory = [];
    gameState.current.quickSlots = Array(9).fill(null);
    gameState.current.entities = [];
    gameState.current.projectiles = [];
    gameState.current.particles = [];
    gameState.current.floatingTexts = [];
    gameState.current.chunks = {};
    gameState.current.time = 800;
    gameState.current.gameStarted = true;
    
    addItemToInventory(ITEMS.axe, 1);
    addItemToInventory(ITEMS.hoe, 1);
    addItemToInventory(ITEMS.wood, 10);
    
    setIsDead(false); setIsResting(false); setActiveModal('none'); setGameStarted(true);
  };

  const continueGame = () => {
    const dataStr = localStorage.getItem(SAVE_KEY);
    if (dataStr) try { 
      const data = JSON.parse(dataStr); 
      gameState.current = { ...gameState.current, ...data, gameStarted: true, isPaused: false, isResting: false }; 
      setGameStarted(true); 
    } catch(e) {}
  };

  const craftItem = (recipeId: string) => {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (recipe) {
        const engine = gameState.current;
        const canCraft = Object.entries(recipe.ingredients).every(([id, qty]) => {
            const item = engine.inventory.find(i => i.id === id);
            return item && item.quantity >= (qty as number);
        });

        if (!canCraft) return false;

        Object.entries(recipe.ingredients).forEach(([id, qty]) => {
            const item = engine.inventory.find(i => i.id === id);
            if (item) {
              item.quantity -= (qty as number);
              if (item.quantity <= 0) {
                engine.quickSlots = engine.quickSlots.map(uid => uid === item.uniqueId ? null : uid);
                engine.inventory = engine.inventory.filter(i => i.uniqueId !== item.uniqueId);
              }
            }
        });

        if (recipe.output.type === 'structure') {
            handleAction('place', { x: engine.playerPos.x + 1, y: engine.playerPos.y + 1, type: recipe.output.placeEntity! });
        } else {
            addItemToInventory(recipe.output, recipe.output.quantity);
        }
        SoundManager.play('craft'); 
        engine.playerStats.xp += 20; 
        checkLevelUp(engine.playerStats);
        setUiState(prev => prev + 1);
        return true;
    }
    return false;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-stone-900 select-none">
        {gameStarted ? (
            <>
                <GameCanvas gameState={gameState.current} canvasRef={canvasRef} placingEntityType={placingEntityType} />
                <HUD stats={gameState.current.playerStats} time={gameState.current.time} message={message} gameState={gameState.current} onAction={handleAction} onZoom={(d) => inputManagerRef.current?.handleWheel({ deltaY: d } as WheelEvent)} onRotate={() => {}} onOpenSettings={() => setActiveModal('settings')} />
                
                <div className="absolute top-4 right-4 z-50 flex gap-4">
                    <button onClick={() => setActiveModal(prev => prev === 'inventory' ? 'none' : 'inventory')} className={`w-12 h-12 bg-black/40 rounded-full border border-white/20 flex items-center justify-center text-2xl pointer-events-auto ${activeModal === 'inventory' ? 'bg-amber-500/80' : ''}`}>🎒</button>
                    <button onClick={() => setActiveModal(prev => prev === 'crafting' ? 'none' : 'crafting')} className={`w-12 h-12 bg-black/40 rounded-full border border-white/20 flex items-center justify-center text-2xl pointer-events-auto ${activeModal === 'crafting' ? 'bg-amber-500/80' : ''}`}>⚒️</button>
                    <button onClick={() => {
                        if (isInVillage) setActiveModal(prev => prev === 'shop' ? 'none' : 'shop');
                        else showMessage(TRANSLATIONS[gameState.current.settings.language]['need_village']);
                    }} className={`w-12 h-12 bg-black/40 rounded-full border border-white/20 flex items-center justify-center text-2xl pointer-events-auto ${activeModal === 'shop' ? 'bg-amber-500/80' : ''}`}>🪙</button>
                </div>

                <div className="absolute bottom-4 right-4 z-50 pointer-events-auto">
                    <Minimap gameState={gameState.current} />
                </div>

                {activeModal === 'dialogue' && activeDialogueId && (
                  <DialogueModal 
                    entity={gameState.current.entities.find(e => e.id === activeDialogueId)!}
                    inventory={gameState.current.inventory}
                    onClose={() => { setActiveModal('none'); setActiveDialogueId(null); }}
                    onTrade={() => { setActiveModal('shop'); }}
                    onGift={handleGift}
                    language={gameState.current.settings.language}
                    villageName={getVillageName(Math.floor(gameState.current.playerPos.x / CHUNK_SIZE), Math.floor(gameState.current.playerPos.y / CHUNK_SIZE))}
                  />
                )}

                {activeModal === 'inventory' && <Inventory items={gameState.current.inventory} quickSlots={gameState.current.quickSlots} equippedItemId={gameState.current.playerStats.equippedItemId} isNearWorkbench={isNearWorkbench} onAction={handleAction} onClose={() => setActiveModal('none')} onSwitchToCrafting={() => setActiveModal('crafting')} onSwitchToShop={() => { if(isInVillage) setActiveModal('shop'); else showMessage(TRANSLATIONS[gameState.current.settings.language]['need_village']); }} activeTab="inventory" language={gameState.current.settings.language} />}
                {activeModal === 'crafting' && <Crafting inventory={gameState.current.inventory} playerLevel={gameState.current.playerStats.level} isNearWorkbench={isNearWorkbench} onCraft={craftItem} onClose={() => setActiveModal('none')} onSwitchToInventory={() => setActiveModal('inventory')} onSwitchToShop={() => { if(isInVillage) setActiveModal('shop'); else showMessage(TRANSLATIONS[gameState.current.settings.language]['need_village']); }} activeTab="crafting" language={gameState.current.settings.language} />}
                {activeModal === 'shop' && (
                  <Crafting 
                    inventory={gameState.current.inventory} 
                    playerLevel={gameState.current.playerStats.level} 
                    isNearWorkbench={true}
                    onCraft={craftItem} 
                    onClose={() => setActiveModal('none')} 
                    onSwitchToInventory={() => setActiveModal('inventory')}
                    onSwitchToCrafting={() => setActiveModal('crafting')}
                    activeTab="shop"
                    language={gameState.current.settings.language} 
                    shopMode={true}
                  />
                )}
                {isDead && <DeathScreen stats={gameState.current.playerStats} language={gameState.current.settings.language} onRetry={startNewGame} />}
            </>
        ) : (
            <MainMenu onStart={startNewGame} onContinue={continueGame} hasActiveSession={hasSave} settings={gameState.current.settings} onUpdateSettings={(s) => { gameState.current.settings = s; saveSettings(); setUiState(u => u + 1); }} playerStats={gameState.current.playerStats} onUpdatePlayerStats={(p) => { gameState.current.playerStats = p; saveSettings(); setUiState(u => u + 1); }} />
        )}
    </div>
  );
};

export default App;
