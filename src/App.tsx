import React, { useEffect } from 'react';
import Scene from './components/game/Scene';
import GameUI from './components/ui/GameUI';
import { useGameStore } from './store/gameStore';

const TRIVIA = [
  "True fact: Ducks have a secret underground society run by Kevin.",
  "Pro tip: Barking at a duck won't make it lay golden eggs, but it's fun.",
  "Did you know? Great Pyrenees are actually just sheep with good posture.",
  "Expert technique: If a duck looks at you funny, just run in a circle. It asserts dominance.",
  "Historical fact: The first duck was invented in 1942 to test bread aerodynamics.",
  "Ducks actually have 3 feet, but they only use the third one when no one is looking.",
  "A Great Pyrenees doesn't chase; it protects and guides. Also, it loves cheese.",
  "If you stare at a duck long enough, it will owe you money.",
  "Golden Geese aren't actually made of gold; they just have a really good skincare routine."
];

export default function App() {
  const { status, gameId, timeRemaining, playTime, score, logs, leaderboard, fetchLeaderboard } = useGameStore();
  const timeProgress = Math.max(0, 1 - timeRemaining / 120);
  const efficiency = playTime > 0 ? (score / playTime).toFixed(1) : '0.0';

  const [triviaItem, setTriviaItem] = React.useState(TRIVIA[0]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTriviaItem(TRIVIA[Math.floor(Math.random() * TRIVIA.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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
          <Scene key={gameId} />
          <GameUI />
        </div>

        {/* Stats & Features Sidebar (Hidden on mobile) */}
        <div className="hidden lg:flex w-64 flex-col gap-4">
          <div className="bg-[#6B8BB7] p-6 rounded-3xl text-[#0F170A] shadow-xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Welcome to...</p>
             <a href="https://www.sands-farms.com/" target="_blank" rel="noopener noreferrer" className="hover:underline text-3xl font-black tracking-tighter uppercase italic leading-none block">S & S Farms</a>
             <a href="http://www.sands-farms.com/" target="_blank" rel="noopener noreferrer" className="hover:underline text-xs opacity-80 block mt-1">www.sands-farms.com</a>
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
                <span className="text-xs">Herd Efficiency</span>
                <div className="w-24 flex justify-end">
                  <span className="text-xs font-black text-blue-400">{efficiency} pts/s</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Nightfall Risk</span>
                <div className="w-24 h-1.5 bg-[#0F170A] rounded-full overflow-hidden"><div style={{ width: `${timeProgress * 100}%` }} className="h-full bg-red-500 transition-all duration-1000"></div></div>
              </div>
            </div>

            <div className="mt-8 mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trophy"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                Top 10 Leaderboard
              </h3>
              <div className="bg-[#0F170A]/30 p-2 rounded-xl flex flex-col h-40 overflow-y-auto text-[10px] border border-white/5 gap-2">
                {leaderboard.length === 0 ? (
                  <p className="text-white/50 text-center py-2 italic text-[9px]">No scores yet.</p>
                ) : (
                  leaderboard.slice(0, 10).map((entry, idx) => {
                    const dateStr = entry.updatedAt ? new Date(typeof entry.updatedAt === 'number' ? entry.updatedAt : (entry.updatedAt?.seconds ? entry.updatedAt.seconds * 1000 : Date.now())).toLocaleDateString() : 'Just now';
                    return (
                      <div key={idx} className="flex justify-between items-center gap-2">
                        <div className="flex gap-2 items-center overflow-hidden flex-1">
                          <span className="text-yellow-500 font-black w-3 flex-shrink-0">#{idx + 1}</span>
                          <span className="text-white font-bold truncate" title={entry.name}>{entry.name}</span>
                        </div>
                        <div className="flex gap-3 text-right items-center flex-shrink-0">
                          <span className="text-white/50 text-[9px]">{dateStr}</span>
                          <span className="text-white font-black">{entry.score}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="mt-auto flex flex-col gap-3">
              <div className="bg-[#0F170A]/30 p-2 rounded-xl flex flex-col-reverse h-24 overflow-y-auto text-[9px] font-mono border border-white/5 gap-1">
                {logs.map(log => (
                  <div key={log.id} className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-[#7BB661] opacity-70">&gt;</span> <span className="opacity-80">{log.message}</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#0F170A]/30 p-4 rounded-xl border border-white/5">
                <p className="text-sm italic leading-relaxed text-white/90">"{triviaItem}"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
