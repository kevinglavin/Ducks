import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { CHARACTERS } from '../../game/config';
import { Coins, Zap, Volume2, Sun, Shield, Lock, Unlock, PlayCircle, AlertCircle, X, Trophy } from 'lucide-react';

export default function StoreUI() {
  const { coins, inventory, buyItem, setActiveDog, closeStore, hasSeenStoreTutorial, markTooltipSeen } = useGameStore();

  const handleBuy = (itemId: string, cost: number, type: 'upgrade' | 'dog' | 'gear') => {
    if (buyItem(itemId, cost, type)) {
      // Perhaps play a sound effect for purchase
    }
  };

  const getUpgradeCost = (currentLevel: number) => {
    return currentLevel * 1000;
  };

  const renderUpgrade = (id: string, name: string, level: number, icon: React.ReactNode, maxLevel: number = 5) => {
    const cost = getUpgradeCost(level);
    const isMax = level >= maxLevel;

    return (
      <div className="bg-[#1C2A14]/80 p-4 rounded-xl border border-white/10 flex justify-between items-center text-left">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-full text-[#7BB661]">
            {icon}
          </div>
          <div>
            <h4 className="text-white font-black text-lg">{name}</h4>
            <p className="text-white/50 text-xs">Level {level} {isMax ? '(MAX)' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => handleBuy(id, cost, 'upgrade')}
          disabled={isMax || coins < cost}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all sm:w-auto w-24 text-center disabled:opacity-50 disabled:cursor-not-allowed ${
            isMax ? 'bg-white/10 text-white/50' : 
            coins >= cost ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-500/20 text-red-500'
          }`}
        >
          {isMax ? 'MAXED' : `${cost} c`}
        </button>
      </div>
    );
  };

  const renderCharacter = (id: string, cost: number) => {
    const isUnlocked = inventory.unlockedDogs.includes(id);
    const isActive = inventory.activeDog === id;
    const stats = CHARACTERS[id as keyof typeof CHARACTERS];

    return (
      <div className={`p-4 rounded-xl border-2 flex flex-col gap-3 transition-all ${
        isActive ? 'bg-[#2A3A1E] border-[#7BB661]' : 
        isUnlocked ? 'bg-[#1C2A14]/80 border-white/10 hover:border-white/30' :
        'bg-black/40 border-black grayscale opacity-70'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-white font-black uppercase text-lg">{(stats as any)?.name || id}</h4>
            <p className="text-white/60 text-xs font-mono">Spd:{stats?.speed} Prs:{Math.round(stats?.pressure||0)}</p>
          </div>
          {isActive ? (
            <div className="bg-[#7BB661] text-[#0F170A] text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest">Equipped</div>
          ) : isUnlocked ? (
            <Unlock size={16} className="text-white/40" />
          ) : (
            <Lock size={16} className="text-red-500" />
          )}
        </div>
        
        {isUnlocked ? (
          <button 
            onClick={() => setActiveDog(id)}
            disabled={isActive}
            className={`w-full py-2 rounded-lg font-bold text-sm ${isActive ? 'bg-white/10 text-white/30' : 'bg-[#7BB661] text-black hover:bg-[#6CA355]'}`}
          >
            {isActive ? 'SELECTED' : 'SELECT'}
          </button>
        ) : (
          <button 
            onClick={() => handleBuy(id, cost, 'dog')}
            disabled={coins < cost}
            className={`w-full py-2 rounded-lg font-bold text-sm flex justify-center items-center gap-2 ${coins >= cost ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-500/20 text-red-500'}`}
          >
            UNLOCK <span className="font-mono text-xs">{cost} c</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#0F170A] z-50 overflow-y-auto w-full h-full p-4 sm:p-8 flex flex-col items-center">
      
      {/* First Time Modal */}
      {!hasSeenStoreTutorial && (
        <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#2A3A1E] border-2 border-[#7BB661] p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="w-20 h-20 bg-[#7BB661] rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-lg border-4 border-[#0F170A]">
              <Coins size={40} className="text-[#0F170A]" />
            </div>
            <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
              Welcome to the Barn Store!
            </h3>
            <p className="text-white/80 mb-4 text-base leading-relaxed">
              Every point you earn out in the field gets converted into <strong>Coins</strong>. 
            </p>
            <p className="text-white/80 mb-8 text-base leading-relaxed text-left bg-black/20 p-4 rounded-xl">
              • <strong className="text-yellow-400">Upgrades:</strong> Boost your dog's speed, bark radius, and extend daylight time.<br/>
              • <strong className="text-[#7BB661]">Characters:</strong> Unlock new dogs and farmers to change your playstyle.<br/>
              • <strong className="text-blue-400">Gear:</strong> Buy items like Mud Boots to protect against the rain penalty.
            </p>
            <button 
              onClick={() => markTooltipSeen('storeTutorial')}
              className="px-8 py-4 bg-[#7BB661] text-[#0F170A] font-black uppercase tracking-widest text-lg rounded-xl w-full hover:bg-white transition-colors transform active:scale-95"
            >
              Start Shopping
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl pt-8 pb-32">
        <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-5xl sm:text-6xl font-black italic uppercase tracking-tighter text-[#7BB661]">Barn Store</h2>
            <p className="text-white/60 text-sm mt-2">Spend your hard-earned points on upgrades and gear.</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 px-6 py-3 rounded-2xl flex items-center gap-3">
            <Coins className="text-yellow-500" size={24} />
            <span className="text-yellow-500 font-bold font-mono text-2xl">{coins}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="flex flex-col gap-6">
            <h3 className="text-white font-black text-2xl uppercase tracking-widest border-b border-white/10 pb-2">Upgrades</h3>
            {renderUpgrade('dogSpeed', 'Speed Boost', inventory.dogSpeedLevel, <Zap size={20} />)}
            {renderUpgrade('barkRadius', 'Bark Loudness', inventory.barkRadiusLevel, <Volume2 size={20} />)}
            {renderUpgrade('dayLength', 'Extended Daylight', inventory.dayLengthLevel, <Sun size={20} />)}
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="text-white font-black text-2xl uppercase tracking-widest border-b border-white/10 pb-2">Characters & Gear</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderCharacter('pyrenees', 0)}
              {renderCharacter('corgi', 5000)}
              {renderCharacter('farmer-r', 15000)}
              {renderCharacter('farmer-a', 25000)}
              {renderCharacter('farmer-c', 50000)}
            </div>

            <div className="mt-4 bg-[#1C2A14]/80 p-4 rounded-xl border border-white/10 flex justify-between items-center text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-full text-blue-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg">Mud Boots</h4>
                  <p className="text-white/50 text-xs">Prevents rain speed penalty.</p>
                </div>
              </div>
              <button
                onClick={() => handleBuy('mudBoots', 3000, 'gear')}
                disabled={inventory.hasMudBoots || coins < 3000}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all sm:w-auto w-24 text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  inventory.hasMudBoots ? 'bg-white/10 text-white/50' : 
                  coins >= 3000 ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-500/20 text-red-500'
                }`}
              >
                {inventory.hasMudBoots ? 'OWNED' : '3000 c'}
              </button>
            </div>

            <div className="bg-[#1C2A14]/80 p-4 rounded-xl border border-white/10 flex justify-between items-center text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-full text-yellow-400">
                  <Sun size={20} />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg">Flashlight</h4>
                  <p className="text-white/50 text-xs">Illuminates the darkness.</p>
                </div>
              </div>
              <button
                onClick={() => handleBuy('flashlight', 5000, 'gear')}
                disabled={inventory.hasFlashlight || coins < 5000}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all sm:w-auto w-24 text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  inventory.hasFlashlight ? 'bg-white/10 text-white/50' : 
                  coins >= 5000 ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-red-500/20 text-red-500'
                }`}
              >
                {inventory.hasFlashlight ? 'OWNED' : '5000 c'}
              </button>
            </div>

            <div className="bg-[#1C2A14]/80 p-4 rounded-xl border border-white/10 flex justify-between items-center text-left">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-full text-purple-400">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg">Decoy Duck (3-Pack)</h4>
                  <p className="text-white/50 text-xs">Deployable fake duck to attract others.</p>
                </div>
              </div>
              <button
                onClick={() => handleBuy('decoyDuck', 1000, 'gear')}
                disabled={coins < 1000}
                className={`px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded-lg font-bold text-sm transition-all sm:w-auto w-24 text-center disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                1000 c
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0F170A] via-[#0F170A] to-transparent flex justify-center">
        <button
          onClick={closeStore}
          className="bg-white text-black font-black uppercase text-xl px-12 py-4 rounded-2xl hover:bg-gray-200 transition-colors shadow-2xl transform active:scale-95 flex items-center gap-3"
        >
          <PlayCircle size={24} /> Back to Menu
        </button>
      </div>

    </div>
  );
}
