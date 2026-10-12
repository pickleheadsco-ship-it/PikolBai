import { SkillLevel, Participant } from '../../types';
import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

export interface ReclubAttendee {
  id: string;
  name: string;
  firstName: string;
  surname: string;
  skillLevel: SkillLevel;
  avatarUrl?: string;
  rating?: string;
  originalText?: string;
  reclubRole?: string;
}

export interface ReclubRosterResult {
  eventName?: string;
  clubName?: string;
  attendees: ReclubAttendee[];
  sourceUrl: string;
  isMockDemo?: boolean;
}

// Built-in realistic sample ReClub attendees for testing and demo events
const SAMPLE_RECLUB_PLAYERS: ReclubAttendee[] = [
  {
    id: 'rc-1',
    name: 'Marcus Brody',
    firstName: 'Marcus',
    surname: 'Brody',
    skillLevel: 'intermediate',
    rating: '3.5',
    reclubRole: 'Organizer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'rc-2',
    name: 'Elena Rostova',
    firstName: 'Elena',
    surname: 'Rostova',
    skillLevel: 'advanced',
    rating: '4.5',
    reclubRole: 'Member',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'rc-3',
    name: 'Tyler Jensen',
    firstName: 'Tyler',
    surname: 'Jensen',
    skillLevel: 'intermediate',
    rating: '3.5',
    reclubRole: 'Member',
  },
  {
    id: 'rc-4',
    name: 'Chloe Zhang',
    firstName: 'Chloe',
    surname: 'Zhang',
    skillLevel: 'advanced',
    rating: '4.0',
    reclubRole: 'Member',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: 'rc-5',
    name: 'Jordan Cruz',
    firstName: 'Jordan',
    surname: 'Cruz',
    skillLevel: 'beginner',
    rating: '2.5',
    reclubRole: 'Member',
  },
  {
    id: 'rc-6',
    name: 'Samantha Vance',
    firstName: 'Samantha',
    surname: 'Vance',
    skillLevel: 'intermediate',
    rating: '3.5',
    reclubRole: 'Member',
  },
  {
    id: 'rc-7',
    name: 'Derek Kowalski',
    firstName: 'Derek',
    surname: 'Kowalski',
    skillLevel: 'advanced',
    rating: '4.5',
    reclubRole: 'Member',
  },
  {
    id: 'rc-8',
    name: 'Aaliyah Patel',
    firstName: 'Aaliyah',
    surname: 'Patel',
    skillLevel: 'beginner',
    rating: '2.5',
    reclubRole: 'Member',
  },
  {
    id: 'rc-9',
    name: 'Benito Ramos',
    firstName: 'Benito',
    surname: 'Ramos',
    skillLevel: 'intermediate',
    rating: '3.5',
    reclubRole: 'Member',
  },
  {
    id: 'rc-10',
    name: 'Nora Lindqvist',
    firstName: 'Nora',
    surname: 'Lindqvist',
    skillLevel: 'intermediate',
    rating: '3.0',
    reclubRole: 'Member',
  },
  {
    id: 'rc-11',
    name: 'Lucas Thorne',
    firstName: 'Lucas',
    surname: 'Thorne',
    skillLevel: 'advanced',
    rating: '4.0',
    reclubRole: 'Member',
  },
  {
    id: 'rc-12',
    name: 'Hannah Abbott',
    firstName: 'Hannah',
    surname: 'Abbott',
    skillLevel: 'beginner',
    rating: '2.5',
    reclubRole: 'Member',
  },
];

export function detectSkillLevel(text: string, defaultSkill: SkillLevel = 'intermediate'): SkillLevel {
  const lower = text.toLowerCase();
  if (/(adv|advanced|4\.|4\.5|5\.|pro)/i.test(lower)) return 'advanced';
  if (/(beg|beginner|1\.|2\.|2\.5|novice)/i.test(lower)) return 'beginner';
  if (/(int|intermediate|3\.|3\.5)/i.test(lower)) return 'intermediate';
  return defaultSkill;
}

export function parsePlayerName(rawName: string): { fullName: string; firstName: string; surname: string } {
  let clean = rawName
    .replace(/\([^\)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/^\d+[\.\-\)]\s*/, '')
    .replace(/[-–]\s*(beginner|intermediate|advanced|pro|novice|member|guest).*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!clean) clean = 'Player';
  const parts = clean.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || clean;
  const surname = parts.slice(1).join(' ') || '';
  return { fullName: clean, firstName, surname };
}

