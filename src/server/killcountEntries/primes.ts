import "server-only";
import sql from "@/shared/lib/db";
import { stripStartNote } from "@/server/killcountScanner";
import { parseKillcountDoc } from "@/server/scanner/record";
import {
  linkRaid,
  raidsOfDay,
  startTimes,
  toWindow,
  withLateNote,
} from "./shared";
import type { KillcountEntry, RecordQueryRow } from "./types";

type FighterQueryRow = {
  id: number;
  userId: number;
  userName: string;
  role: string | null;
  avatarUrl: string | null;
  playerClass: string;
  startHonor: number;
  endHonor: number;
  startKills: number;
  endKills: number;
  comment: string | null;
};

export async function getPrimeDay(day: string): Promise<KillcountEntry> {
  const [rows, [record]] = await Promise.all([
    sql<FighterQueryRow[]>`
      SELECT
        s.id, u.id AS "userId", u.username AS "userName", u.class AS role,
        u.avatar_url AS "avatarUrl", s.class AS "playerClass",
        s.start_honor AS "startHonor", s.end_honor AS "endHonor",
        s.start_kills AS "startKills", s.end_kills AS "endKills", s.comment
      FROM killcount_stats s
      JOIN "user" u ON u.id = s.user_id
      WHERE s.recorded_at::date = ${day}::date
      ORDER BY (s.end_kills - s.start_kills) DESC, (s.end_honor - s.start_honor) DESC
    `,
    sql<RecordQueryRow[]>`
      SELECT sr.id, sr.kind, sr.started_at, sr.ended_at, sr.raid, sr.killcount, u.username
      FROM scanner_record sr
      JOIN "user" u ON u.id = sr.user_id
      WHERE sr.id = (
        SELECT MIN(scanner_record_id) FROM killcount_stats WHERE recorded_at::date = ${day}::date
      )
    `,
  ]);
  const window = record
    ? toWindow(record.started_at, record.ended_at, record.username)
    : null;
  const startAtByName = record
    ? startTimes(parseKillcountDoc(record.killcount).rows)
    : new Map<string, string>();
  const raids = await raidsOfDay("Прайм", day);

  return {
    kind: "prime",
    key: day,
    day,
    window,
    fighters: rows.map((row) => {
      const startAt = startAtByName.get(row.userName) ?? null;
      return {
        id: row.id,
        userId: row.userId,
        userName: row.userName,
        role: row.role,
        avatarUrl: row.avatarUrl,
        playerClass: row.playerClass,
        startHonor: row.startHonor,
        endHonor: row.endHonor,
        startKills: row.startKills,
        endKills: row.endKills,
        comment: withLateNote(
          stripStartNote(row.comment),
          startAt,
          record?.started_at ?? null,
        ),
        startAt,
      };
    }),
    raids: raids.map((raid) => linkRaid(raid, window)),
    canEditRows: true,
  };
}
