import "server-only";
import sql from "@/shared/lib/db";
import type { KillcountStatsRow } from "@/shared/lib/dbTypes";
import { filterScannerRows } from "@/server/killcountScanner";
import {
  parseKillcountDoc,
  parseRaidDoc,
  parseRecordKind,
  type RecordKind,
  type ScannerKillcountExclusion,
} from "@/server/scanner/record";
import { parseMoscowISOString } from "@/utils/getMoscowISOString";
import { toWindow, withStartTimes } from "./shared";
import type { MissingEndFighter, PendingRecord, RecordQueryRow } from "./types";

export async function getPendingRecords(): Promise<PendingRecord[]> {
  const records = await sql<RecordQueryRow[]>`
    SELECT sr.id, sr.kind, sr.started_at, sr.ended_at, sr.raid, sr.killcount, u.username
    FROM scanner_record sr
    JOIN "user" u ON u.id = sr.user_id
    WHERE sr.status = 'pending' AND sr.killcount IS NOT NULL
    ORDER BY sr.started_at DESC
  `;
  const pending: PendingRecord[] = [];
  for (const record of records) {
    const kind = parseRecordKind(record.kind);
    const doc = parseKillcountDoc(record.killcount);
    const raid = record.raid === null ? null : parseRaidDoc(record.raid);
    const resolved = await filterScannerRows(doc.rows);
    const day =
      kind === "prime"
        ? parseMoscowISOString(record.ended_at).toISOString().slice(0, 10)
        : record.started_at.slice(0, 10);
    const window = toWindow(
      record.started_at,
      record.ended_at,
      record.username,
    );
    if (!window) continue;
    const missingEnd = doc.excluded.flatMap(toMissingEnd);
    pending.push({
      id: record.id,
      kind,
      day,
      window,
      inRaid: raid
        ? raid.members.filter((member) => member.in_guild !== false).length
        : null,
      fighters: withStartTimes(resolved.rows, doc.rows, record.started_at),
      excluded: [
        ...resolved.excluded,
        ...doc.excluded
          .filter(
            (item) =>
              !missingEnd.some((fighter) => fighter.userName === item.name),
          )
          .map((item) => ({ userName: item.name, reason: item.reason })),
      ],
      missingEnd,
      warnings: doc.warnings,
      blockedReason: await blockedReason(kind, day, resolved.rows.length),
    });
  }
  return pending;
}

function toMissingEnd(item: ScannerKillcountExclusion): MissingEndFighter[] {
  if (
    item.startHonor === undefined ||
    item.startKills === undefined ||
    item.startAt === undefined
  ) {
    return [];
  }
  return [
    {
      userName: item.name,
      reason: item.reason,
      startHonor: item.startHonor,
      startKills: item.startKills,
    },
  ];
}

async function blockedReason(
  kind: RecordKind,
  day: string,
  fighters: number,
): Promise<string | null> {
  if (fighters === 0) return "Никто из списка не проходит в киллкаунт";
  if (kind === "agl") return null;
  const [taken] = await sql<Pick<KillcountStatsRow, "id">[]>`
    SELECT id FROM killcount_stats WHERE recorded_at::date = ${day}::date LIMIT 1
  `;
  return taken ? "Киллкаунт за этот день уже добавлен" : null;
}
