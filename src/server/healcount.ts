import "server-only";
import sql from "@/shared/lib/db";
import { filterScannerRows } from "@/server/killcountScanner";
import {
  linkRaid,
  raidsOfDay,
  toWindow,
  withStartTimes,
} from "@/server/killcountEntries/shared";
import type {
  KillcountEntry,
  KillcountFighter,
  RecordQueryRow,
  ScanWindow,
} from "@/server/killcountEntries/types";
import {
  parseKillcountDoc,
  parseRecordKind,
  type RecordKind,
} from "@/server/scanner/record";
import { getMoscowISOString } from "@/utils/getMoscowISOString";

export type HealcountRecord = {
  id: number;
  kind: RecordKind;
  day: string;
  window: ScanWindow;
  fighters: KillcountFighter[];
};

const HEALCOUNT_VIEWER_IDS = [67, 21];
const HEAL_ROLES = ["Хил"];
const HISTORY_DAYS = 45;
const DAY_MS = 86_400_000;
const RAID_TYPE: Record<RecordKind, string> = { prime: "Прайм", agl: "АГЛ" };

export function canSeeHealcount(userId: number | null) {
  return userId !== null && HEALCOUNT_VIEWER_IDS.includes(userId);
}

export async function getHealcountRecords(): Promise<HealcountRecord[]> {
  const since = getMoscowISOString(
    new Date(Date.now() - HISTORY_DAYS * DAY_MS),
  );
  const records = await sql<RecordQueryRow[]>`
    SELECT sr.id, sr.kind, sr.started_at, sr.ended_at, sr.raid, sr.killcount, u.username
    FROM scanner_record sr
    JOIN "user" u ON u.id = sr.user_id
    WHERE sr.status <> 'dismissed' AND sr.killcount IS NOT NULL
      AND sr.started_at >= ${since}
    ORDER BY sr.started_at DESC
  `;
  const healRecords: HealcountRecord[] = [];
  for (const record of records) {
    const window = toWindow(
      record.started_at,
      record.ended_at,
      record.username,
    );
    if (!window) continue;
    const doc = parseKillcountDoc(record.killcount);
    const heals = await filterScannerRows(doc.rows, HEAL_ROLES);
    healRecords.push({
      id: record.id,
      kind: parseRecordKind(record.kind),
      day: record.started_at.slice(0, 10),
      window,
      fighters: withStartTimes(heals.rows, doc.rows, record.started_at),
    });
  }
  return healRecords;
}

export async function getHealcountEntry(
  record: HealcountRecord,
): Promise<KillcountEntry> {
  const raids = await raidsOfDay(RAID_TYPE[record.kind], record.day);
  return {
    kind: record.kind,
    key: String(record.id),
    day: record.day,
    window: record.window,
    fighters: record.fighters,
    raids: raids
      .map((raid) => linkRaid(raid, record.window))
      .filter((raid) => raid.isLinked),
    canEditRows: false,
  };
}
