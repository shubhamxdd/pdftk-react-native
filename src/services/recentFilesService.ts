/**
 * recentFilesService.ts
 *
 * Stores metadata about recently processed PDFs in AsyncStorage.
 * Called from each tool screen after a successful operation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTS_KEY = '@pdftoolkit_recents';
const MAX_RECENTS = 30;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RecentFile {
  id: string;          // unique — timestamp string
  name: string;
  uri: string;
  toolType: ToolType;   // what operation created it
  size: number;         // bytes
  createdAt: number;    // unix ms
}

export type ToolType =
  | 'merge'
  | 'split'
  | 'rotate'
  | 'compress'
  | 'image_to_pdf'
  | 'pdf_to_image'
  | 'reorder'
  | 'lock'
  | 'unlock';

// ── Human-readable labels & icons ─────────────────────────────────────────────

export const TOOL_META: Record<ToolType, { label: string; icon: string; color: string }> = {
  merge:        { label: 'Merged',      icon: 'vector-combine',        color: '#3B82F6' },
  split:        { label: 'Split',       icon: 'content-cut',           color: '#F59E0B' },
  rotate:       { label: 'Rotated',     icon: 'rotate-right',          color: '#8B5CF6' },
  compress:     { label: 'Compressed',  icon: 'file-percent',          color: '#10B981' },
  image_to_pdf: { label: 'Images→PDF',  icon: 'image-multiple',        color: '#EC4899' },
  pdf_to_image: { label: 'PDF→Images',  icon: 'file-image-outline',    color: '#06B6D4' },
  reorder:      { label: 'Reordered',   icon: 'order-numeric-ascending', color: '#F97316' },
  lock:         { label: 'Locked',      icon: 'lock-outline',          color: '#EF4444' },
  unlock:       { label: 'Unlocked',    icon: 'lock-open-outline',     color: '#22C55E' },
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getRecentFiles(): Promise<RecentFile[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addRecentFile(
  file: Omit<RecentFile, 'id' | 'createdAt'>,
): Promise<void> {
  try {
    const existing = await getRecentFiles();
    const entry: RecentFile = {
      ...file,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    // Prepend new, dedupe by URI, cap at MAX_RECENTS
    const updated = [entry, ...existing.filter(f => f.uri !== file.uri)].slice(0, MAX_RECENTS);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  } catch {
    // silently fail — recents is non-critical
  }
}

export async function removeRecentFile(id: string): Promise<void> {
  try {
    const existing = await getRecentFiles();
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(existing.filter(f => f.id !== id)));
  } catch {}
}

export async function clearRecentFiles(): Promise<void> {
  await AsyncStorage.removeItem(RECENTS_KEY);
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatSize(bytes: number): string {
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
}

export function formatRelativeDate(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}
