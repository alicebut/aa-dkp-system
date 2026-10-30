import "server-only";
import * as v from "valibot";
import { getMoscowISOString } from "@/utils/getMoscowISOString";

const MAX_RECORD_HOURS = 24;
const HOUR_MS = 3_600_000;

const ISO_TIME = v.pipe(v.string(), v.isoTimestamp());
const COUNTER = v.pipe(v.number(), v.integer(), v.minValue(0));
const NAME = v.pipe(v.string(), v.minLength(1), v.maxLength(64));

const RAID_MEMBER_SCHEMA = v.object({
  name: NAME,
  char_id: v.nullable(v.number()),
  in_guild: v.nullable(v.boolean()),
  seconds: v.pipe(v.number(), v.minValue(0)),
  first_join_at: ISO_TIME,
  intervals: v.array(v.tuple([ISO_TIME, ISO_TIME])),
});

const RAID_DOC_SCHEMA = v.object({
  format: v.literal("corvus-raid/1"),
  started_at: ISO_TIME,
  ended_at: ISO_TIME,
  guild_id: v.nullable(v.number()),
  guild_list_seen: v.boolean(),
  members: v.array(RAID_MEMBER_SCHEMA),
});

const KILLCOUNT_ROW_SCHEMA = v.object({
  id: v.number(),
  userName: NAME,
  playerClass: v.string(),
  specs: v.optional(v.array(v.string())),
  aliases: v.optional(v.array(v.string())),
  startHonor: COUNTER,
  endHonor: COUNTER,
  startKills: COUNTER,
  endKills: COUNTER,
  startAt: ISO_TIME,
  endAt: ISO_TIME,
  comment: v.optional(v.string()),
});

const KILLCOUNT_EXCLUSION_SCHEMA = v.object({
  name: v.string(),
  reason: v.string(),
  startHonor: v.optional(COUNTER),
  startKills: v.optional(COUNTER),
  startAt: v.optional(ISO_TIME),
});

const KILLCOUNT_DOC_SCHEMA = v.object({
  rows: v.array(KILLCOUNT_ROW_SCHEMA),
  excluded: v.array(KILLCOUNT_EXCLUSION_SCHEMA),
  warnings: v.array(v.string()),
});

export const SCANNER_RECORD_SCHEMA = v.pipe(
  v.object({
    format: v.literal("corvus-record/1"),
    client_id: v.pipe(v.string(), v.regex(/^[0-9a-f-]{8,64}$/)),
    kind: v.picklist(["prime", "agl"]),
    started_at: ISO_TIME,
    ended_at: ISO_TIME,
    scanner: v.object({ name: v.string(), version: v.string() }),
    raid: v.nullable(RAID_DOC_SCHEMA),
    killcount: v.nullable(KILLCOUNT_DOC_SCHEMA),
  }),
  v.check((record) => {
    const span = Date.parse(record.ended_at) - Date.parse(record.started_at);
    return span > 0 && span <= MAX_RECORD_HOURS * HOUR_MS;
  }, "Время записи некорректно"),
  v.check(
    (record) => record.raid !== null || record.killcount !== null,
    "В записи нет ни посещения, ни киллкаунта",
  ),
);

export type ScannerRecordDoc = v.InferOutput<typeof SCANNER_RECORD_SCHEMA>;
export type ScannerRaidDoc = v.InferOutput<typeof RAID_DOC_SCHEMA>;
export type ScannerKillcountDoc = v.InferOutput<typeof KILLCOUNT_DOC_SCHEMA>;
export type ScannerKillcountRow = ScannerKillcountDoc["rows"][number];
export type ScannerKillcountExclusion = ScannerKillcountDoc["excluded"][number];
export type RecordKind = ScannerRecordDoc["kind"];

export function recordIssueMessage(
  issue: v.InferIssue<typeof SCANNER_RECORD_SCHEMA>,
): string {
  const path = v.getDotPath(issue) ?? "";
  return `Некорректная запись: ${path} ${issue.message}`.trim();
}

export function parseRecordKind(value: string): RecordKind {
  return v.parse(v.picklist(["prime", "agl"]), value);
}

export function parseRaidDoc(value: unknown): ScannerRaidDoc {
  return v.parse(RAID_DOC_SCHEMA, value);
}

export function parseKillcountDoc(value: unknown): ScannerKillcountDoc {
  return v.parse(KILLCOUNT_DOC_SCHEMA, value);
}

export function moscowNaive(iso: string) {
  return getMoscowISOString(new Date(iso));
}
