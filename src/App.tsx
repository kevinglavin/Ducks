import React from 'react';
import Scene from './components/game/Scene';
import GameUI from './components/ui/GameUI';
import { useGameStore } from './store/gameStore';

export default function App() {
  const { timeRemaining } = useGameStore();
  const timeProgress = Math.max(0, 1 - timeRemaining / 120);

  return (
    <div className="w-full h-[100dvh] bg-[#1B2712] text-white flex items-center justify-center font-sans overflow-hidden select-none touch-none">
      <div className="flex w-full max-w-5xl h-[700px] gap-8 items-stretch justify-center">
        {/* Instructions Sidebar (Hidden on mobile) */}
        <div className="hidden lg:flex w-64 bg-[#2A3A1E] rounded-3xl p-6 flex-col border border-[#3E522C] shadow-2xl">
          <h2 className="text-2xl font-black text-[#F9FAFB] mb-4 uppercase tracking-tighter italic underline decoration-[#7BB661] underline-offset-4">How To Play</h2>
          <div className="space-y-4 text-sm text-[#D1D5DB]">
            <div className="bg-[#3E522C] p-3 rounded-xl">
              <p className="font-bold text-[#A7F3D0] mb-1 italic">THE MISSION</p>
              <p>Herd all 12 ducks into the hoop-coop before nightfall.</p>
            </div>
            <div className="bg-[#3E522C] p-3 rounded-xl">
              <p className="font-bold text-[#A7F3D0] mb-1 italic">CONTROLS</p>
              <p>Drag / Click to lead the Dog. Use WASD / Arrows on Desktop.</p>
            </div>
            <div className="bg-[#3E522C] p-3 rounded-xl">
              <p className="font-bold text-[#A7F3D0] mb-1 italic">DOG LOGIC</p>
              <p>Approach ducks slowly. If you rush them, they will scatter!</p>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex gap-2 mb-2 items-center">
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <span className="text-xs opacity-60 uppercase tracking-widest">Pekin Duck x6</span>
            </div>
            <div className="flex gap-2 mb-2 items-center">
              <div className="w-3 h-3 rounded-full bg-[#634832]"></div>
              <span className="text-xs opacity-60 uppercase tracking-widest">Khaki Duck x3</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-[#1F2937]"></div>
              <span className="text-xs opacity-60 uppercase tracking-widest">Cayuga Duck x3</span>
            </div>
          </div>
        </div>

        {/* Main Mobile Game Viewport */}
        <div className="relative w-full h-full lg:w-[380px] lg:h-[680px] lg:bg-[#7BB661] lg:rounded-[3rem] lg:border-[8px] border-[#0F170A] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden lg:self-center">
          <Scene />
          <GameUI />
        </div>

        {/* Stats & Features Sidebar (Hidden on mobile) */}
        <div className="hidden lg:flex w-64 flex-col gap-4">
          <div className="bg-[#F27D26] p-6 rounded-3xl text-[#0F170A] shadow-xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Current Mood</p>
             <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Peaceful Farm</h3>
          </div>
          
          <div className="bg-[#3E522C] flex-1 rounded-3xl border border-[#3E522C] p-6 flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#7BB661] mb-4">Herd Behavior</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs">Flock Cohesion</span>
                <div className="w-24 h-1.5 bg-[#0F170A] rounded-full overflow-hidden"><div className="w-[85%] h-full bg-[#7BB661]"></div></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Pressure Sens.</span>
                <div className="w-24 h-1.5 bg-[#0F170A] rounded-full overflow-hidden"><div className="w-[40%] h-full bg-orange-400"></div></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Nightfall Risk</span>
                <div className="w-24 h-1.5 bg-[#0F170A] rounded-full overflow-hidden"><div style={{ width: `${timeProgress * 100}%` }} className="h-full bg-red-500 transition-all duration-1000"></div></div>
              </div>
            </div>
            
            <div className="mt-auto bg-[#0F170A]/30 p-3 rounded-xl border border-white/5">
              <p className="text-[10px] italic leading-tight">"A Great Pyrenees doesn't chase; it protects and guides. Use presence, not speed."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
