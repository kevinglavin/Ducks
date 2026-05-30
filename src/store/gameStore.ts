import { create } from 'zustand';
import { TIME_LIMIT, TOTAL_DUCKS, CharacterType } from '../game/config';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

type GameStatus = 'menu' | 'playing' | 'won' | 'lost' | 'store';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  character: CharacterType;
  updatedAt?: any;
}

export interface Inventory {
  dogSpeedLevel: number;
  barkRadiusLevel: number;
  dayLengthLevel: number;
  unlockedDogs: string[];
  activeDog: string;
  hasMudBoots: boolean;
  hasFlashlight: boolean;
  decoyDucks: number;
}

interface GameState {
  gameId: number;
  status: GameStatus;
  character: CharacterType;
  score: number;
  bestScore: number;
  leaderboard: LeaderboardEntry[];
  timeRemaining: number;
  playTime: number;
  safeDucks: number;
  totalDucks: number;
  pause: boolean;
  audioEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
  currentTrackIndex: number;

  coins: number;
  lastDailyRewardDate: string | null;
  inventory: Inventory;
  addCoins: (amount: number) => void;
  claimDailyReward: () => boolean;
  buyItem: (itemId: string, cost: number, type: 'upgrade' | 'dog' | 'gear') => boolean;
  setActiveDog: (dogId: string) => void;
  openStore: () => void;
  closeStore: () => void;

  lastDuckSafeTime: number;
  multiplier: number;
  farmerAPlays: number;
  shadowQuality: 'low' | 'high';
  dogStamina: number;
  logs: {id: string, message: string}[];

  hasSeenStoreTutorial: boolean;
  hasSeenGoldenEggTooltip: boolean;
  hasSeenMarshallTooltip: boolean;
  hasSeenTurtleTooltip: boolean;
  showTooltip: string | null;
  dogStunnedUntil: number;
  eggs: { id: string, pos: import('three').Vector3, type: 'golden' }[];
  powerupActive: boolean;
  marshallActive: boolean;
  powerupPos: import('three').Vector3 | null;
  decoyActive: boolean;
  decoyPos: import('three').Vector3 | null;

  deployDecoy: (pos: import('three').Vector3) => void;
  addEgg: (pos: import('three').Vector3) => void;
  removeEgg: (id: string) => void;
  setPowerup: (powerupActive: boolean, powerupPos?: import('three').Vector3 | null) => void;
  setMarshall: (marshallActive: boolean) => void;

