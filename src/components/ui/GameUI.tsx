import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, AUDIO_TRACKS } from '../../store/gameStore';
import { Play, Pause, RotateCcw, User, Dog as DogIcon, Volume2, VolumeX, X as XIcon, Share2, HelpCircle, SkipForward, SkipBack, Trophy } from 'lucide-react';
import { CharacterType } from '../../game/config';
import { auth } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function GameUI() {
  const { status, timeRemaining, safeDucks, totalDucks, pause, score, bestScore, leaderboard, character, setCharacter, startGame, pauseGame, resumeGame, toggleAudio, audioEnabled, resetGame, volume, setVolume, currentTrackIndex, nextTrack, prevTrack, saveScoreToLeaderboard, shadowQuality, setShadowQuality, fetchLeaderboard } = useGameStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submittedScore, setSubmittedScore] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (status === 'won' || status === 'lost') {
       setSubmittedScore(false);
       setPlayerName("");
    }
  }, [status]);

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
      <div className="absolute inset-0 bg-[#0F170A]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 text-center transition-opacity duration-500 pointer-events-auto z-50 overflow-hidden">
        <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-1 sm:mb-2 text-[#7BB661]">Duck Roundup</h1>
        <p className="text-xs sm:text-sm text-white/70 mb-3 sm:mb-4 max-w-[240px]">Lead the ducks to the coop before the sun sets. Don't let them scatter!</p>
        
        {bestScore > 0 && (
          <div className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-500 font-bold text-xs sm:text-sm flex gap-2 items-center cursor-pointer hover:bg-yellow-500/30 transition shadow-lg" onClick={() => setShowLeaderboard(true)}>
            <Trophy size={14} className="sm:w-4 sm:h-4" /> Best Score: {bestScore}
          </div>
        )}

        {showLeaderboard ? (
          <div className="bg-[#2A3A1E] border border-[#3E522C] rounded-xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-[320px] mb-4 sm:mb-8 shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-2 sm:mb-4 border-b border-white/10 pb-2">
              <h3 className="text-lg sm:text-xl font-black text-white italic tracking-tighter uppercase flex gap-2 items-center"><Trophy size={16} className="sm:w-5 sm:h-5 text-yellow-400" /> Leaderboard</h3>
              <button onClick={() => setShowLeaderboard(false)} className="text-white/50 hover:text-white"><XIcon size={16} className="sm:w-5 sm:h-5" /></button>
            </div>
            
            <div className="space-y-2 sm:space-y-3 max-h-[180px] sm:max-h-[240px] overflow-y-auto pr-1 sm:pr-2">
              {leaderboard.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-4">No scores yet. Herd some ducks!</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[#7BB661] font-black w-4 text-left">#{idx + 1}</span>
                        <span className="text-white text-sm font-bold uppercase tracking-wider">{entry.name}</span>
                      </div>
                      <span className="text-white/50 text-[10px] uppercase font-bold pl-7 tracking-wider">
                        {entry.updatedAt ? new Date(entry.updatedAt?.seconds ? entry.updatedAt.seconds * 1000 : Date.now()).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-white font-black">{entry.score} pts</span>
                      <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">{entry.character.replace('-', ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex gap-2 sm:gap-4 justify-center">
              {(['pyrenees', 'corgi'] as CharacterType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCharacter(c)}
                  className={`p-2 sm:p-3 w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-1 sm:gap-2 border-2 transition-all shadow-lg ${character === c ? 'border-[#7BB661] bg-[#7BB661]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <DogIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest">{c}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:gap-4 justify-center">
              {(['farmer-a', 'farmer-c', 'farmer-r'] as CharacterType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCharacter(c)}
                  className={`p-2 sm:p-3 w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-1 sm:gap-2 border-2 transition-all shadow-lg ${character === c ? 'border-[#7BB661] bg-[#7BB661]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest leading-none text-center">{c.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:gap-3 mb-6 w-full max-w-[240px]">
          <button 
            onClick={startGame}
            className="group relative px-4 py-3 sm:px-8 sm:py-4 bg-[#7BB661] text-[#0F170A] font-black rounded-xl sm:rounded-2xl transform active:scale-95 transition-all w-full"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base"><Play fill="currentColor" size={16} className="sm:w-5 sm:h-5" /> START ROUND</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl sm:rounded-2xl transition-opacity"></div>
          </button>
          
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="group relative px-4 py-3 sm:px-8 sm:py-4 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 font-black rounded-xl sm:rounded-2xl transform active:scale-95 transition-all shadow-lg w-full"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base"><Trophy size={16} className="sm:w-5 sm:h-5" /> TOP 10 LEADERBOARD</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl sm:rounded-2xl transition-opacity"></div>
          </button>
        </div>

        <div className="w-full max-w-[240px] bg-[#0F170A]/50 p-3 sm:p-4 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-2 text-white">
             <span className="text-xs font-bold uppercase tracking-wider text-white/70">Audio Theme</span>
             <button onClick={toggleAudio} className="hover:text-[#7BB661]">
               {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
             </button>
          </div>
          {audioEnabled && (
            <>
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <button onClick={prevTrack} className="p-1 hover:text-[#7BB661] text-white transition-colors"><SkipBack size={16} /></button>
                <span className="text-[10px] sm:text-xs font-bold text-center flex-1 truncate text-white">{AUDIO_TRACKS[currentTrackIndex]?.name}</span>
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
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10 text-white">
               <span className="text-xs font-bold uppercase tracking-wider text-white/70">Shadow Quality</span>
               <button onClick={() => setShadowQuality(shadowQuality === 'high' ? 'low' : 'high')} className="text-xs font-bold uppercase hover:text-[#7BB661]">
                 {shadowQuality}
               </button>
            </div>
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
        <div className="absolute inset-0 bg-[#0F170A]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 text-center transition-opacity duration-500 pointer-events-auto z-50 overflow-hidden">
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-1 sm:mb-2 text-[#7BB661]">
            {status === 'won' ? 'Success!' : 'Nightfall!'}
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mb-2 max-w-[240px]">
            {status === 'won' 
              ? `Your flock is tucked in safe for the night.` 
              : `Nightfall came before the ducks were rounded up.`}
          </p>
          <div className="text-2xl sm:text-3xl font-black text-white mb-2 pb-2">
            SCORE: {score}
          </div>
          
          {!submittedScore && score > 0 && (
            <div className="flex flex-col gap-2 mb-4 sm:mb-8 w-full max-w-[240px] items-center">
              <input 
                maxLength={8}
                placeholder="Enter Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.replace(/[^A-Za-z0-9 ]/g, ''))}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-center font-bold tracking-widest uppercase focus:outline-none focus:border-[#7BB661] transition text-sm"
              />
              <button 
                onClick={async () => {
                  const cleanName = playerName.trim() || 'ANON';
                  if (!auth.currentUser) {
                     try {
                        const { signInAnonymously } = await import('firebase/auth');
                        await signInAnonymously(auth);
                     } catch(e) {
                        console.error('Anonymous Login failed', e);
                        return;
                     }
                  }
                  await saveScoreToLeaderboard(cleanName);
                  setSubmittedScore(true);
                }}
                className="w-full bg-yellow-500 text-[#0F170A] font-black px-3 py-2 sm:px-4 sm:py-3 rounded-xl transform active:scale-95 transition-all hover:bg-yellow-400 shadow-lg flex justify-center items-center gap-2 text-sm"
              >
                SUBMIT SCORE
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:gap-4 w-full max-w-[240px]">
            <button 
              onClick={startGame}
              className="group relative px-4 py-3 sm:px-8 sm:py-4 bg-[#7BB661] text-[#0F170A] font-black rounded-xl sm:rounded-2xl transform active:scale-95 transition-all"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base"><RotateCcw strokeWidth={3} size={16} className="sm:w-5 sm:h-5" /> TRY AGAIN</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl sm:rounded-2xl transition-opacity"></div>
            </button>
            <button 
              onClick={shareGame}
              className="px-4 py-3 sm:px-8 sm:py-4 bg-blue-500 text-white font-bold rounded-xl sm:rounded-2xl transform active:scale-95 transition-all hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <Share2 size={16} className="sm:w-5 sm:h-5" /> SHARE SCORE
            </button>
            <button 
              onClick={() => { setShowLeaderboard(true); resetGame(); }}
              className="px-4 py-3 sm:px-8 sm:py-4 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 font-bold rounded-xl sm:rounded-2xl transform active:scale-95 transition-all hover:bg-yellow-500/30 flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <Trophy size={16} className="sm:w-5 sm:h-5" /> LEADERBOARD
            </button>
            <button 
              onClick={resetGame}
              className="px-4 py-3 sm:px-8 sm:py-4 bg-white/10 text-white font-bold rounded-xl sm:rounded-2xl transform active:scale-95 transition-all hover:bg-white/20 flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <HelpCircle size={16} className="sm:w-5 sm:h-5" /> MAIN MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
