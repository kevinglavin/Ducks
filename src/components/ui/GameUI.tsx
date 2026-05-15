import React, { useEffect, useRef } from 'react';
import { useGameStore, AUDIO_TRACKS } from '../../store/gameStore';
import { Play, Pause, RotateCcw, User, Dog as DogIcon, Volume2, VolumeX, X as XIcon, Share2, HelpCircle, SkipForward, SkipBack } from 'lucide-react';
import { CharacterType } from '../../game/config';

export default function GameUI() {
  const { status, timeRemaining, safeDucks, totalDucks, pause, score, bestScore, character, setCharacter, startGame, pauseGame, resumeGame, toggleAudio, audioEnabled, resetGame, volume, setVolume, currentTrackIndex, nextTrack, prevTrack } = useGameStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (audioEnabled && status === 'playing') {
        audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioEnabled, status, volume, currentTrackIndex]);

  const formatTime = (timeInSeconds: number) => {
    const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const shareGame = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Duck Roundup',
        text: `I scored ${score} points in Duck Roundup! Can you herd the flock?`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert(`I scored ${score} points! Share this link to challenge friends!`);
    }
  };

  if (status === 'menu') {
    return (
      <div className="absolute inset-0 bg-[#0F170A]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center transition-opacity duration-500 pointer-events-auto z-50 overflow-y-auto">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-[#7BB661]">Duck Roundup</h1>
        <p className="text-sm text-white/70 mb-4 max-w-[200px]">Lead the ducks to the coop before the sun sets. Don't let them scatter!</p>
        
        {bestScore > 0 && (
          <div className="mb-6 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-500 font-bold text-sm">
            Best Score: {bestScore}
          </div>
        )}

        <div className="flex gap-4 mb-8 flex-wrap justify-center">
          {(['farmer', 'pyrenees', 'corgi'] as CharacterType[]).map((c) => (
            <button
              key={c}
              onClick={() => setCharacter(c)}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${character === c ? 'border-[#7BB661] bg-[#7BB661]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
            >
              {c === 'farmer' ? <User size={32} /> : <DogIcon size={32} />}
              <span className="text-xs uppercase font-bold tracking-widest">{c}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={startGame}
          className="group relative px-8 py-4 bg-[#7BB661] text-[#0F170A] font-black rounded-2xl transform active:scale-95 transition-all mb-8"
        >
          <span className="relative z-10 flex items-center gap-2"><Play fill="currentColor" size={20} /> START ROUND</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity"></div>
        </button>

        <div className="w-full max-w-[240px] bg-[#0F170A]/50 p-4 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-2 text-white">
             <span className="text-xs font-bold uppercase tracking-wider text-white/70">Audio Theme</span>
             <button onClick={toggleAudio} className="hover:text-[#7BB661]">
               {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
             </button>
          </div>
          {audioEnabled && (
            <>
              <div className="flex items-center justify-between gap-2 mb-4">
                <button onClick={prevTrack} className="p-1 hover:text-[#7BB661] text-white transition-colors"><SkipBack size={16} /></button>
                <span className="text-xs font-bold text-center flex-1 truncate text-white">{AUDIO_TRACKS[currentTrackIndex]?.name}</span>
                <button onClick={nextTrack} className="p-1 hover:text-[#7BB661] text-white transition-colors"><SkipForward size={16} /></button>
              </div>
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Volume</span>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#7BB661]"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const isGameOver = status === 'won' || status === 'lost';

  return (
    <div className="absolute inset-0 pointer-events-none z-40 p-6 flex flex-col justify-between">
      {/* Background audio track */}
      <audio 
        ref={audioRef} 
        loop 
        src={AUDIO_TRACKS[currentTrackIndex]?.url || ''}
      />

      {/* Top HUD Overlay */}
      <div className="flex justify-between items-start gap-2">
        <div className="bg-[#0F170A]/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full pointer-events-auto flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-[#7BB661] tracking-wider block leading-none mb-1">Ducks Safe</span>
          <span className="text-xl font-black text-white leading-none">{safeDucks}/{totalDucks}</span>
        </div>

        <div className="bg-[#0F170A]/80 backdrop-blur-md border border-white/10 px-4 py-1 rounded-full text-center pointer-events-auto flex flex-col justify-center flex-1">
          <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block leading-none mb-1">Until Nightfall</span>
          <span className="text-xl font-black tabular-nums text-white leading-none">{formatTime(timeRemaining)}</span>
          <span className="text-[10px] font-bold text-white/70 mt-1">{score} pts</span>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={pause ? resumeGame : pauseGame}
            disabled={isGameOver}
            className="w-10 h-10 bg-[#0F170A]/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center pointer-events-auto hover:bg-[#7BB661] transition-colors disabled:opacity-50 text-white hover:text-[#0F170A]"
          >
            {pause ? <Play fill="currentColor" size={16} /> : <Pause fill="currentColor" size={16} />}
          </button>
        </div>
      </div>

      {pause && !isGameOver && (
        <div className="absolute inset-0 bg-[#0F170A]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center pointer-events-auto z-40">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-8 text-[#7BB661]">Paused</h2>

          <div className="mb-8 w-full max-w-[240px] bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-2 text-white">
               <span className="text-xs font-bold uppercase tracking-wider text-white/70">Audio Track</span>
               <button onClick={toggleAudio} className="hover:text-[#7BB661]">
                 {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
               </button>
            </div>
            {audioEnabled && (
              <>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <button onClick={prevTrack} className="p-1 hover:text-[#7BB661] text-white transition-colors"><SkipBack size={16} /></button>
                  <span className="text-xs font-bold text-center flex-1 truncate text-white">{AUDIO_TRACKS[currentTrackIndex]?.name}</span>
                  <button onClick={nextTrack} className="p-1 hover:text-[#7BB661] text-white transition-colors"><SkipForward size={16} /></button>
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Volume</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume} 
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#7BB661]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full max-w-[240px]">
            <button 
              onClick={resumeGame}
              className="group relative px-8 py-4 bg-[#7BB661] text-[#0F170A] font-black rounded-2xl transform active:scale-95 transition-all w-full"
            >
              <span className="relative z-10 flex items-center justify-center gap-2"><Play fill="currentColor" size={20} /> RESUME</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity"></div>
            </button>
            <button 
              onClick={resetGame}
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl transform active:scale-95 transition-all hover:bg-white/20 flex items-center justify-center gap-2"
            >
              <XIcon size={20} /> EXIT ROUND
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-[#0F170A]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center transition-opacity duration-500 pointer-events-auto z-50">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-[#7BB661]">
            {status === 'won' ? 'Success!' : 'Nightfall!'}
          </h1>
          <p className="text-sm text-white/70 mb-2 max-w-[240px]">
            {status === 'won' 
              ? `Your flock is tucked in safe for the night.` 
              : `Nightfall came before the ducks were rounded up.`}
          </p>
          <div className="text-3xl font-black text-white mb-8 border-b-2 border-[#7BB661] pb-2">
            SCORE: {score}
          </div>
          <div className="flex flex-col gap-4 w-full max-w-[240px]">
            <button 
              onClick={startGame}
              className="group relative px-8 py-4 bg-[#7BB661] text-[#0F170A] font-black rounded-2xl transform active:scale-95 transition-all"
            >
              <span className="relative z-10 flex items-center justify-center gap-2"><RotateCcw strokeWidth={3} size={20} /> TRY AGAIN</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity"></div>
            </button>
            <button 
              onClick={shareGame}
              className="px-8 py-4 bg-blue-500 text-white font-bold rounded-2xl transform active:scale-95 transition-all hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Share2 size={20} /> SHARE SCORE
            </button>
            <button 
              onClick={resetGame}
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl transform active:scale-95 transition-all hover:bg-white/20 flex items-center justify-center gap-2"
            >
              <HelpCircle size={20} /> MAIN MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