  setShowTooltip: (tooltip: string | null) => void;
  markTooltipSeen: (tooltipType: 'goldenEgg' | 'marshall' | 'turtle' | 'storeTutorial') => void;
  setDogStunned: (until: number) => void;
  setCharacter: (char: CharacterType) => void;
  setShadowQuality: (quality: 'low' | 'high') => void;
  setDogStamina: (val: number) => void;
  addLog: (message: string) => void;
  addTime: (seconds: number) => void;
  toggleAudio: () => void;
  toggleSfx: () => void;
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
  { name: 'Country Twang', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
  { name: 'Banjo Beat', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
  { name: 'Dusty Boots', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
  { name: 'Southern Drawl', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
  { name: 'Acoustic Sunrise', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
  { name: 'Fiddle Dance', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
  { name: 'Upbeat Arcade', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Farm Ambience', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Chill Dusk', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { name: 'Neon Nights (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { name: 'Synthwave Run (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { name: 'Retro Grid (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { name: 'Pixel Sunset (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { name: 'Arcade Dream (80s)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
];

export const gameEvents = {
  shakeAmount: 0,
  particles: [] as { id: string, pos: import('three').Vector3, time: number }[],
  cheerUntil: 0
};

export const triggerShake = (amount = 1.0) => {
  gameEvents.shakeAmount = Math.max(gameEvents.shakeAmount, amount);
};

export const triggerExplosion = (pos: import('three').Vector3) => {
  gameEvents.particles.push({ id: Math.random().toString(), pos: pos.clone(), time: 0 });
};

export const triggerCheerEvent = () => {
  gameEvents.cheerUntil = Date.now() + 1500; // Cheer for 1.5 seconds
};

export const useGameStore = create<GameState>((set, get) => ({
  gameId: 0,
  status: 'menu',
  character: JSON.parse(localStorage.getItem('duckRoundup_inventory') || '{"activeDog": "pyrenees"}').activeDog || 'pyrenees',
  score: 0,
  bestScore: parseInt(localStorage.getItem('duckRoundup_bestScore') || '0', 10),
  leaderboard: JSON.parse(localStorage.getItem('duckRoundup_leaderboard') || '[]'),
  timeRemaining: TIME_LIMIT,
  playTime: 0,
  safeDucks: 0,
  totalDucks: TOTAL_DUCKS,
  pause: false,
  audioEnabled: true,
  sfxEnabled: true,
  volume: 0.05,
  currentTrackIndex: 0,

  coins: parseInt(localStorage.getItem('duckRoundup_coins') || '1000', 10),
  lastDailyRewardDate: localStorage.getItem('duckRoundup_lastDailyRewardDate') || null,
  inventory: JSON.parse(localStorage.getItem('duckRoundup_inventory') || JSON.stringify({
    dogSpeedLevel: 1,
    barkRadiusLevel: 1,
    dayLengthLevel: 1,
    unlockedDogs: ['pyrenees'],
    activeDog: 'pyrenees',
    hasMudBoots: false,
    hasFlashlight: false,
    decoyDucks: 0
  })),

  claimDailyReward: () => {
    const { lastDailyRewardDate, coins } = get();
    const today = new Date().toISOString().split('T')[0];
    if (lastDailyRewardDate !== today) {
       const newCoins = coins + 500;
       localStorage.setItem('duckRoundup_coins', newCoins.toString());
       localStorage.setItem('duckRoundup_lastDailyRewardDate', today);
       set({ coins: newCoins, lastDailyRewardDate: today });
       return true;
    }
    return false;
  },

  addCoins: (amount: number) => {
    const newCoins = get().coins + amount;
    localStorage.setItem('duckRoundup_coins', newCoins.toString());
    set({ coins: newCoins });
  },

  buyItem: (itemId: string, cost: number, type: 'upgrade' | 'dog' | 'gear') => {
    const { coins, inventory } = get();
    if (coins >= cost) {
      const newInventory = { ...inventory };
      if (type === 'upgrade') {
        if (itemId === 'dogSpeed') {
           if (newInventory.dogSpeedLevel >= 5) return false;
           newInventory.dogSpeedLevel++;
        }
        if (itemId === 'barkRadius') {
           if (newInventory.barkRadiusLevel >= 5) return false;
           newInventory.barkRadiusLevel++;
        }
        if (itemId === 'dayLength') {
           if (newInventory.dayLengthLevel >= 5) return false;
           newInventory.dayLengthLevel++;
        }
      } else if (type === 'dog') {
        if (!newInventory.unlockedDogs.includes(itemId)) {
          newInventory.unlockedDogs.push(itemId);
        } else {
          return false;
        }
      }
      
      const newCoins = coins - cost;
      localStorage.setItem('duckRoundup_coins', newCoins.toString());
      localStorage.setItem('duckRoundup_inventory', JSON.stringify(newInventory));
      
      set({ coins: newCoins, inventory: newInventory });
      return true;
    }
    return false;
  },

  setActiveDog: (dogId: string) => {
    const newInventory = { ...get().inventory, activeDog: dogId };
    localStorage.setItem('duckRoundup_inventory', JSON.stringify(newInventory));
    set({ inventory: newInventory, character: dogId as CharacterType });
  },

  openStore: () => set({ status: 'store' }),
  closeStore: () => set({ status: 'menu' }),

  lastDuckSafeTime: 0,
  multiplier: 1,
  farmerAPlays: 0,
  shadowQuality: 'high',
  dogStamina: 100,
  logs: [],
  eggs: [],
  powerupActive: false,
  marshallActive: false,
  powerupPos: null,
  decoyActive: false,
  decoyPos: null,

  hasSeenStoreTutorial: localStorage.getItem('duckRoundup_seenStoreTutorial') === 'true',
  hasSeenGoldenEggTooltip: localStorage.getItem('duckRoundup_seenGoldenEgg') === 'true',
  hasSeenMarshallTooltip: localStorage.getItem('duckRoundup_seenMarshall') === 'true',
  hasSeenTurtleTooltip: localStorage.getItem('duckRoundup_seenTurtle') === 'true',
  showTooltip: null,
  dogStunnedUntil: 0,
  
  deployDecoy: (pos) => {
    const { inventory } = get();
    if (inventory && inventory.decoyDucks > 0) {
       const newInventory = { ...inventory, decoyDucks: inventory.decoyDucks - 1 };
       localStorage.setItem('duckRoundup_inventory', JSON.stringify(newInventory));
       set({ inventory: newInventory, decoyActive: true, decoyPos: pos.clone() });
       setTimeout(() => {
           set({ decoyActive: false, decoyPos: null });
       }, 15000);
    }
  },
  
  setShowTooltip: (showTooltip) => set({ showTooltip }),
  markTooltipSeen: (tooltipType) => {
    if (tooltipType === 'storeTutorial') {
      localStorage.setItem('duckRoundup_seenStoreTutorial', 'true');
      set({ hasSeenStoreTutorial: true });
    } else if (tooltipType === 'goldenEgg') {
      localStorage.setItem('duckRoundup_seenGoldenEgg', 'true');
      set({ hasSeenGoldenEggTooltip: true });
    } else if (tooltipType === 'marshall') {
      localStorage.setItem('duckRoundup_seenMarshall', 'true');
      set({ hasSeenMarshallTooltip: true });
    } else if (tooltipType === 'turtle') {
      localStorage.setItem('duckRoundup_seenTurtle', 'true');
      set({ hasSeenTurtleTooltip: true });
    }
  },
  addEgg: (pos) => set(state => ({ eggs: [...state.eggs, { id: Math.random().toString(), pos, type: 'golden' }] })),
  removeEgg: (id) => set(state => ({ eggs: state.eggs.filter(e => e.id !== id) })),
  setPowerup: (powerupActive, powerupPos = null) => set({ powerupActive, powerupPos }),
  setMarshall: (marshallActive) => set({ marshallActive }),
  setDogStunned: (until) => set({ dogStunnedUntil: until }),
  setCharacter: (character) => {
    set({ character });
    const currentInventory = JSON.parse(localStorage.getItem('duckRoundup_inventory') || '{"activeDog": "pyrenees"}');
    currentInventory.activeDog = character;
    localStorage.setItem('duckRoundup_inventory', JSON.stringify(currentInventory));
  },
  setShadowQuality: (shadowQuality) => set({ shadowQuality }),
  setDogStamina: (dogStamina) => set({ dogStamina }),
  addLog: (message) => set(state => ({ logs: [{ id: Date.now().toString() + Math.random(), message }, ...state.logs].slice(0, 10) })),
  addTime: (seconds) => set(state => ({ timeRemaining: state.timeRemaining + seconds })),
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
  toggleSfx: () => set((state) => ({ sfxEnabled: !state.sfxEnabled })),
  setVolume: (volume) => set({ volume }),
  nextTrack: () => set((state) => ({ currentTrackIndex: (state.currentTrackIndex + 1) % AUDIO_TRACKS.length })),
  prevTrack: () => set((state) => ({ currentTrackIndex: (state.currentTrackIndex - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length })),
  startGame: () => set((state) => ({ gameId: state.gameId + 1, status: 'playing', timeRemaining: TIME_LIMIT + ((state.inventory?.dayLengthLevel - 1 || 0) * 15), playTime: 0, safeDucks: 0, score: 0, pause: false, lastDuckSafeTime: 0, multiplier: 1, farmerAPlays: state.character === 'farmer-a' ? state.farmerAPlays + 1 : state.farmerAPlays, dogStamina: 100, dogStunnedUntil: 0, logs: [], eggs: [], powerupActive: false, powerupPos: null, marshallActive: false, decoyActive: false, decoyPos: null })),
  
  pauseGame: () => set({ pause: true }),
  resumeGame: () => set({ pause: false }),
  
  tickTime: (dt: number) => {
    const { status, pause, timeRemaining, playTime } = get();
    if (status !== 'playing' || pause) return;

    const newTime = Math.max(0, timeRemaining - dt);
    set({ timeRemaining: newTime, playTime: playTime + dt });
    
    if (newTime <= 0) {
      get().checkWinLoss();
    }
  },

  markDuckSafe: (points: number) => {
    const { timeRemaining, lastDuckSafeTime, multiplier } = get();
    // Increase multiplier if ducks are herded within 3 seconds of each other
    const isCombo = lastDuckSafeTime > 0 && (lastDuckSafeTime - timeRemaining) < 3.0;
    const newMultiplier = isCombo ? multiplier + 1 : 1;
    
    if (newMultiplier >= 3) {
      triggerShake(0.5 + Math.min(newMultiplier * 0.1, 0.5));
    }
    
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
      get().addCoins(finalScore);
      set({ status: 'won', score: finalScore, bestScore: newBest });
    } else if (timeRemaining <= 0) {
      const newBest = Math.max(bestScore, score);
      if (newBest > bestScore) {
        localStorage.setItem('duckRoundup_bestScore', newBest.toString());
      }
      get().addCoins(score);
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
    const { score, character, leaderboard } = get();
    
    // Optimistic UI update and Local Storage fallback
    const localEntry = {
      userId: 'local-' + Date.now(),
      name,
      score,
      character,
      updatedAt: Date.now()
    };
    const newLeaderboard = [...leaderboard, localEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    set({ leaderboard: newLeaderboard });
    localStorage.setItem('duckRoundup_leaderboard', JSON.stringify(newLeaderboard));
    
    try {
      console.log("saveScoreToLeaderboard adding doc...");
      await addDoc(collection(db, 'leaderboard'), {
        name,
        score,
        character,
        updatedAt: Date.now()
      });
      console.log("saveScoreToLeaderboard addDoc complete. Fetching...");
      // Refresh leaderboard after saving
      await get().fetchLeaderboard();
      console.log("saveScoreToLeaderboard fetch complete.");
    } catch (err) {
       console.error("Error saving leaderboard score: ", err);
    }
  },

  resetGame: () => set({ status: 'menu', timeRemaining: TIME_LIMIT, safeDucks: 0, score: 0, pause: false, lastDuckSafeTime: 0, multiplier: 1, dogStamina: 100, logs: [], eggs: [], powerupActive: false, powerupPos: null, marshallActive: false, decoyActive: false, decoyPos: null }),
}));
