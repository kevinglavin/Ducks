import { create } from 'zustand';
import { TIME_LIMIT, TOTAL_DUCKS, CharacterType } from '../game/config';

type GameStatus = 'menu' | 'playing' | 'won' | 'lost';

interface GameState {
  gameId: number;
  status: GameStatus;
  character: CharacterType;
  score: number;
  bestScore: number;
  timeRemaining: number;
  safeDucks: number;
  totalDucks: number;
  pause: boolean;
  audioEnabled: boolean;
  volume: number;
  currentTrackIndex: number;

  setCharacter: (char: CharacterType) => void;
  toggleAudio: () => void;
  setVolume: (vol: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tickTime: (dt: number) => void;
  markDuckSafe: (points: number) => void;
  checkWinLoss: () => void;
  resetGame: () => void;
}

export const AUDIO_TRACKS = [
  { name: 'Upbeat Arcade', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Farm Ambience', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Chill Dusk', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export const useGameStore = create<GameState>((set, get) => ({
  gameId: 0,
  status: 'menu',
  character: 'pyrenees',
  score: 0,
  bestScore: parseInt(localStorage.getItem('duckRoundup_bestScore') || '0', 10),
  timeRemaining: TIME_LIMIT,
  safeDucks: 0,
  totalDucks: TOTAL_DUCKS,
  pause: false,
  audioEnabled: true,
  volume: 0.2,
  currentTrackIndex: 0,

  setCharacter: (character) => set({ character }),
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
  setVolume: (volume) => set({ volume }),
  nextTrack: () => set((state) => ({ currentTrackIndex: (state.currentTrackIndex + 1) % AUDIO_TRACKS.length })),
  prevTrack: () => set((state) => ({ currentTrackIndex: (state.currentTrackIndex - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length })),
  startGame: () => set((state) => ({ gameId: state.gameId + 1, status: 'playing', timeRemaining: TIME_LIMIT, safeDucks: 0, score: 0, pause: false })),

  
  pauseGame: () => set({ pause: true }),
  resumeGame: () => set({ pause: false }),
  
  tickTime: (dt: number) => {
    const { status, pause, timeRemaining } = get();
    if (status !== 'playing' || pause) return;

    const newTime = Math.max(0, timeRemaining - dt);
    set({ timeRemaining: newTime });
    
    if (newTime <= 0) {
      get().checkWinLoss();
    }
  },

  markDuckSafe: (points: number) => {
    set((state) => ({ safeDucks: state.safeDucks + 1, score: state.score + points }));
    get().checkWinLoss();
  },

  checkWinLoss: () => {
    const { timeRemaining, safeDucks, totalDucks, status, score, bestScore } = get();
    if (status !== 'playing') return;

    if (safeDucks >= totalDucks) {
      // Bonus points for time remaining
      const finalScore = score + Math.floor(timeRemaining) * 5;
      const newBest = Math.max(bestScore, finalScore);
      if (newBest > bestScore) {
        localStorage.setItem('duckRoundup_bestScore', newBest.toString());
      }
      set({ status: 'won', score: finalScore, bestScore: newBest });
    } else if (timeRemaining <= 0) {
      const newBest = Math.max(bestScore, score);
      if (newBest > bestScore) {
        localStorage.setItem('duckRoundup_bestScore', newBest.toString());
      }
      set({ status: 'lost', bestScore: newBest });
    }
  },

  resetGame: () => set({ status: 'menu', timeRemaining: TIME_LIMIT, safeDucks: 0, score: 0, pause: false }),
}));
