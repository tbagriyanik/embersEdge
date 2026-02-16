# Ember's Edge: 2.5D Survival RPG

**Ember's Edge** is a performance-optimized 2.5D (isometric) survival game built with React, TypeScript, and the HTML5 Canvas API. Explore a procedurally generated wilderness, gather resources, craft tools, and establish a homestead.

## 🎮 Gameplay Features

### Survival Systems
*   **Vital Management**: Track Health, Hunger, Thirst, and Stamina.
*   **Dynamic Day/Night Cycle**: Environment shifts in real-time, affecting visibility and ambient light.
*   **Weather Engine**: Transitions between Clear, Rain, Fog, and Snow, each with unique environmental effects.

### Crafting & Industry
*   **Gathering**: Chops trees for Wood, mine rocks for Stone, and extract Iron Ore.
*   **Tiered Crafting**: Basic survival tools at first, advancing to Workbenches for iron-age technology.
*   **Agriculture**: Till soil with a Hoe, plant Berry Seeds, and harvest crops over time.

### Wildlife & AI
*   **Passive Creatures**: Rabbits and Deer roam the map and flee from the player.
*   **Hostile Predators**: Guard valuable resource clusters (Iron, Water).

## ⌨️ Controls

| Key | Action |
| :--- | :--- |
| **W, A, S, D** | Move Player |
| **E** | Interact / Gather / Use Structure |
| **C** | Open Crafting Menu |
| **F** | Open Inventory |
| **1 - 9** | Quick Slot Use / Equip |
| **Right Click** | Pan Camera |
| **Scroll** | Zoom In/Out |

## 🛠 Tech Stack

*   **UI**: React 19 (HUD, Menus, Modals)
*   **Engine**: Custom HTML5 Canvas renderer with `useRef` mutable state for 60FPS performance.
*   **Audio**: Web Audio API for procedural wind and terrain-aware footsteps.
*   **Styling**: Tailwind CSS for high-fidelity "Glassmorphism" UI.

## 🚀 Getting Started

1.  **Install dependencies**: `npm install`
2.  **Run development server**: `npm run dev`
3.  **Build for production**: `npm run build`
