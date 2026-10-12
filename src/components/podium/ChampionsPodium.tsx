import React from 'react';
import { Participant } from '../../types';
import { SkillBadge } from '../ui/Badge';
import { Trophy, Award, Crown, Star, Sparkles, Flame, Shield, ArrowUpRight } from 'lucide-react';

interface ChampionsPodiumProps {
  participants: Participant[];
  className?: string;
  onSelectPlayer?: (player: Participant) => void;
}

/**
 * Claymorphic Champions Podium
 *
 * Implements a 3D tactile claymorphism aesthetic:
 * - Rounded, soft pillowy clay cylinders for 1st, 2nd, and 3rd place
 * - Prominent, tactile clay rank badges (#1 in gold, #2 in silver, #3 in bronze)
 * - Raised circular avatar frame with soft inner & outer depth highlights
 * - Gold crown with sparkling animation over the 1st place champion
 * - Detailed player statistics (Win rate %, W-L record, point differential)
 * - Interactive hover states that invite tapping/clicking to inspect player profile
 */
export const ChampionsPodium: React.FC<ChampionsPodiumProps> = ({
  participants,
  className = '',
  onSelectPlayer,
}) => {
  // Sort participants by win rate descending, then total wins, then point differential
  const activePlayers = (participants || []).filter((p) => p && (p.gamesPlayed || 0) > 0);
  const sorted = [...activePlayers].sort((a, b) => {
    if ((b.winRate || 0) !== (a.winRate || 0)) return (b.winRate || 0) - (a.winRate || 0);
    if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
    return (b.pointDifferential || 0) - (a.pointDifferential || 0);
  });

  if (sorted.length < 1) {
    return (
      <div className={`clay-card rounded-3xl p-8 sm:p-10 text-center text-slate-500 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-3 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center clay-subcard">
          <Trophy className="w-8 h-8 opacity-80" />
        </div>
        <p className="text-base font-black text-slate-800">Champions Podium Awaiting Matches</p>
        <p className="text-xs text-slate-500 font-medium mt-1 max-w-sm mx-auto">
          Complete matches on the courts to see top performers ascend the clay 3D winner&apos;s podium!
        </p>
      </div>
    );
  }

  const firstPlace = sorted[0] || null;
  const secondPlace = sorted[1] || null;
  const thirdPlace = sorted[2] || null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 text-white p-5 sm:p-8 shadow-2xl border border-slate-700/70 ${className}`}
    >
      {/* Background Soft Ambient Light Spheres */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-12 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-12 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Podium Header */}
      <div className="text-center relative z-10 mb-6 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black tracking-widest uppercase mb-2 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Top Performers Podium</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
          Championship Standings
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto mt-1">
          Emphasizing the top 3 contenders leading the session with the highest win rates
        </p>
      </div>

      {/* 3D Claymorphism Stepped Podium Grid */}
      <div className="relative z-10 max-w-3xl mx-auto grid grid-cols-3 gap-2.5 sm:gap-6 items-end pt-6 sm:pt-10">
        {/* ========================================================= */}
        {/* 2ND PLACE (SILVER) - LEFT COLUMN                          */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center">
          {secondPlace ? (
            <div
              onClick={() => onSelectPlayer && onSelectPlayer(secondPlace)}
              className="w-full flex flex-col items-center cursor-pointer transition-all duration-200 hover:-translate-y-1.5 group"
            >
              {/* Circular Avatar with Claymorphic Layering */}
              <div className="relative mb-3 flex flex-col items-center">
                {/* Silver Ribbon / Badge */}
                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 clay-circle-avatar flex items-center justify-center transition-transform group-hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border-2 border-white/80 flex items-center justify-center shadow-inner">
                    {secondPlace.avatarUrl ? (
                      <img
                        src={secondPlace.avatarUrl}
                        alt={secondPlace.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-black text-slate-200 text-sm sm:text-lg">
                        {secondPlace.name?.slice(0, 2).toUpperCase() || 'P2'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tactile Clay Medal / Rank Capsule */}
                <div className="absolute -bottom-2 -right-1 sm:-bottom-2.5 sm:-right-1.5 w-8 h-8 sm:w-9 sm:h-9 rounded-2xl clay-podium-silver flex items-center justify-center text-slate-900 font-black text-xs sm:text-sm shadow-xl z-20">
                  <span className="font-mono font-black drop-shadow-xs">2</span>
                </div>
              </div>

              {/* Player Metadata */}
              <div className="text-center w-full px-1 mb-2.5">
                <div className="font-black text-xs sm:text-sm text-slate-100 truncate group-hover:text-white transition-colors">
                  {secondPlace.name}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-300 font-mono font-black mt-0.5">
                  <span className="text-emerald-400">{secondPlace.winRate}%</span> Win Rate
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                  {secondPlace.wins}W - {secondPlace.losses}L
                </div>
                {typeof secondPlace.pointDifferential === 'number' && (
                  <div className="text-[9px] text-slate-400 font-mono font-semibold">
                    {secondPlace.pointDifferential >= 0 ? `+${secondPlace.pointDifferential}` : secondPlace.pointDifferential} Diff
                  </div>
                )}
              </div>

              {/* Claymorphic 3D Stepped Pillar (Height 2) */}
              <div className="w-full h-28 sm:h-38 rounded-t-3xl clay-podium-silver flex flex-col items-center justify-start pt-3 sm:pt-4 relative overflow-hidden transition-all">
                {/* Soft Clay Inset Number */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/40 flex items-center justify-center shadow-inner">
                  <span className="font-mono font-black text-2xl sm:text-3xl text-slate-800 drop-shadow-xs">
                    2
                  </span>
                </div>
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-slate-800 mt-1 sm:mt-1.5">
                  Silver
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-700 font-mono mt-0.5">
                  {secondPlace.gamesPlayed} Matches
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-3">
                <span className="text-xs text-slate-500 font-bold">Open</span>
              </div>
              <div className="w-full h-28 sm:h-38 rounded-t-3xl bg-slate-800/40 border-t-2 border-slate-700 flex items-center justify-center text-xs text-slate-600 font-black">
                2nd Place
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 1ST PLACE (GOLD CHAMPION) - CENTER (TALLEST & EMPHASIZED) */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center -mt-8 sm:-mt-12 z-20">
          {firstPlace ? (
            <div
              onClick={() => onSelectPlayer && onSelectPlayer(firstPlace)}
              className="w-full flex flex-col items-center cursor-pointer transition-all duration-200 hover:-translate-y-2 group"
            >
              {/* Crown Floating above Champion */}
              <div className="mb-1 text-amber-300 flex items-center gap-1 animate-bounce">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 drop-shadow-md" />
                <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 fill-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.7)]" />
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 drop-shadow-md" />
              </div>

              {/* Raised Circular Gold Avatar Frame */}
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1.5 bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 clay-circle-avatar flex items-center justify-center ring-4 ring-amber-400/50 shadow-2xl transition-transform group-hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 sm:border-3 border-amber-200 flex items-center justify-center shadow-inner">
                    {firstPlace.avatarUrl ? (
                      <img
                        src={firstPlace.avatarUrl}
                        alt={firstPlace.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-black text-amber-300 text-base sm:text-2xl">
                        {firstPlace.name?.slice(0, 2).toUpperCase() || 'P1'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tactile Clay Gold Medal */}
                <div className="absolute -bottom-2 -right-1 sm:-bottom-3 sm:-right-2 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl clay-podium-gold flex items-center justify-center text-amber-950 font-black text-sm sm:text-base shadow-2xl z-20 ring-2 ring-yellow-200 animate-pulse">
                  <span className="font-mono font-black drop-shadow-xs">1</span>
                </div>
              </div>

              {/* Player Metadata */}
              <div className="text-center w-full px-1 mb-2.5">
                <div className="font-black text-sm sm:text-base text-yellow-300 truncate group-hover:text-yellow-200 drop-shadow-sm transition-colors">
                  {firstPlace.name}
                </div>
                <div className="text-[11px] sm:text-xs text-white font-mono font-black mt-0.5">
                  <span className="text-emerald-300">{firstPlace.winRate}%</span> Win Rate
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-200 font-bold">
                  {firstPlace.wins}W - {firstPlace.losses}L
                </div>
                {typeof firstPlace.pointDifferential === 'number' && (
                  <div className="text-[9px] sm:text-[10px] text-emerald-300 font-mono font-black mt-0.5">
                    {firstPlace.pointDifferential >= 0 ? `+${firstPlace.pointDifferential}` : firstPlace.pointDifferential} Point Diff
                  </div>
                )}
              </div>

              {/* Claymorphic 3D Stepped Pillar (Tallest - Gold) */}
              <div className="w-full h-36 sm:h-48 rounded-t-3xl clay-podium-gold flex flex-col items-center justify-start pt-3 sm:pt-4 relative overflow-hidden transition-all ring-2 ring-yellow-300/40">
                {/* Soft Clay Inset Number */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100/40 flex items-center justify-center shadow-inner">
                  <span className="font-mono font-black text-3xl sm:text-4xl text-amber-950 drop-shadow-sm">
                    1
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-950 mt-1 sm:mt-1.5">
                  Champion
                </span>
                <span className="text-[9px] sm:text-[11px] font-black text-amber-900 font-mono mt-0.5">
                  {firstPlace.gamesPlayed} Matches Played
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-3">
                <span className="text-xs text-slate-500 font-bold">Open</span>
              </div>
              <div className="w-full h-36 sm:h-48 rounded-t-3xl bg-slate-800/40 border-t-2 border-slate-700 flex items-center justify-center text-xs text-slate-600 font-black">
                1st Place
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3RD PLACE (BRONZE) - RIGHT COLUMN                         */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center">
          {thirdPlace ? (
            <div
              onClick={() => onSelectPlayer && onSelectPlayer(thirdPlace)}
              className="w-full flex flex-col items-center cursor-pointer transition-all duration-200 hover:-translate-y-1.5 group"
            >
              {/* Circular Avatar with Bronze Claymorphism */}
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-br from-orange-300 via-amber-700 to-orange-950 clay-circle-avatar flex items-center justify-center transition-transform group-hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border-2 border-orange-200/60 flex items-center justify-center shadow-inner">
                    {thirdPlace.avatarUrl ? (
                      <img
                        src={thirdPlace.avatarUrl}
                        alt={thirdPlace.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-black text-orange-200 text-sm sm:text-lg">
                        {thirdPlace.name?.slice(0, 2).toUpperCase() || 'P3'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tactile Clay Bronze Medal */}
                <div className="absolute -bottom-2 -right-1 sm:-bottom-2.5 sm:-right-1.5 w-8 h-8 sm:w-9 sm:h-9 rounded-2xl clay-podium-bronze flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-xl z-20">
                  <span className="font-mono font-black drop-shadow-xs">3</span>
                </div>
              </div>

              {/* Player Metadata */}
              <div className="text-center w-full px-1 mb-2.5">
                <div className="font-black text-xs sm:text-sm text-slate-100 truncate group-hover:text-white transition-colors">
                  {thirdPlace.name}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-300 font-mono font-black mt-0.5">
                  <span className="text-emerald-400">{thirdPlace.winRate}%</span> Win Rate
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                  {thirdPlace.wins}W - {thirdPlace.losses}L
                </div>
                {typeof thirdPlace.pointDifferential === 'number' && (
                  <div className="text-[9px] text-slate-400 font-mono font-semibold">
                    {thirdPlace.pointDifferential >= 0 ? `+${thirdPlace.pointDifferential}` : thirdPlace.pointDifferential} Diff
                  </div>
                )}
              </div>

              {/* Claymorphic 3D Stepped Pillar (Height 3 - Bronze) */}
              <div className="w-full h-24 sm:h-32 rounded-t-3xl clay-podium-bronze flex flex-col items-center justify-start pt-3 sm:pt-4 relative overflow-hidden transition-all">
                {/* Soft Clay Inset Number */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-950/40 flex items-center justify-center shadow-inner">
                  <span className="font-mono font-black text-2xl sm:text-3xl text-orange-100 drop-shadow-xs">
                    3
                  </span>
                </div>
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-orange-100 mt-1 sm:mt-1.5">
                  Bronze
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold text-orange-200/90 font-mono mt-0.5">
                  {thirdPlace.gamesPlayed} Matches
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-3">
                <span className="text-xs text-slate-500 font-bold">Open</span>
              </div>
              <div className="w-full h-24 sm:h-32 rounded-t-3xl bg-slate-800/40 border-t-2 border-slate-700 flex items-center justify-center text-xs text-slate-600 font-black">
                3rd Place
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
