import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status, pause } = useGameStore();

  useEffect(() => {
    if (status !== 'playing') return;

    let animationFrameId: number;
    let lastDraw = 0;

    const draw = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(draw);

      if (timestamp - lastDraw < 100) return; // ~10fps
      lastDraw = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const posData = (window as any).__duckGamePositions;
      if (!posData || useGameStore.getState().pause) return;

      const { dogPos, ducks, coopPos, farmBounds } = posData;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = '#2A3A1E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Map world coordinates to canvas coordinates
      const mapScaleX = canvas.width / farmBounds.width;
      const mapScaleZ = canvas.height / farmBounds.height;
      const originX = canvas.width / 2;
      const originZ = canvas.height / 2;

      const worldToCanvas = (x: number, z: number) => {
         return {
            x: originX + x * mapScaleX,
            y: originZ + z * mapScaleZ
         };
      };

      // Draw Coop (Green rectangle)
      const coopCanvasPos = worldToCanvas(coopPos.x, coopPos.z);
      ctx.fillStyle = '#7BB661';
      ctx.fillRect(coopCanvasPos.x - 10, coopCanvasPos.y - 10, 20, 20);

      // Draw Ducks (White/Brown/Black dots)
      ducks.forEach((duck: any) => {
         if (duck.isSafe) return;
         const dp = worldToCanvas(duck.pos.x, duck.pos.z);
         ctx.beginPath();
         ctx.arc(dp.x, dp.y, 2, 0, Math.PI * 2);
         if (duck.type.includes('white') || duck.type.includes('pekin')) ctx.fillStyle = 'white';
         else if (duck.type.includes('brown')) ctx.fillStyle = '#8B4513';
         else if (duck.type.includes('black') || duck.type.includes('cayuga')) ctx.fillStyle = '#1F2937';
         else ctx.fillStyle = 'yellow';
         ctx.fill();
         ctx.closePath();
      });

      // Draw Dog (Orange dot)
      const dogCanvasPos = worldToCanvas(dogPos.x, dogPos.z);
      ctx.beginPath();
      ctx.arc(dogCanvasPos.x, dogCanvasPos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F97316'; // Orange
      ctx.fill();
      ctx.closePath();

    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  if (status !== 'playing') return null;

  return (
    <div className="absolute top-20 right-6 z-40 bg-black/50 p-1 border-2 border-white/20 rounded-xl shadow-lg pointer-events-none opacity-80 transition-opacity">
      <canvas 
        ref={canvasRef} 
        width={100} 
        height={100} 
        className="rounded-lg"
      />
    </div>
  );
}
