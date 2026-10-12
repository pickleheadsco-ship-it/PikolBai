import React, { useState, useEffect } from 'react';
import { Participant, Session, SkillLevel, Court, Match } from '../../types';
import { SkillBadge } from '../ui/Badge';
import {
  fetchReclubRosterFromUrl,
  syncReclubAttendeesToSession,
  ReclubAttendee,
} from '../../services/reclub/reclubService';
import {
  updateParticipantSkill,
  updateParticipantRestStatus,
} from '../../services/sessions/sessionService';
import {
  Link2,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Check,
  Loader2,
  Play,
  Coffee,
  CheckSquare,
  Square,
  Shield,
  Activity,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface ReclubPlayerListProps {
  sessionId: string;
  session: Session;
  participants: Participant[];
  courts?: Court[];
  activeMatches?: Match[];
  onPlayerSynced?: () => void;
  onSelectPlayerProfile?: (participant: Participant) => void;
}

export const ReclubPlayerList: React.FC<ReclubPlayerListProps> = ({
  sessionId,
  session,
  participants,
  courts = [],
  activeMatches = [],
  onPlayerSynced,
  onSelectPlayerProfile,
}) => {
  const [urlInput, setUrlInput] = useState(session.reclubUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<ReclubAttendee[]>([]);
  const [eventName, setEventName] = useState<string>(session.reclubEventName || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_session' | 'playing' | 'waiting' | 'resting' | 'pending'>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [updatingParticipantId, setUpdatingParticipantId] = useState<string | null>(null);

  // Load initial demo/cached list if session already has a reclubUrl or on first load
  useEffect(() => {
    if (session.reclubUrl && attendees.length === 0) {
      handleFetchUrl(session.reclubUrl, false);
    }
  }, [session.reclubUrl]);

  const handleFetchUrl = async (urlToFetch?: string, showSuccessNotice = true) => {
    const targetUrl = (urlToFetch || urlInput).trim();
    if (!targetUrl) {
      setError('Please provide a valid ReClub event or club URL (or enter "demo" for test roster).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await fetchReclubRosterFromUrl(targetUrl);
      setAttendees(result.attendees);

      // Preselect pending attendees by default for convenience
      const pendingIds = result.attendees
        .filter((a) => !getSessionPlayerForAttendee(a))
        .map((a) => a.id);
      setSelectedPendingIds(pendingIds);

      if (result.eventName) setEventName(result.eventName);

      if (showSuccessNotice) {
        setSuccessMsg(
          `Successfully fetched ${result.attendees.length} players from ${result.eventName || 'ReClub'}!`
        );
      }
    } catch (err: any) {
      console.error('Reclub fetch error:', err);
      setError(err?.message || 'Could not fetch ReClub URL. Please verify the link.');
    } finally {
      setIsLoading(false);
    }
  };

  // Find match in current active session participants
  const getSessionPlayerForAttendee = (attendee: ReclubAttendee): Participant | undefined => {
    const cleanReclubName = attendee.name.trim().toLowerCase();
    return participants.find(
      (p) =>
        p.status !== 'left' &&
        (p.reclubId === attendee.id || p.name.trim().toLowerCase() === cleanReclubName)
    );
  };

  // Helper to find court info for a playing participant
  const getPlayerCourtInfo = (participant: Participant) => {
    if (participant.status !== 'playing') return null;
    const court = courts.find((c) => c.courtId === participant.currentCourtId);
    const match = activeMatches.find(
      (m) => m.courtId === participant.currentCourtId || m.matchId === participant.currentMatchId
    );
    return {
      courtName: court?.name || 'Court in Play',
      match,
    };
  };

  const handleSyncIndividual = async (attendee: ReclubAttendee) => {
    setIsSyncing(true);
    setError(null);
    try {
      await syncReclubAttendeesToSession(sessionId, [attendee], {
        reclubUrl: urlInput,
        eventName: eventName || session.reclubEventName,
      });
      setSuccessMsg(`Checked in ${attendee.name} to the active queue!`);
      // Remove from selected pending
      setSelectedPendingIds((prev) => prev.filter((id) => id !== attendee.id));
      if (onPlayerSynced) onPlayerSynced();
    } catch (err: any) {
      setError(err?.message || 'Failed to check in player.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSelectedPending = async () => {
    const unsyncedAttendees = attendees.filter(
      (a) => selectedPendingIds.includes(a.id) && !getSessionPlayerForAttendee(a)
    );

    if (unsyncedAttendees.length === 0) {
      setError('Please select at least one pending attendee to check in.');
      return;
    }

    setIsSyncing(true);
    setError(null);
    try {
      const res = await syncReclubAttendeesToSession(sessionId, unsyncedAttendees, {
        reclubUrl: urlInput,
        eventName: eventName || session.reclubEventName,
      });

      setSuccessMsg(
        `Successfully checked in ${res.addedCount} ReClub players into the active queue!`
      );
      setSelectedPendingIds([]);
      if (onPlayerSynced) onPlayerSynced();
    } catch (err: any) {
      setError(err?.message || 'Failed to sync ReClub players.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSelectPending = (attendeeId: string) => {
    setSelectedPendingIds((prev) =>
      prev.includes(attendeeId) ? prev.filter((id) => id !== attendeeId) : [...prev, attendeeId]
    );
  };

  const handleSelectAllPending = (select: boolean) => {
    if (select) {
      const pendingIds = attendees
        .filter((a) => !getSessionPlayerForAttendee(a))
        .map((a) => a.id);
      setSelectedPendingIds(pendingIds);
    } else {
      setSelectedPendingIds([]);
    }
  };

  const handleAttendeeSkillChange = (attendeeId: string, newSkill: SkillLevel) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === attendeeId ? { ...a, skillLevel: newSkill } : a))
    );
  };

  const handleToggleRest = async (p: Participant) => {
    setUpdatingParticipantId(p.participantId);
    try {
      await updateParticipantRestStatus(sessionId, p.participantId, !p.resting);
    } catch (err) {
      console.error('Failed to toggle rest:', err);
    } finally {
      setUpdatingParticipantId(null);
    }
  };

  const handleSessionPlayerSkillChange = async (participantId: string, newSkill: SkillLevel) => {
    setUpdatingParticipantId(participantId);
    try {
      await updateParticipantSkill(sessionId, participantId, newSkill);
    } catch (err) {
      console.error('Failed to update skill:', err);
    } finally {
      setUpdatingParticipantId(null);
    }
  };

  // Filter attendees
  const filteredAttendees = attendees.filter((a) => {
    const sessionMatch = getSessionPlayerForAttendee(a);

    // Status filter
    if (statusFilter === 'in_session' && !sessionMatch) return false;
    if (statusFilter === 'pending' && Boolean(sessionMatch)) return false;
    if (statusFilter === 'playing' && sessionMatch?.status !== 'playing') return false;
    if (statusFilter === 'waiting' && (sessionMatch?.status !== 'waiting' || sessionMatch?.resting))
      return false;
    if (statusFilter === 'resting' && !sessionMatch?.resting) return false;

    // Skill filter
    const effectiveSkill = sessionMatch ? sessionMatch.skillLevel : a.skillLevel;
    if (skillFilter !== 'all' && effectiveSkill !== skillFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        (a.rating || '').toLowerCase().includes(q) ||
        (a.reclubRole || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const checkedInCount = attendees.filter((a) => Boolean(getSessionPlayerForAttendee(a))).length;
  const pendingCount = attendees.length - checkedInCount;
  const playingCount = attendees.filter((a) => getSessionPlayerForAttendee(a)?.status === 'playing')
    .length;
  const waitingCount = attendees.filter(
    (a) => {
      const p = getSessionPlayerForAttendee(a);
      return p?.status === 'waiting' && !p?.resting;
    }
  ).length;
  const restingCount = attendees.filter((a) => getSessionPlayerForAttendee(a)?.resting).length;

  return (
    <div className="space-y-4">
      {/* Fetch & Connection Bar */}
      <div className="clay-card rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center clay-subcard shadow-sm">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  ReClub Player Integration
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Fetch attendee rosters via URL and sync dynamically into session rotation
              </p>
            </div>
          </div>

          {/* Quick Demo Preload Button */}
          <button
            type="button"
            onClick={() => {
              setUrlInput('https://reclub.co/events/friday-open-play-demo');
              handleFetchUrl('https://reclub.co/events/friday-open-play-demo');
            }}
            className="px-3.5 py-2 rounded-xl clay-btn clay-btn-secondary text-xs font-black text-slate-700 flex items-center gap-1.5 cursor-pointer self-start md:self-auto hover:border-emerald-300"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Load Demo Roster</span>
          </button>
        </div>

        {/* URL Input Form */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste ReClub event URL (e.g. https://reclub.co/events/... or demo)"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl clay-inset text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-emerald-500 bg-white"
            />
            <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFetchUrl()}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl clay-btn clay-btn-primary text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Fetch via URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Dynamic Player List View */}
      {attendees.length > 0 && (
        <div className="clay-card rounded-3xl p-4 sm:p-5 space-y-4 animate-in fade-in">
          {/* Header & Metric Summary */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                  {eventName || 'ReClub Attendees'} ({attendees.length})
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-medium text-slate-500">
                <span className="text-emerald-700 font-bold">
                  🎾 {playingCount} on court
                </span>
                <span>•</span>
                <span className="text-sky-700 font-bold">
                  ⏳ {waitingCount} in queue
                </span>
                {restingCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 font-bold">
                      ☕ {restingCount} resting
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="text-slate-600 font-bold">
                  📋 {pendingCount} pending check-in
                </span>
              </div>
            </div>

            {/* Batch Check-in Actions */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncSelectedPending}
                  disabled={isSyncing || selectedPendingIds.length === 0}
                  className="px-4 py-2.5 rounded-2xl clay-btn clay-btn-primary text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    Check In Selected ({selectedPendingIds.length})
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ReClub attendee names, DUPR ratings, or roles..."
                className="w-full pl-9 pr-4 py-2 rounded-xl clay-inset text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-emerald-500 bg-white"
              />
            </div>

            {/* Status Pills Filter */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-black pb-1 md:pb-0">
              {(
                [
                  { id: 'all', label: `All (${attendees.length})` },
                  { id: 'playing', label: `Court (${playingCount})` },
                  { id: 'waiting', label: `Queue (${waitingCount})` },
                  { id: 'pending', label: `Pending (${pendingCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all clay-btn whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.id
                      ? 'clay-btn-primary text-white shadow-xs'
                      : 'clay-btn-secondary text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* Skill Dropdown */}
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl clay-inset text-xs font-black text-slate-800 focus:outline-emerald-500 bg-white"
              >
                <option value="all">All Skills</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Pending Selection Bar if Pending Items are Visible */}
          {pendingCount > 0 && (
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectAllPending(true)}
                  className="hover:text-emerald-700 flex items-center gap-1 underline"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select All Pending ({pendingCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllPending(false)}
                  className="hover:text-rose-700 flex items-center gap-1 underline"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deselect All</span>
                </button>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedPendingIds.length} pending players selected for rotation
              </span>
            </div>
          )}

          {/* Dynamic Roster Grid */}
          {filteredAttendees.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-black text-slate-800">No matching ReClub attendees</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Try clearing search or filter to see more players.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[62vh] overflow-y-auto pr-1">
              {filteredAttendees.map((attendee) => {
                const sessionPlayer = getSessionPlayerForAttendee(attendee);
                const isCheckedIn = Boolean(sessionPlayer);
                const isPlaying = sessionPlayer?.status === 'playing';
                const isResting = sessionPlayer?.resting;
                const isWaiting = sessionPlayer?.status === 'waiting' && !isResting;
                const isSelected = selectedPendingIds.includes(attendee.id);
                const courtInfo = sessionPlayer ? getPlayerCourtInfo(sessionPlayer) : null;
                const isBusy = updatingParticipantId === sessionPlayer?.participantId;

                return (
                  <div
                    key={attendee.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isPlaying
                        ? 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-300 ring-1 ring-emerald-400/30'
                        : isWaiting
                        ? 'bg-gradient-to-br from-sky-50/40 to-white border-sky-200'
                        : isResting
                        ? 'bg-amber-50/50 border-amber-200'
                        : isCheckedIn
                        ? 'bg-slate-50/90 border-slate-200'
                        : isSelected
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-white border-slate-200/80 hover:border-emerald-300'
                    }`}
                  >
                    {/* Top Row: Checkbox/Status, Avatar, Info, Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                        {/* If pending: Checkbox */}
                        {!isCheckedIn && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectPending(attendee.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                            title="Select player to check in"
                          />
                        )}

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden shadow-xs relative">
                          {attendee.avatarUrl ? (
                            <img
                              src={attendee.avatarUrl}
                              alt={attendee.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            attendee.name.slice(0, 2).toUpperCase()
                          )}
                          {isPlaying && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>

                        {/* Name & Subtitles */}
                        <div className="truncate flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-black text-xs text-slate-900 truncate">
                              {attendee.name}
                            </span>
                            {attendee.rating && (
                              <span className="text-[10px] font-mono font-black text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded-md shrink-0">
                                DUPR {attendee.rating}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            {/* Skill level pill or selector */}
                            {sessionPlayer ? (
                              <select
                                value={sessionPlayer.skillLevel}
                                disabled={isBusy}
                                onChange={(e) =>
                                  handleSessionPlayerSkillChange(
                                    sessionPlayer.participantId,
                                    e.target.value as SkillLevel
                                  )
                                }
                                className="clay-subcard rounded-lg px-1.5 py-0.5 text-[10px] font-black cursor-pointer capitalize text-slate-800 bg-white"
                                title="Change participant category"
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                              </select>
                            ) : (
                              <select
                                value={attendee.skillLevel}
                                onChange={(e) =>
                                  handleAttendeeSkillChange(
                                    attendee.id,
                                    e.target.value as SkillLevel
                                  )
                                }
                                className="clay-subcard rounded-lg px-1.5 py-0.5 text-[10px] font-black cursor-pointer capitalize text-slate-700 bg-white"
                                title="Set category before check-in"
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                              </select>
                            )}

                            {attendee.reclubRole && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                {attendee.reclubRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* State Badge */}
                      <div className="shrink-0 text-right">
                        {isPlaying ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2.5 py-0.8 rounded-xl bg-emerald-600 text-white font-black text-[10px] flex items-center gap-1 uppercase tracking-wider shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>On Court</span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-800">
                              {courtInfo?.courtName || 'Court'}
                            </span>
                          </div>
                        ) : isResting ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-black text-[10px] uppercase flex items-center gap-1">
                            <Coffee className="w-3 h-3" />
                            <span>Resting</span>
                          </span>
                        ) : isWaiting ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-black text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-600" />
                              <span>Queue #{sessionPlayer?.queuePosition ?? '—'}</span>
                            </span>
                            {sessionPlayer?.queuePosition !== undefined &&
                              sessionPlayer.queuePosition <= 4 && (
                                <span className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5" /> Next Up
                                </span>
                              )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Stats & Action Buttons */}
                    <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2 text-xs">
                      {sessionPlayer ? (
                        <>
                          {/* Live Session Record */}
                          <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-600">
                            <span>{sessionPlayer.gamesPlayed || 0}G</span>
                            <span>•</span>
                            <span className="text-emerald-700">{sessionPlayer.wins || 0}W</span>
                            <span>-</span>
                            <span className="text-rose-700">{sessionPlayer.losses || 0}L</span>
                            <span>•</span>
                            <span className="text-slate-800">{sessionPlayer.winRate || 0}%</span>
                          </div>

                          {/* Quick Interactive Actions */}
                          <div className="flex items-center gap-1.5">
                            {onSelectPlayerProfile && (
                              <button
                                type="button"
                                onClick={() => onSelectPlayerProfile(sessionPlayer)}
                                className="px-2 py-1 rounded-lg clay-btn clay-btn-secondary text-[11px] font-bold text-slate-700 hover:text-emerald-800 cursor-pointer"
                                title="View profile & statistics"
                              >
                                Profile
                              </button>
                            )}

                            {!isPlaying && (
                              <button
                                type="button"
                                onClick={() => handleToggleRest(sessionPlayer)}
                                disabled={isBusy}
                                className={`px-2 py-1 rounded-lg clay-btn text-[11px] font-black flex items-center gap-1 cursor-pointer ${
                                  isResting
                                    ? 'clay-btn-primary text-white'
                                    : 'clay-btn-secondary text-slate-600'
                                }`}
                                title={isResting ? 'Resume rotation queue' : 'Put on rest'}
                              >
                                {isResting ? (
                                  <>
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Resume</span>
                                  </>
                                ) : (
                                  <>
                                    <Coffee className="w-3 h-3" />
                                    <span>Rest</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] text-slate-400 font-medium">
                            Not yet added to queue
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSyncIndividual(attendee)}
                            disabled={isSyncing}
                            className="px-3 py-1 rounded-xl clay-btn clay-btn-primary text-white text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer hover:scale-102 active:scale-98"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Check In</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