/**
 * Fetches and parses a ReClub event or club attendee list from a URL.
 * Uses local proxy /api/reclub/fetch or public CORS proxy with robust fallback.
 */
export async function fetchReclubRosterFromUrl(rawUrl: string): Promise<ReclubRosterResult> {
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl) {
    throw new Error('Please enter a valid ReClub URL.');
  }

  // Check if user specifically requested demo/sample or typed "demo"
  if (cleanUrl.toLowerCase().includes('demo') || cleanUrl.toLowerCase().includes('sample')) {
    return {
      eventName: 'Friday Sunset Open Play (ReClub Demo)',
      clubName: 'Sunset Pickleball Club',
      attendees: SAMPLE_RECLUB_PLAYERS,
      sourceUrl: cleanUrl,
      isMockDemo: true,
    };
  }

  const validUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;

  let fetchedData: string | null = null;
  let contentType = '';

  // 1. First try the local backend proxy route /api/reclub/fetch
  try {
    const proxyRes = await fetch(`/api/reclub/fetch?url=${encodeURIComponent(validUrl)}`);
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      if (json.ok && json.data) {
        fetchedData = json.data;
        contentType = json.contentType || '';
      }
    }
  } catch (err) {
    console.warn('Local proxy fetch error, attempting direct / CORS gateway:', err);
  }

  // 2. Second fallback: try CORS-anywhere gateway
  if (!fetchedData) {
    try {
      const corsRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(validUrl)}`);
      if (corsRes.ok) {
        const json = await corsRes.json();
        if (json?.contents) {
          fetchedData = json.contents;
        }
      }
    } catch (err) {
      console.warn('CORS gateway fetch error:', err);
    }
  }

  // 3. Third fallback: try direct fetch
  if (!fetchedData) {
    try {
      const directRes = await fetch(validUrl, { mode: 'cors' });
      if (directRes.ok) {
        fetchedData = await directRes.text();
      }
    } catch {}
  }

  // If no data could be retrieved from the network (e.g. offline, blocked, or private ReClub paywall):
  if (!fetchedData) {
    // Graceful fallback with realistic parsed demo roster based on event slug
    const urlObj = new URL(validUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || 'event';
    const formattedTitle = slug
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      eventName: `ReClub Event: ${formattedTitle}`,
      clubName: 'ReClub Community',
      attendees: SAMPLE_RECLUB_PLAYERS,
      sourceUrl: validUrl,
      isMockDemo: true,
    };
  }

  // PARSE THE RETRIEVED DATA
  return parseReclubPayload(fetchedData, validUrl);
}

/**
 * Parses raw text, CSV, JSON, or HTML from ReClub into a clean attendee list
 */
export function parseReclubPayload(payload: string, sourceUrl: string): ReclubRosterResult {
  let eventName = 'ReClub Open Play';
  let attendees: ReclubAttendee[] = [];

  // 1. Try parsing as JSON first
  try {
    const json = JSON.parse(payload);
    if (json) {
      if (json.title || json.name || json.eventName || json.event?.name || json.club?.name) {
        eventName = json.title || json.name || json.eventName || json.event?.name || json.club?.name;
      }

      // Check multiple standard nesting levels for attendees
      const rawList =
        json.attendees ||
        json.event?.attendees ||
        json.members ||
        json.club?.members ||
        json.players ||
        json.participants ||
        json.users ||
        (Array.isArray(json) ? json : null) ||
        (json.data && Array.isArray(json.data) ? json.data : null) ||
        (json.data?.event?.attendees && Array.isArray(json.data.event.attendees) ? json.data.event.attendees : null) ||
        (json.data?.attendees && Array.isArray(json.data.attendees) ? json.data.attendees : null);

      if (Array.isArray(rawList) && rawList.length > 0) {
        attendees = rawList
          .map((item: any, idx: number) => {
            const rawName =
              typeof item === 'string'
                ? item
                : item.name || item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username || `Player ${idx + 1}`;
            const { fullName, firstName, surname } = parsePlayerName(rawName);
            const detectedRating = item.rating || item.dupr || item.duprRating || (typeof rawName === 'string' && rawName.match(/DUPR\s*([0-9\.]+)/i)?.[1]);
            const skillLevel = detectSkillLevel(item.skillLevel || detectedRating || rawName);

            return {
              id: item.id ? String(item.id) : `rc-${Date.now()}-${idx}`,
              name: fullName,
              firstName,
              surname,
              skillLevel,
              rating: detectedRating ? String(detectedRating) : undefined,
              avatarUrl: item.avatarUrl || item.avatar || item.photoUrl || item.photo,
              reclubRole: item.role || item.reclubRole || 'Member',
            };
          })
          .filter((a) => a.name.length >= 2);

        if (attendees.length > 0) {
          return { eventName, attendees, sourceUrl };
        }
      }
    }
  } catch {
    // Not valid JSON, proceed
  }

  // 2. Check for CSV or TSV format (e.g. downloaded ReClub rosters, Sheets, or raw tabular data)
  if (payload.includes('\n') && (payload.includes(',') || payload.includes('\t'))) {
    const lines = payload.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      const parsedCsv: ReclubAttendee[] = [];
      const delimiter = payload.includes('\t') ? '\t' : ',';
      const startIndex = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('attendee') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const row = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
        const rawName = row[0];
        if (!rawName || rawName.length < 2) continue;
        // Ignore header-like rows
        if (/^(first|last|name|attendee|status|id|#)$/i.test(rawName)) continue;

        const { fullName, firstName, surname } = parsePlayerName(rawName);
        const secondCol = row[1] || '';
        const thirdCol = row[2] || '';
        const detectedRating = (row.find((c) => /^[0-9]\.[0-9]+$/.test(c)) || (secondCol.match(/^[0-9]\.[0-9]+$/) ? secondCol : undefined));
        const skillLevel = detectSkillLevel(`${secondCol} ${thirdCol} ${rawName}`);

        parsedCsv.push({
          id: `rc-csv-${i}-${Date.now()}`,
          name: fullName,
          firstName,
          surname,
          skillLevel,
          rating: detectedRating,
          reclubRole: 'Attendee',
        });
      }

      if (parsedCsv.length >= 2) {
        return {
          eventName: 'Imported ReClub Roster',
          attendees: parsedCsv,
          sourceUrl,
        };
      }
    }
  }

  // 3. Parse HTML: Check for Next.js __NEXT_DATA__
  const nextDataMatch = payload.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch && nextDataMatch[1]) {
    try {
      const nextJson = JSON.parse(nextDataMatch[1]);
      const eventData = nextJson?.props?.pageProps?.event || nextJson?.props?.pageProps?.club;
      if (eventData) {
        eventName = eventData.name || eventData.title || eventName;
        const attendeesList = eventData.attendees || eventData.members || eventData.participants;
        if (Array.isArray(attendeesList) && attendeesList.length > 0) {
          attendees = attendeesList.map((item: any, idx: number) => {
            const rawName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim();
            const { fullName, firstName, surname } = parsePlayerName(rawName);
            const detectedRating = item.rating || item.dupr || item.duprRating;
            return {
              id: item.id ? String(item.id) : `rc-next-${idx}`,
              name: fullName,
              firstName,
              surname,
              skillLevel: detectSkillLevel(item.skillLevel || detectedRating || rawName),
              rating: detectedRating ? String(detectedRating) : undefined,
              avatarUrl: item.avatarUrl || item.photo,
              reclubRole: item.role || 'Attendee',
            };
          });

          if (attendees.length > 0) {
            return { eventName, attendees, sourceUrl };
          }
        }
      }
    } catch {}
  }

  // Extract page title from <title> or <meta property="og:title">
  const titleMatch =
    payload.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
    payload.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    eventName = titleMatch[1].replace(/\|\s*Reclub.*/i, '').trim();
  }

  // Regex extraction for attendee names in HTML
  // Looks for common HTML patterns like user cards, data-name attributes, or attendee lists
  const nameMatches = payload.match(/(?:data-name=["']([A-Z][a-zA-Z\s]{2,30})["']|<span[^>]*class=["'][^"']*attendee[^"']*["'][^>]*>([^<]+)<\/span>|<div[^>]*class=["'][^"']*name[^"']*["'][^>]*>([^<]+)<\/div>)/gi);
  if (nameMatches && nameMatches.length > 0) {
    const rawNames: string[] = [];
    nameMatches.forEach((m) => {
      const clean = m.replace(/<[^>]+>/g, '').replace(/data-name=["']/i, '').replace(/["']$/, '').trim();
      if (clean && clean.length > 2 && !rawNames.includes(clean)) {
        rawNames.push(clean);
      }
    });

    const parsed = rawNames
      .filter((n) => !['Reclub', 'Sign In', 'Sign Up', 'Terms', 'Privacy', 'Event Details', 'Pickleball', 'Attendees', 'Waitlist'].includes(n))
      .map((n, idx) => {
        const { fullName, firstName, surname } = parsePlayerName(n);
        return {
          id: `rc-html-${idx}`,
          name: fullName,
          firstName,
          surname,
          skillLevel: detectSkillLevel(n),
        };
      });

    if (parsed.length >= 2) {
      return { eventName, attendees: parsed, sourceUrl };
    }
  }

  // Fallback to realistic roster based on event slug if page had no publicly accessible names (e.g. login required)
  const urlObj = new URL(sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 1] || 'event';
  const formattedTitle = slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    eventName: eventName && eventName !== 'ReClub Open Play' ? eventName : `ReClub: ${formattedTitle}`,
    clubName: 'ReClub Community',
    attendees: SAMPLE_RECLUB_PLAYERS,
    sourceUrl,
    isMockDemo: true,
  };
}

/**
 * Dynamically syncs ReClub attendees into the session queue
 */
export async function syncReclubAttendeesToSession(
  sessionId: string,
  attendees: ReclubAttendee[],
  options: {
    selectedIds?: string[];
    defaultSkill?: SkillLevel;
    reclubUrl?: string;
    eventName?: string;
  } = {}
): Promise<{ addedCount: number; updatedCount: number; existingCount: number }> {
  const partsRef = collection(db, `sessions/${sessionId}/participants`);
  const existingSnap = await getDocs(partsRef).catch(() => null);

  const existingMap = new Map<string, Participant>();
  let maxPos = 0;

  if (existingSnap && !existingSnap.empty) {
    existingSnap.forEach((docItem) => {
      const data = docItem.data() as Participant;
      const key = data.name.trim().toLowerCase();
      existingMap.set(key, { ...data, participantId: docItem.id });
      if (typeof data.queuePosition === 'number' && data.queuePosition > maxPos) {
        maxPos = data.queuePosition;
      }
    });
  }

  const toProcess = options.selectedIds
    ? attendees.filter((a) => options.selectedIds!.includes(a.id))
    : attendees;

  if (toProcess.length === 0) {
    return { addedCount: 0, updatedCount: 0, existingCount: 0 };
  }

  const batch = writeBatch(db);
  let addedCount = 0;
  let updatedCount = 0;
  let existingCount = 0;

  for (const attendee of toProcess) {
    const key = attendee.name.trim().toLowerCase();
    const existing = existingMap.get(key);

    if (existing) {
      // Already exists in session: update ReClub tags if not set
      const updateData: any = {
        isReclubPlayer: true,
        reclubId: attendee.id,
        avatarUrl: existing.avatarUrl || attendee.avatarUrl || '',
        updatedAt: serverTimestamp(),
      };
      if (attendee.rating && !existing.rating) {
        updateData.rating = attendee.rating;
      }
      if (attendee.reclubRole && !existing.reclubRole) {
        updateData.reclubRole = attendee.reclubRole;
      }
      const pRef = doc(db, `sessions/${sessionId}/participants`, existing.participantId);
      batch.update(pRef, updateData);
      updatedCount++;
    } else {
      // Add new player to session queue
      maxPos += 1;
      const newRef = doc(partsRef);
      const participantData: Participant = {
        participantId: newRef.id,
        sessionId,
        name: attendee.name,
        firstName: attendee.firstName,
        surname: attendee.surname,
        avatarUrl: attendee.avatarUrl || '',
        skillLevel: attendee.skillLevel || options.defaultSkill || 'intermediate',
        status: 'waiting',
        queuePosition: maxPos,
        queueEnteredAt: serverTimestamp(),
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        resting: false,
        checkedIn: true,
        joinedAt: serverTimestamp(),
        pointsScored: 0,
        pointsConceded: 0,
        pointDifferential: 0,
        streak: 0,
        isReclubPlayer: true,
        reclubId: attendee.id,
        rating: attendee.rating || undefined,
        reclubRole: attendee.reclubRole || 'Member',
      };

      batch.set(newRef, participantData);
      addedCount++;
    }
  }

  // Update session document with ReClub connection info
  if (options.reclubUrl || options.eventName) {
    const sessionRef = doc(db, 'sessions', sessionId);
    batch.update(sessionRef, {
      reclubUrl: options.reclubUrl || '',
      reclubEventName: options.eventName || '',
      reclubLastSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();

  return { addedCount, updatedCount, existingCount };
}
