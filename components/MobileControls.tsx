
import React, { useState, useRef } from 'react';

interface Props {
  onMove: (dx: number, dy: number) => void;
  onInteractStart: () => void;
  onInteractEnd: () => void;
}

export const MobileControls: React.FC<Props> = ({ onMove, onInteractStart, onInteractEnd }) => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const currentDir = useRef({ dx: 0, dy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Left 40% of screen width
    // Reduced height range: Middle-bottom left area (35% to 80% height)
    const inLeftZone = e.clientX < window.innerWidth * 0.4;
    const inVerticalZone = e.clientY > window.innerHeight * 0.35 && e.clientY < window.innerHeight * 0.8;

    if (!inLeftZone || !inVerticalZone) return;

    // Capture the pointer so move/up events continue even if finger leaves the target element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setJoystickActive(true);
    setBasePos({ x: e.clientX, y: e.clientY });
    setPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!joystickActive) return;

    const dx = e.clientX - basePos.x;
    const dy = e.clientY - basePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 50;
    
    const limitedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);
    const newX = basePos.x + Math.cos(angle) * limitedDist;
    const newY = basePos.y + Math.sin(angle) * limitedDist;
    
    setPos({ x: newX, y: newY });

    // Threshold to prevent jitter
    if (distance > 5) {
      // Normalize to 0-1 range
      const normDx = dx / maxRadius;
      const normDy = dy / maxRadius;
      // Clamp values to [-1, 1]
      currentDir.current = { 
        dx: Math.max(-1, Math.min(1, normDx)), 
        dy: Math.max(-1, Math.min(1, normDy)) 
      };
    } else {
      currentDir.current = { dx: 0, dy: 0 };
    }
    onMove(currentDir.current.dx, currentDir.current.dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!joystickActive) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setJoystickActive(false);
    currentDir.current = { dx: 0, dy: 0 };
    onMove(0, 0);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-40 select-none touch-none"
    >
      {/* The Active Interaction Zone - Reduced height based on feedback */}
      <div 
        className={`absolute left-0 top-[35%] bottom-[20%] w-[45%] pointer-events-auto transition-colors duration-300 rounded-r-3xl
          ${joystickActive ? 'bg-transparent' : 'bg-gradient-to-r from-white/[0.03] to-transparent border-r border-y border-white/5'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {!joystickActive && (
          <div className="absolute top-1/2 left-8 -translate-y-1/2 opacity-20 text-[10px] uppercase font-black tracking-[0.3em] text-white/50 -rotate-90 pointer-events-none whitespace-nowrap">
            Move
          </div>
        )}
      </div>

      {/* Visual Joystick elements */}
      {joystickActive && (
        <div 
          className="fixed pointer-events-none"
          style={{ left: basePos.x - 64, top: basePos.y - 64 }}
        >
          {/* Base Ring */}
          <div className="w-32 h-32 rounded-full bg-stone-900/40 border-2 border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="w-16 h-16 rounded-full border border-white/5 bg-white/5" />
          </div>
          {/* Stick Handle */}
          <div 
            className="absolute w-16 h-16 rounded-full bg-amber-500 border-2 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] backdrop-blur-md"
            style={{ 
              left: pos.x - basePos.x + 32, 
              top: pos.y - basePos.y + 32,
              transform: 'translate(-50%, -50%)' 
            }}
          >
             <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-black/20 to-white/40" />
          </div>
        </div>
      )}
    </div>
  );
};
