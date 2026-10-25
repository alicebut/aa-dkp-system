import "server-only";
import sql from "@/shared/lib/db";
import { filterScannerRows } from "@/server/killcountScanner";
import {
  parseKillcountDoc,
  type ScannerKillcountRow,
} from "@/server/scanner/record";
import {
  getMoscowISOString,
  parseMoscowISOString,
} from "@/utils/getMoscowISOString";
import type { KillCount } from "@/widgets/killcount/types";
import type {
  KillcountFighter,
  LinkedRaid,
  ScanWindow,
  RaidQueryRow,
  RecordQueryRow,
} from "./types";

const LINK_TOLERANCE_MS = 30 * 60_000;
const LATE_NOTE_MS = 30 * 60_000;

export function toWindow(
  startedAt: string | null,
  endedAt: string | null,
  scannedBy: string | null,
): ScanWindow | null {
  if (!startedAt || !endedAt || !scannedBy) return null;
  return { startedAt, endedAt, scannedBy };
}

export function startTimes(rows: ScannerKillcountRow[]) {
  const byName = new Map<string, string>();
  for (const row of rows) {
    const startAt = getMoscowISOString(new Date(row.startAt));
    for (const name of [row.userName, ...(row.aliases ?? [])]) {
      byName.set(name, startAt);
    }
  }
  return byName;
}

export function withLateNote(
  comment: string | undefined,
  startAt: string | null,
  windowStartedAt: string | null,
) {
  if (!startAt || !windowStartedAt) return comment;
  const lateMs =
    parseMoscowISOString(startAt).getTime() -
    parseMoscowISOString(windowStartedAt).getTime();
  if (lateMs < LATE_NOTE_MS) return comment;
  const note = `начало с ${startAt.slice(11, 16)}`;
  return comment ? `${comment}; ${note}` : note;
}

export function withStartTimes(
  resolved: KillCount[],
  raw: ScannerKillcountRow[],
  windowStartedAt: string,
): KillcountFighter[] {
  const byName = startTimes(raw);
  return resolved.map((row) => {
    const startAt =
      byName.get(row.userName) ??
      row.aliases?.map((alias) => byName.get(alias)).find(Boolean) ??
      null;
    return {
      ...row,
      startAt,
      comment: withLateNote(row.comment, startAt, windowStartedAt),
    };
  });
}

export async function recordFighters(record: RecordQueryRow) {
  const doc = parseKillcountDoc(record.killcount);
  const resolved = await filterScannerRows(doc.rows);
  return withStartTimes(resolved.rows, doc.rows, record.started_at);
}

export function raidSelect(type: string) {
  return sql`
    SELECT
      r.id, r.start_date AS "startDate", to_char(r.start_date, 'HH24:MI') AS time,
      COALESCE((
        SELECT string_agg(b.boss_name, ', ' ORDER BY b.boss_name)
        FROM raid_boss rb JOIN boss b ON b.id = rb.boss_id
        WHERE rb.raid_id = r.id
      ), '') AS boss,
      (SELECT count(*)::int FROM raid_attendance ra WHERE ra.raid_id = r.id) AS people
    FROM raid r
    WHERE r.type = ${type}
  `;
}

export function raidsOfDay(type: string, day: string) {
  return sql<RaidQueryRow[]>`
    ${raidSelect(type)} AND r.start_date::date = ${day}::date
    ORDER BY r.start_date
  `;
}

export function covers(window: ScanWindow | null, startDate: string) {
  if (!window) return false;
  const at = parseMoscowISOString(startDate).getTime();
  return (
    at >=
      parseMoscowISOString(window.startedAt).getTime() - LINK_TOLERANCE_MS &&
    at <= parseMoscowISOString(window.endedAt).getTime()
  );
}

export function linkRaid(
  raid: RaidQueryRow,
  window: ScanWindow | null,
): LinkedRaid {
  return {
    id: raid.id,
    time: raid.time,
    boss: raid.boss,
    people: raid.people,
    isLinked: covers(window, raid.startDate),
  };
}
