
import { GameState, InputManagerCallbacks, EntityType, Entity } from './types';
import { TILE_WIDTH, TILE_HEIGHT } from './constants';
import React from 'react';

export class InputManager {
  private keys: { [key: string]: boolean } = {};
  private mouseState = { x: 0, y: 0, leftDown: false, rightDown: false, middleDown: false };
  private playerTargetPos: { x: number; y: number } | null = null;
  private rightClickStartPos = { x: 0, y: 0 }; 
  private canvas: HTMLCanvasElement | null = null;
  private callbacks: InputManagerCallbacks;
  private gameState: React.MutableRefObject<GameState>;

  private readonly INTERACT_RANGE = 2.0;

  private interactableEntityTypes: EntityType[] = [
    'workbench', 
    'campfire', 
    'chest', 
    'well', 
    'tent',
    'farm_plot',
    'loot_bag',
  ];

  private gatherableEntityTypes: EntityType[] = [
    'tree_oak',
    'tree_pine',
    'tree_palm',
    'rock_standard',
    'rock_iron',
    'bush_berry',
    'flower',
    'iron_ore',
    'deer',
    'rabbit'
  ];

  constructor(callbacks: InputManagerCallbacks, gameState: React.MutableRefObject<GameState>) {
    this.callbacks = callbacks;
    this.gameState = gameState;
  }

  init(canvas: HTMLCanvasElement | null): void {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Attaching listeners to window for better robustness
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('contextmenu', this.handleContextMenu);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private getNearestEntity(): Entity | null {
    const engine = this.gameState.current;
    const player = engine.playerPos;
    let closest: Entity | null = null;
    let minDist = this.INTERACT_RANGE;

    const allActionable = [...this.interactableEntityTypes, ...this.gatherableEntityTypes];

    for (const ent of engine.entities) {
      if (!allActionable.includes(ent.type)) continue;
      
      const dx = ent.x - player.x;
      const dy = ent.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        closest = ent;
      }
    }
    return closest;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    // Escape should always work to close modals
    if (key === 'escape') {
      this.callbacks.onEscape();
      return;
    }

    // Ignore other world interactions if paused
    if (this.gameState.current.isPaused) return;

    this.keys[key] = true;

    if (key === 'f') {
      this.callbacks.onOpenInventory();
    }
    if (key === 'c') {
      this.callbacks.onOpenCrafting();
    }
    if (key === 'e') {
      const target = this.getNearestEntity();
      if (target) {
        if (this.gatherableEntityTypes.includes(target.type)) {
          this.callbacks.onGather(target.id);
        } else {
          this.callbacks.onInteract(target.id);
        }
      } else {
        this.callbacks.onInteract(null);
      }
    }
    
    const numericKey = parseInt(e.key);
    if (!isNaN(numericKey) && numericKey >= 1 && numericKey <= 9) {
      this.callbacks.onQuickSlotActivated(numericKey - 1);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.canvas) return;

    // Ignore clicks if game is paused (modal is open)
    // The modals use fixed inset-0 and pointer-events-auto, but we add this for extra safety.
    if (this.gameState.current.isPaused) return;

    if (e.button === 0) { // Left click
      this.mouseState.leftDown = true;
      const rect = this.canvas.getBoundingClientRect();
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;

      const engine = this.gameState.current;
      const { zoom, cameraOffsetX, cameraOffsetY } = engine.viewConfig;

      const worldX = (mouseCanvasX - (this.canvas.width / 2 + cameraOffsetX)) / (TILE_WIDTH * zoom) + engine.playerPos.x;
      const worldY = (mouseCanvasY - (this.canvas.height / 2 + cameraOffsetY)) / (TILE_HEIGHT * zoom) + engine.playerPos.y;
      
      let clickedEntity: Entity | null = null;
      const sorted = [...engine.entities].sort((a, b) => b.y - a.y);
      for (const ent of sorted) {
        const dx = Math.abs(ent.x - worldX);
        const dy = Math.abs(ent.y - worldY);
        if (dx < 0.7 && dy < 0.7) {
          clickedEntity = ent;
          break;
        }
      }

      if (clickedEntity) {
        const distToPlayer = Math.sqrt((clickedEntity.x - engine.playerPos.x)**2 + (clickedEntity.y - engine.playerPos.y)**2);
        if (distToPlayer <= this.INTERACT_RANGE) {
            if (this.gatherableEntityTypes.includes(clickedEntity.type)) {
              this.callbacks.onGather(clickedEntity.id);
              return;
            }
            if (this.interactableEntityTypes.includes(clickedEntity.type)) {
              this.callbacks.onInteract(clickedEntity.id);
              return;
            }
        }
      }
      
      this.callbacks.onClickToMove(worldX, worldY);
      
    } else if (e.button === 1) { 
      this.mouseState.middleDown = true;
    } else if (e.button === 2) { 
      this.mouseState.rightDown = true;
      this.rightClickStartPos = { x: e.clientX, y: e.clientY };
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouseState.leftDown = false;
    } else if (e.button === 1) {
      this.mouseState.middleDown = false;
    } else if (e.button === 2) {
      this.mouseState.rightDown = false;
      const dx = e.clientX - this.rightClickStartPos.x;
      const dy = e.clientY - this.rightClickStartPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 5) {
        this.callbacks.onEscape(); 
      }
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.canvas) return;
    this.mouseState.x = e.clientX;
    this.mouseState.y = e.clientY;

    if (this.gameState.current.isPaused) {
      this.canvas.style.cursor = 'default';
      return;
    }

    if (this.mouseState.rightDown || this.mouseState.middleDown) {
      this.callbacks.onPanCamera(e.movementX, e.movementY);
    }

    const rect = this.canvas.getBoundingClientRect();
    const mouseCanvasX = e.clientX - rect.left;
    const mouseCanvasY = e.clientY - rect.top;

    const engine = this.gameState.current;
    const { zoom, cameraOffsetX, cameraOffsetY } = engine.viewConfig;

    const worldX = (mouseCanvasX - (this.canvas.width / 2 + cameraOffsetX)) / (TILE_WIDTH * zoom) + engine.playerPos.x;
    const worldY = (mouseCanvasY - (this.canvas.height / 2 + cameraOffsetY)) / (TILE_HEIGHT * zoom) + engine.playerPos.y;

    let hoverId: string | null = null;
    const allActionable = [...this.interactableEntityTypes, ...this.gatherableEntityTypes];
    
    for (const ent of engine.entities) {
        if (!allActionable.includes(ent.type)) continue;
        const dx = Math.abs(ent.x - worldX);
        const dy = Math.abs(ent.y - worldY);
        if (dx < 0.6 && dy < 0.6) {
            hoverId = ent.id;
            break;
        }
    }
    
    engine.hoveredEntityId = hoverId;
    this.canvas.style.cursor = hoverId ? 'pointer' : 'default';
  };

  handleWheel = (e: WheelEvent) => {
    // Only zoom if on top of the main canvas area
    if (this.canvas && (e.target === this.canvas || this.canvas.contains(e.target as Node))) {
      e.preventDefault();
      this.callbacks.onZoom(e.deltaY);
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  getKeys(): { [key: string]: boolean } {
    return this.keys;
  }

  getPlayerTargetPos(): { x: number; y: number } | null {
    return this.playerTargetPos;
  }

  setPlayerTargetPos(pos: { x: number; y: number } | null): void {
    this.playerTargetPos = pos;
  }

  clearPlayerTargetPos(): void {
    this.playerTargetPos = null;
  }

  setKey(key: string, isDown: boolean) {
    this.keys[key.toLowerCase()] = isDown;
  }
}
