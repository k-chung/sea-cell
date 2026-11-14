// Browser storage: the saved run, Hall of Fame, feedback notes and settings.
// Storage can be unavailable (private windows, blocked cookies), so every call is wrapped
// and the game still works without it, just without saving.

import type { Balance } from '../content/types.ts';
import type { RunRecord } from '../core/index.ts';

const PREFIX = 'sea-cell:';
export const SAVE_VERSION = 1;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full: the game keeps running without saving.
  }
}

/** A saved run is just its record (seed + actions) plus any dev balance overrides. */
export interface SavedRun {
  saveVersion: number;
  stateVersion: number;
  run: RunRecord;
  balanceOverrides: Partial<Balance>;
}

export const loadSave = () => read<SavedRun | null>('save', null);
export const writeSave = (save: SavedRun) => write('save', save);
export const clearSave = () => {
  try { localStorage.removeItem(PREFIX + 'save'); } catch { /* ignore */ }
};

export interface HallEntry {
  endedAt: string;
  won: boolean;
  reason: string;
  date: string;
  prestige: number;
  milestones: number;
  seed: number;
  storyMode: boolean;
}
export interface Fallen { name: string; mission: string; date: string }
export interface Hall { runs: HallEntry[]; fallen: Fallen[] }

export const loadHall = () => read<Hall>('hall', { runs: [], fallen: [] });
export function addToHall(entry: HallEntry, fallen: Fallen[]): void {
  const hall = loadHall();
  hall.runs = [entry, ...hall.runs].slice(0, 25);
  hall.fallen = [...fallen, ...hall.fallen].slice(0, 200);
  write('hall', hall);
}

/** A playtest note with everything needed to replay the exact moment. */
export interface FeedbackNote {
  note: string;
  createdAt: string;
  date: string;
  phase: string;
  balanceOverrides: Partial<Balance>;
  run: RunRecord;
}
export const loadNotes = () => read<FeedbackNote[]>('notes', []);
export function addNote(note: FeedbackNote): void {
  write('notes', [...loadNotes(), note]);
}
export const clearNotes = () => write('notes', []);

export const loadSound = () => read<boolean>('sound', false);
export const saveSound = (on: boolean) => write('sound', on);

export const loadTextSize = () => read<number>('textSize', 2);
export const saveTextSize = (n: number) => write('textSize', n);

export const loadBalanceOverrides = () => read<Partial<Balance>>('balanceOverrides', {});
export const saveBalanceOverrides = (o: Partial<Balance>) => write('balanceOverrides', o);
