# Developer Documentation

Welcome to the **Ember's Edge** codebase. This document explains the internal systems for developers looking to extend the game.

## 📁 Project Structure

*   `App.tsx`: The main entry point. Houses the game loop (`update`) and state initialization.
*   `GameCanvas.tsx`: Handles all low-level drawing logic, asset preloading, and camera math.
*   `InputManager.ts`: Abstraction layer for Keyboard/Mouse/Touch inputs.
*   `types.ts`: Central source of truth for all interfaces and types.
*   `constants.ts`: Balances variables (XP curves, gathering rates, translations).

## 🎮 The Game Loop
The loop resides in `App.tsx` within the `update(dt)` function.
1.  **Input Processing**: Maps keys to player velocity.
2.  **Physics**: Updates positions and checks for tile-based collisions (e.g., Water).
3.  **Entity Logic**: Updates AI timers, farming growth stages, and particle life.
4.  **Chunk Management**: Dynamically generates or loads chunks based on player proximity.

## 🏗 Adding a New Entity
To add a new object to the world:
1.  Add a new string to the `EntityType` union in `types.ts`.
2.  Define the SVG icon in `ASSETS_SVG` within `GameCanvas.tsx`.
3.  Add it to `ENTITY_ASSET_MAP` in `GameCanvas.tsx`.
4.  (Optional) Add gathering logic to `GATHER_ITEM_QUANTITY` in `constants.ts`.

## 📏 Coordinate Systems
*   **World Coordinates**: Float-based (e.g., `x: 10.5, y: 12.2`). Represents tile position.
*   **Canvas Coordinates**: Pixel-based. Calculated as `(WorldX * TILE_WIDTH * Zoom) + CameraOffset`.
*   **Isometric View**: The game uses a standard 2.5D projection. Depth sorting is handled by sorting the `entities` array by `y` coordinate before rendering.

## 💾 State Persistence
The game state is serialized to JSON and stored in `localStorage` under the `embers_edge_save_v6` key. We use a versioned key to prevent crashes when the data schema changes during development.
