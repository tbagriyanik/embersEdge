# Development Plan: Ember's Edge

This document outlines the architectural vision and roadmap for the project.

## 🏗 Architectural Vision: "Mutable State Sync"
To achieve stable 60FPS on the web while handling thousands of entities:
1.  **Physics & Logic**: Handled entirely within a `useRef<GameState>` object. This prevents React's reconciliation engine from running 60 times a second during player movement.
2.  **Rendering**: The `GameCanvas` component uses a standalone `requestAnimationFrame` loop to read directly from the state ref.
3.  **UI/HUD**: The React UI layer only re-renders on specific "events" or at a throttled rate (e.g., 10Hz) to update stat bars and inventory.

## 🗺 Roadmap

### Phase 1: Core Loop (Completed)
- [x] Procedural chunk generation (Perlin-like noise).
- [x] Base gathering (Wood, Stone, Berries).
- [x] Inventory & Crafting UI.

### Phase 2: Industry & Persistence (Current)
- [x] **Agriculture**: Tilling, planting, and growth timers.
- [x] **Iron Age**: Iron ore nodes and upgraded metal tools.
- [x] **Persistence**: Automatic `localStorage` saving and state rehydration.

### Phase 3: World Depth (Next)
- [ ] **Biomes**: Distinct visual styles for Deserts (Sand) and Tundras (Snow).
- [ ] **Combat 2.0**: Ranged weapons (Bows) and hostile mob pathfinding.
- [ ] **Building Expansion**: Multi-tile structures and defensive walls.

### Phase 4: Polish & Sound
- [ ] **Procedural SFX**: Dynamic wind based on weather intensity.
- [ ] **Particle Effects**: Tree felling dust and mining sparks.
