"use server";

import * as v from "valibot";
import sql from "@/shared/lib/db";
import type { ScannerRecordRow, UserRow } from "@/shared/lib/dbTypes";
import { KILLCOUNT_EDITOR_TAGS } from "@/server/killcountEditors";
import { notifyKillCountAdded } from "@/server/killcountNotify";
import { filterScannerRows } from "@/server/killcountScanner";
import { RAID_EDITOR_TAGS } from "@/server/raidLinks";
import {
  parseKillcountDoc,
  parseRaidDoc,
  parseRecordKind,
  recordIssueMessage,
  SCANNER_RECORD_SCHEMA,
  type ScannerRaidDoc,
} from "@/server/scanner/record";
import {
  saveScannerRecord,
  type SavedScannerRecord,
} from "@/server/scanner/saveRecord";
import { parseMoscowISOString } from "@/utils/getMoscowISOString";
import ensurePrivilieges from "./ensurePrivilieges";
import { getSessionUserId } from "./getSessionUserId";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PRIME_EVENT_ID = 1;

export type ScannerRaidRecord = {
  id: number;
  kind: "prime" | "agl";
  startedAt: string;
  endedAt: string;
  scannedBy: string;
  memberCount: number;
  raid: ScannerRaidDoc;
};

type RecordQueryRow = Pick<
  ScannerRecordRow,
  "id" | "kind" | "started_at" | "ended_at" | "raid"
> &
  Pick<UserRow, "username">;

type PendingQueryRow = Pick<
  ScannerRecordRow,
  "id" | "kind" | "ended_at" | "killcount"
>;

export async function getScannerRaidRecords(
  day: string,
): Promise<ScannerRaidRecord[]> {
  await ensurePrivilieges(RAID_EDITOR_TAGS);
  if (!DAY_PATTERN.test(day)) throw new Error("Некорректная дата");

  const rows = await sql<RecordQueryRow[]>`
    SELECT sr.id, sr.kind, sr.started_at, sr.ended_at, sr.raid, u.username
    FROM scanner_record sr
    JOIN "user" u ON u.id = sr.user_id
    WHERE sr.started_at::date = ${day}::date
      AND sr.status <> 'dismissed'
      AND sr.raid IS NOT NULL
    ORDER BY sr.started_at
  `;
  return rows.map((row) => {
    const raid = parseRaidDoc(row.raid);
    return {
      id: row.id,
      kind: parseRecordKind(row.kind),
      startedAt: row.started_at,
      endedAt: row.ended_at,
      scannedBy: row.username,
      memberCount: raid.members.filter((member) => member.in_guild !== false)
        .length,
      raid,
    };
  });
}

export async function publishScannerRecord(recordId: number) {
  await ensurePrivilieges(KILLCOUNT_EDITOR_TAGS);
  const userId = await getSessionUserId();
  if (userId === null) throw new Error("Нужно войти на сайт");

  const [record] = await sql<PendingQueryRow[]>`
    SELECT id, kind, ended_at, killcount
    FROM scanner_record
    WHERE id = ${recordId} AND status = 'pending' AND killcount IS NOT NULL
  `;
  if (!record) throw new Error("Запись уже обработана");

  if (parseRecordKind(record.kind) === "agl") {
    await markPublished(recordId, userId);
    return;
  }

  const recordedAt = parseMoscowISOString(record.ended_at).toISOString();
  const day = recordedAt.slice(0, 10);
  const { rows } = await filterScannerRows(
    parseKillcountDoc(record.killcount).rows,
  );
  if (rows.length === 0) {
    throw new Error("В записи нет бойцов, которых можно опубликовать");
  }

  await sql.begin(async (tx) => {
    const [taken] = await tx<{ id: number }[]>`
      SELECT id FROM killcount_stats WHERE recorded_at::date = ${day}::date LIMIT 1
    `;
    if (taken) {
      throw new Error("Киллкаунт за этот день уже добавлен");
    }
    await tx`
      INSERT INTO killcount_stats ${tx(
        rows.map((row) => ({
          user_id: row.userId ?? null,
          event_id: PRIME_EVENT_ID,
          class: row.playerClass,
          start_honor: row.startHonor,
          end_honor: row.endHonor,
          start_kills: row.startKills,
          end_kills: row.endKills,
          recorded_at: recordedAt,
          comment: row.comment ?? "",
          scanner_record_id: recordId,
        })),
      )}
    `;
    await tx`
      UPDATE scanner_record
      SET status = 'published', published_at = now(), published_by = ${userId}
      WHERE id = ${recordId}
    `;
  });
  await notifyKillCountAdded(day);
}

export async function importScannerRecord(
  json: string,
): Promise<SavedScannerRecord> {
  await ensurePrivilieges(KILLCOUNT_EDITOR_TAGS);
  const userId = await getSessionUserId();
  if (userId === null) throw new Error("Нужно войти на сайт");

  let body: unknown;
  try {
    body = JSON.parse(json);
  } catch {
    throw new Error("Это не файл записи сканера");
  }
  const parsed = v.safeParse(SCANNER_RECORD_SCHEMA, body);
  if (!parsed.success) throw new Error(recordIssueMessage(parsed.issues[0]));
  return saveScannerRecord(parsed.output, userId);
}

export async function dismissScannerRecord(recordId: number) {
  await ensurePrivilieges(KILLCOUNT_EDITOR_TAGS);
  await sql`
    UPDATE scanner_record SET status = 'dismissed'
    WHERE id = ${recordId} AND status = 'pending'
  `;
}

async function markPublished(recordId: number, userId: number) {
  await sql`
    UPDATE scanner_record
    SET status = 'published', published_at = now(), published_by = ${userId}
    WHERE id = ${recordId}
  `;
}
