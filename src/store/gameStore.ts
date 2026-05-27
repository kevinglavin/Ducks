import { create } from 'zustand';
import { TIME_LIMIT, TOTAL_DUCKS, CharacterType } from '../game/config';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

type GameStatus = 'menu' | 'playing' | 'won' | 'lost';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  character: CharacterType;
  updatedAt?: any;
}

interface GameState {
  gameId: number;
  status: GameStatus;
  character: CharacterType;
  score: number;
  bestScore: number;
  leaderboard: LeaderboardEntry[];
  timeRemaining: number;
  safeDucks: number;
  totalDucks: number;
  pause: boolean;
  audioEnabled: boolean;
  volume: number;
  currentTrackIndex: number;

  lastDuckSafeTime: number;
  multiplier: number;
  farmerAPlays: number;
  shadowQuality: 'low' | 'high';
  dogStamina: number;
  logs: {id: string, message: string}[];
  weather: 'clear' | 'rain';
  eggs: { id: string, pos: import('three').Vector3, type: 'golden' }[];

  powerupActive: boolean;
  marshallActive: boolean;
  powerupPos: import('three').Vector3 | null;

  setCharacter: (char: CharacterType) => void;
  setShadowQuality: (quality: 'low' | 'high') => void;
  setDogStamina: (val: number) => void;
  addLog: (message: string) => void;
  setWeather: (weather: 'clear' | 'rain') => void;
  addTime: (seconds: number) => void;
  addEgg: (pos: import('three').Vector3) => void;
  removeEgg: (id: string) => void;
  setPowerup: (active: boolean, pos?: import('three').Vector3 | null) => void;
  setMarshall: (active: boolean) => void;
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
  fetchLeaderboard: () => Promise<void>;
  saveScoreToLeaderboard: (name: string) => Promise<void>;
}

export const AUDIO_TRACKS = [
  { name: 'Upbeat Arcade', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Farm Ambience', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Chill Dusk', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { name: 'Neon Nights (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { name: 'Synthwave Run (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { name: 'Retro Grid (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { name: 'Pixel Sunset (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { name: 'Arcade Dream (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
];

export const useGameStore = create<GameState>((set, get) => ({
  gameId: 0,
  status: 'menu',
  character: 'pyrenees',
  score: 0,
  bestScore: parseInt(localStorage.getItem('duckRoundup_bestScore') || '0', 10),
  leaderboard: JSON.parse(localStorage.getItem('duckRoundup_leaderboard') || '[]'),
  timeRemaining: TIME_LIMIT,
  safeDucks: 0,
  totalDucks: TOTAL_DUCKS,
  pause: false,
  audioEnabled: true,
  volume: 0.05,
  currentTrackIndex: 0,

  lastDuckSafeTime: 0,
  multiplier: 1,
  farmerAPlays: 0,
  shadowQuality: 'high',
  dogStamina: 100,
  logs: [],
  weather: 'clear',
  eggs: [],
  powerupActive: false,
  marshallActive: false,
  powerupPos: null,

  setCharacter: (character) => set({ character }),
  setShadowQuality: (shadowQuality) => set({ shadowQuality }),
  setDogStamina: (dogStamina) => set({ dogStamina }),
  addLog: (message) => set(state => ({ logs: [{ id: Date.now().toString() + Math.random(), message }, ...state.logs].slice(0, 10) })),
  setWeather: (weather) => set({ weather }),
  addTime: (seconds) => set(state => ({ timeRemaining: state.timeRemaining + seconds })),
  addEgg: (pos) => set(state => ({ eggs: [...state.eggs, { id: Math.random().toString(), pos, type: 'golden' }] })),
  removeEgg: (id) => set(state => ({ eggs: state.eggs.filter(e => e.id !== id) })),
  setPowerup: (powerupActive, powerupPos = null) => set({ powerupActive, powerupPos }),
  setMarshall: (marshallActive) => set({ marshallActive }),
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
  setVolume: (volume) => set({ volume }),
  nextTrack: () => set((state) => ({ currentTrackIndex: (state.currentTrackIndex + 1) % AUDIO_TRACKS.length })),
  prevTrack: () => set((state) => ({ currentTrackIndex: (state.currentTrackIndex - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length })),
  startGame: () => set((state) => ({ gameId: state.gameId + 1, status: 'playing', timeRemaining: TIME_LIMIT, safeDucks: 0, score: 0, pause: false, lastDuckSafeTime: 0, multiplier: 1, farmerAPlays: state.character === 'farmer-a' ? state.farmerAPlays + 1 : state.farmerAPlays, dogStamina: 100, logs: [], weather: Math.random() > 0.8 ? 'rain' : 'clear', eggs: [], powerupActive: false, powerupPos: null, marshallActive: false })),

  
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
    const { timeRemaining, lastDuckSafeTime, multiplier } = get();
    // Increase multiplier if ducks are herded within 3 seconds of each other
    const isCombo = lastDuckSafeTime > 0 && (lastDuckSafeTime - timeRemaining) < 3.0;
    const newMultiplier = isCombo ? multiplier + 1 : 1;
    
    set((state) => ({ 
      safeDucks: state.safeDucks + 1, 
      score: state.score + (points * newMultiplier),
      lastDuckSafeTime: timeRemaining,
      multiplier: newMultiplier
    }));
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

  fetchLeaderboard: async () => {
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const leaderboard: LeaderboardEntry[] = [];
      querySnapshot.forEach((doc) => {
        leaderboard.push(doc.data() as LeaderboardEntry);
      });
      set({ leaderboard });
    } catch (err) {
      console.error("Error fetching leaderboard: ", err);
    }
  },

  saveScoreToLeaderboard: async (name: string) => {
    const { score, character } = get();
    const user = auth.currentUser;
    if (!user) {
      console.error("User must be logged in to post a score.");
      return;
    }
    
    try {
      const entryRef = doc(db, 'leaderboard', user.uid);
      await setDoc(entryRef, {
        userId: user.uid,
        name,
        score,
        character,
        updatedAt: serverTimestamp()
      });
      // Refresh leaderboard after saving
      await get().fetchLeaderboard();
    } catch (err) {
       console.error("Error saving leaderboard score: ", err);
    }
  },

  resetGame: () => set({ status: 'menu', timeRemaining: TIME_LIMIT, safeDucks: 0, score: 0, pause: false, lastDuckSafeTime: 0, multiplier: 1, dogStamina: 100, logs: [], powerupActive: false, powerupPos: null, marshallActive: false }),
}));
