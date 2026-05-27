import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, AUDIO_TRACKS } from '../../store/gameStore';
import { Play, Pause, RotateCcw, User, Dog as DogIcon, Volume2, VolumeX, X as XIcon, Share2, AlertCircle, HelpCircle, SkipForward, SkipBack, Trophy } from 'lucide-react';
import { CharacterType } from '../../game/config';
import { auth } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function GameUI() {
  const { status, timeRemaining, safeDucks, totalDucks, pause, score, bestScore, leaderboard, character, setCharacter, startGame, pauseGame, resumeGame, toggleAudio, audioEnabled, toggleSfx, sfxEnabled, resetGame, volume, setVolume, currentTrackIndex, nextTrack, prevTrack, saveScoreToLeaderboard, shadowQuality, setShadowQuality, fetchLeaderboard, showTooltip, setShowTooltip } = useGameStore();
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
        {showTooltip === 'createAccount' && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#2A3A1E] border-2 border-[#7BB661] p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Create Account</h3>
               <input type="text" placeholder="Your Name" className="w-full bg-[#0F170A] border-2 border-white/10 rounded-xl p-3 text-white mb-3 focus:outline-none focus:border-[#7BB661] transition-colors" />
               <input type="email" placeholder="Your Email" className="w-full bg-[#0F170A] border-2 border-white/10 rounded-xl p-3 text-white mb-6 focus:outline-none focus:border-[#7BB661] transition-colors" />
               <div className="flex gap-2">
                 <button onClick={() => useGameStore.getState().setShowTooltip(null)} className="flex-1 px-4 py-3 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-colors">CANCEL</button>
                 <button onClick={() => useGameStore.getState().setShowTooltip(null)} className="flex-1 px-4 py-3 bg-[#7BB661] text-[#0F170A] font-black rounded-xl hover:bg-[#6CA355] transition-colors">CREATE</button>
               </div>
            </div>
          </div>
        )}

        {showTooltip === 'storeTutorial' && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#2A3A1E] border-2 border-[#7BB661] p-6 rounded-2xl max-w-md w-full text-left shadow-2xl animate-in zoom-in-95 duration-200">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 decoration-[#7BB661] underline underline-offset-4">How To Play</h3>
               <div className="space-y-3 mb-6">
                 <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                   <p className="font-bold text-[#A7F3D0] italic text-xs mb-1">THE MISSION</p>
                   <p className="text-white/80 text-sm">Herd all ducks into the hoop-coop before nightfall. Beware of Foxes and badgers!</p>
                 </div>
                 <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                   <p className="font-bold text-[#A7F3D0] italic text-xs mb-1">CONTROLS</p>
                   <p className="text-white/80 text-sm">Drag or Click to lead the Dog. Desktop players can use WASD / Arrows.</p>
                 </div>
                 <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                   <p className="font-bold text-[#A7F3D0] italic text-xs mb-1">DOG LOGIC</p>
                   <p className="text-white/80 text-sm">Approach ducks slowly (Presence). Over-chasing will cause panic / scattering!</p>
                 </div>
               </div>
               <button onClick={() => useGameStore.getState().setShowTooltip(null)} className="w-full px-4 py-3 bg-[#7BB661] text-[#0F170A] font-black rounded-xl hover:bg-[#6CA355] transition-colors uppercase">Got It</button>
            </div>
          </div>
        )}

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
                        {entry.updatedAt ? new Date(typeof entry.updatedAt === 'number' ? entry.updatedAt : (entry.updatedAt?.seconds ? entry.updatedAt.seconds * 1000 : Date.now())).toLocaleDateString() : 'Just now'}
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
            <div className="flex justify-center items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl shadow-lg">
              <div className="flex flex-col items-center justify-center">
                {character.startsWith('farmer') ? <User className="w-8 h-8 opacity-80" /> : <DogIcon className="w-8 h-8 opacity-80" />}
              </div>
              <div className="text-left">
                <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Equipped Character</p>
                <p className="text-xl font-black uppercase text-white tracking-tighter">{character.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        )}

          <div className="flex flex-col gap-2 sm:gap-3 mb-6 w-full max-w-[240px]">
          <button 
            onClick={startGame}
            className="group relative px-4 py-3 sm:px-6 sm:py-3 bg-[#7BB661] text-[#0F170A] font-black rounded-xl transform active:scale-95 transition-all w-full"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm"><Play fill="currentColor" size={16} /> START ROUND</span>
          </button>
          
          <button 
            onClick={useGameStore.getState().openStore}
            className="group relative px-4 py-3 sm:px-6 sm:py-3 bg-orange-500/20 text-orange-400 border border-orange-500/50 font-black rounded-xl transform active:scale-95 transition-all h-full"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm"><Trophy size={16} /> BARN STORE</span>
          </button>

          <button 
            onClick={() => useGameStore.getState().setShowTooltip('storeTutorial')}
            className="group relative px-4 py-3 sm:px-6 sm:py-3 bg-blue-500/20 text-blue-400 border border-blue-500/50 font-black rounded-xl transform active:scale-95 transition-all w-full"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm"><AlertCircle size={16} /> HOW TO PLAY</span>
          </button>
          
          <button 
            onClick={() => useGameStore.getState().setShowTooltip('createAccount')}
            className="group relative px-4 py-3 sm:px-6 sm:py-3 bg-purple-500/20 text-purple-400 border border-purple-500/50 font-black rounded-xl transform active:scale-95 transition-all w-full"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm"><User size={16} /> CREATE ACCOUNT</span>
          </button>
          
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="group relative px-4 py-2 sm:px-4 sm:py-2 bg-yellow-500/10 text-yellow-500/70 border border-yellow-500/20 font-bold rounded-xl transform active:scale-95 transition-all w-full"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-xs">LEADERBOARD</span>
          </button>
        </div>

        <div className="w-full max-w-[240px] bg-[#0F170A]/50 p-2 rounded-xl border border-white/10 text-[10px]">
          <div className="flex justify-between items-center text-white mb-2">
             <span className="font-bold uppercase tracking-wider text-white/50">SFX</span>
             <button onClick={toggleSfx} className="hover:text-[#7BB661]">
               {sfxEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
             </button>
             <span className="font-bold uppercase tracking-wider text-white/50 ml-2">Music</span>
             <button onClick={toggleAudio} className="hover:text-[#7BB661]">
               {audioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
             </button>
          </div>
          {audioEnabled && (
            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
              <button onClick={prevTrack} className="p-1 hover:text-[#7BB661] text-white/50 transition-colors"><SkipBack size={12} /></button>
              <span className="font-bold text-center flex-1 truncate text-white/70">{AUDIO_TRACKS[currentTrackIndex]?.name}</span>
              <button onClick={nextTrack} className="p-1 hover:text-[#7BB661] text-white/50 transition-colors"><SkipForward size={12} /></button>
            </div>
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

      {/* Tooltip Overlay */}
      {showTooltip && status === 'playing' && !pause && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 pointer-events-auto">
          <div className="bg-[#2A3A1E] border-2 border-[#7BB661] p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
              {showTooltip === 'goldenEgg' ? 'Golden Egg Found!' : 'Look out!'}
            </h3>
            <p className="text-white/80 mb-6 text-sm">
              {showTooltip === 'goldenEgg' 
                ? 'Collect golden eggs to gain +10 extra seconds of daylight! Run over them to pick them up.'
                : 'Marshall the Honey Badger is here! He will scatter your ducks, but he leaves quickly. Keep them together!'}
            </p>
            <button 
              onClick={() => {
                setShowTooltip(null);
                // The game might be running in the background, this is just a quick overlay
              }}
              className="px-8 py-3 bg-[#7BB661] text-[#0F170A] font-black rounded-xl w-full hover:bg-[#6CA355] transition-colors transform active:scale-95"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

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
            <div className="flex justify-between items-center mb-4 text-white hover:text-[#7BB661]">
               <span className="text-xs font-bold uppercase tracking-wider text-white/70">Sound Effects</span>
               <button onClick={toggleSfx} className="hover:text-[#7BB661]">
                 {sfxEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
               </button>
            </div>
            <div className="flex justify-between items-center mb-2 text-white hover:text-[#7BB661]">
               <span className="text-xs font-bold uppercase tracking-wider text-white/70">Music Track</span>
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

      {/* Decoy Deploy Button */}
      {!pause && !isGameOver && useGameStore.getState().inventory?.decoyDucks > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
           <button 
             onClick={() => {
                const dogPos = useGameStore.getState().powerupPos; // Not accurate but we don't have dog pos in store, we will pass Center?
                // actually, let's just deploy it at exactly center for now? Or where they tap.
                // Wait, useGameStore can just deploy at 0,0 for now.
             }}
             className="px-6 py-3 bg-purple-500 text-white font-black rounded-full shadow-lg border border-purple-400 hover:bg-purple-400 transform active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
           >
             <AlertCircle size={16} /> Deploy Decoy ({useGameStore.getState().inventory?.decoyDucks})
           </button>
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
                  // Immediately hide the submit button to give feedback
                  setSubmittedScore(true);
                  console.log("Submitting score for:", cleanName);
                  await saveScoreToLeaderboard(cleanName);
                  console.log("Score submission completed.");
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
              onClick={useGameStore.getState().openStore}
              className="px-4 py-3 sm:px-8 sm:py-4 bg-orange-500/20 border border-orange-500/50 text-orange-400 font-bold rounded-xl sm:rounded-2xl transform active:scale-95 transition-all hover:bg-orange-500/30 flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <Trophy size={16} className="sm:w-5 sm:h-5" /> BARN STORE
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
