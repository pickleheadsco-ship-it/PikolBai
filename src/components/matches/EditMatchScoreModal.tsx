import React, { useState } from 'react';
import { Match, Participant } from '../../types';
import { Trophy, X, Award, AlertCircle, Loader2, Edit3, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { editSubmittedMatchScore } from '../../services/sessions/sessionService';

interface EditMatchScoreModalProps {
  sessionId: string;
  match: Match;
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdated?: () => void;
}

export const EditMatchScoreModal: React.FC<EditMatchScoreModalProps> = ({
  sessionId,
  match,
  participants,
  isOpen,
  onClose,
  onScoreUpdated,
}) => {
  const initialWinningTeam = match.winningTeam || 'teamA';
  const initialScoreA = match.score?.teamA !== undefined ? String(match.score.teamA) : (initialWinningTeam === 'teamA' ? '11' : '9');
  const initialScoreB = match.score?.teamB !== undefined ? String(match.score.teamB) : (initialWinningTeam === 'teamB' ? '11' : '9');

  const [winningTeam, setWinningTeam] = useState<'teamA' | 'teamB'>(initialWinningTeam);
  const [scoreA, setScoreA] = useState<string>(initialScoreA);
  const [scoreB, setScoreB] = useState<string>(initialScoreB);
  const [editReason, setEditReason] = useState<string>(match.editReason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const getPlayer = (id: string) => participants.find((p) => p.participantId === id);
  const teamAPlayers = (match.teamA || []).map(getPlayer).filter(Boolean) as Participant[];
  const teamBPlayers = (match.teamB || []).map(getPlayer).filter(Boolean) as Participant[];

  const handleApplyPreset = (teamAScore: number, teamBScore: number, winner: 'teamA' | 'teamB') => {
    setWinningTeam(winner);
    setScoreA(String(teamAScore));
    setScoreB(String(teamBScore));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedA = parseInt(scoreA, 10);
    const parsedB = parseInt(scoreB, 10);

    if (isNaN(parsedA) || isNaN(parsedB) || parsedA < 0 || parsedB < 0) {
      setErrorMsg('Please enter valid positive point scores for both teams.');
      setIsSubmitting(false);
      return;
    }

    try {
      await editSubmittedMatchScore(sessionId, match.matchId, {
        newWinningTeam: winningTeam,
        newScoreA: parsedA,
        newScoreB: parsedB,
        editReason: editReason.trim() || 'Score adjusted after submission',
        editedBy: 'Player / Scorekeeper',
      });

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      } catch {}

      setSuccessMsg('Match score updated and player standings adjusted!');
      if (onScoreUpdated) onScoreUpdated();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Error updating match score:', err);
      setErrorMsg(err?.message || 'Could not update match score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="clay-card rounded-3xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center clay-subcard">
              <Edit3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-slate-900 text-base">Edit Match Score</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800">
                  Adjustment
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{match.courtName || 'Court'} — Result Correction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl clay-btn clay-btn-secondary flex items-center justify-center text-slate-500"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="text-xs text-slate-600 font-medium">
            Adjusting this submitted score automatically updates player wins, losses, points scored, and leaderboard win rates.
          </div>

          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            Winning Team
          </label>

          {/* Team Selection Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Team A Option */}
            <button
              type="button"
              onClick={() => {
                setWinningTeam('teamA');
                if (parseInt(scoreA, 10) <= parseInt(scoreB, 10)) {
                  setScoreA('11');
                  setScoreB('9');
                }
              }}
              className={`p-3.5 rounded-2xl text-left transition-all relative flex flex-col justify-between clay-btn cursor-pointer ${
                winningTeam === 'teamA'
                  ? 'clay-btn-primary shadow-lg ring-2 ring-emerald-300'
                  : 'clay-subcard text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider">Team A</span>
                  {winningTeam === 'teamA' && <Award className="w-4 h-4 text-amber-300" />}
                </div>
                <div className="space-y-0.5 text-xs font-bold">
                  {teamAPlayers.length > 0 ? (
                    teamAPlayers.map((p) => (
                      <div key={p.participantId} className="truncate">
                        {p.name}
                      </div>
                    ))
                  ) : (
                    <div className="truncate">{match.teamANames?.join(' & ') || 'Team A Players'}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 text-[11px] font-black uppercase tracking-wider">
                {winningTeam === 'teamA' ? 'Winner 🏆' : 'Select as Winner'}
              </div>
            </button>

            {/* Team B Option */}
            <button
              type="button"
              onClick={() => {
                setWinningTeam('teamB');
                if (parseInt(scoreB, 10) <= parseInt(scoreA, 10)) {
                  setScoreB('11');
                  setScoreA('9');
                }
              }}
              className={`p-3.5 rounded-2xl text-left transition-all relative flex flex-col justify-between clay-btn cursor-pointer ${
                winningTeam === 'teamB'
                  ? 'clay-btn-sky shadow-lg ring-2 ring-sky-300'
                  : 'clay-subcard text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider">Team B</span>
                  {winningTeam === 'teamB' && <Award className="w-4 h-4 text-amber-300" />}
                </div>
                <div className="space-y-0.5 text-xs font-bold">
                  {teamBPlayers.length > 0 ? (
                    teamBPlayers.map((p) => (
                      <div key={p.participantId} className="truncate">
                        {p.name}
                      </div>
                    ))
                  ) : (
                    <div className="truncate">{match.teamBNames?.join(' & ') || 'Team B Players'}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 text-[11px] font-black uppercase tracking-wider">
                {winningTeam === 'teamB' ? 'Winner 🏆' : 'Select as Winner'}
              </div>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">
              Quick Score Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '11 - 9 (A)', a: 11, b: 9, w: 'teamA' as const },
                { label: '11 - 7 (A)', a: 11, b: 7, w: 'teamA' as const },
                { label: '11 - 4 (A)', a: 11, b: 4, w: 'teamA' as const },
                { label: '9 - 11 (B)', a: 9, b: 11, w: 'teamB' as const },
                { label: '7 - 11 (B)', a: 7, b: 11, w: 'teamB' as const },
                { label: '4 - 11 (B)', a: 4, b: 11, w: 'teamB' as const },
                { label: '15 - 13 (A)', a: 15, b: 13, w: 'teamA' as const },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset.a, preset.b, preset.w)}
                  className="px-2.5 py-1 text-[11px] font-black rounded-lg clay-subcard hover:border-emerald-300 text-slate-700 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Point Counter Inputs */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
              Corrected Points
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Team A</span>
                <div className="clay-inset rounded-2xl px-3 py-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setScoreA((prev) => String(Math.max(0, (parseInt(prev, 10) || 0) - 1)))}
                    className="w-7 h-7 rounded-lg clay-btn clay-btn-secondary text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="w-14 bg-transparent text-center font-mono font-black text-xl text-slate-900 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setScoreA((prev) => String((parseInt(prev, 10) || 0) + 1))}
                    className="w-7 h-7 rounded-lg clay-btn clay-btn-secondary text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <span className="text-slate-400 font-black text-lg pt-4">-</span>

              <div className="flex-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Team B</span>
                <div className="clay-inset rounded-2xl px-3 py-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setScoreB((prev) => String(Math.max(0, (parseInt(prev, 10) || 0) - 1)))}
                    className="w-7 h-7 rounded-lg clay-btn clay-btn-secondary text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="w-14 bg-transparent text-center font-mono font-black text-xl text-slate-900 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setScoreB((prev) => String((parseInt(prev, 10) || 0) + 1))}
                    className="w-7 h-7 rounded-lg clay-btn clay-btn-secondary text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1 uppercase tracking-wider">
              Reason for Adjustment (Optional)
            </label>
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g., Score typo entered originally, disputed ball confirmed"
              className="w-full px-3 py-2 rounded-xl clay-inset text-xs font-medium text-slate-800 placeholder-slate-400 bg-white focus:outline-emerald-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-3 rounded-2xl clay-btn clay-btn-secondary text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl clay-btn clay-btn-primary text-white text-xs font-black shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Score...</span>
                </>
              ) : (
                <span>Save & Update Standings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
