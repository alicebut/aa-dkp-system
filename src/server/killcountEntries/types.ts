import type { RaidRow, ScannerRecordRow, UserRow } from "@/shared/lib/dbTypes";
import type { RecordKind } from "@/server/scanner/record";
import type { KillCount, KillCountExclusion } from "@/widgets/killcount/types";

export type KillcountFighter = KillCount & { startAt: string | null };

export type ScanWindow = {
  startedAt: string;
  endedAt: string;
  scannedBy: string;
};

export type LinkedRaid = {
  id: number;
  time: string;
  boss: string;
  people: number;
  isLinked: boolean;
};

export type KillcountEntry = {
  kind: RecordKind;
  key: string;
  day: string;
  window: ScanWindow | null;
  fighters: KillcountFighter[];
  raids: LinkedRaid[];
  canEditRows: boolean;
};

export type AglRecordSummary = {
  id: number;
  totalKills: number;
  fighters: number;
  window: ScanWindow;
};

export type AglItem = {
  key: string;
  day: string;
  time: string;
  boss: string;
  people: number;
  record: AglRecordSummary | null;
};

export type MissingEndFighter = {
  userName: string;
  reason: string;
  startHonor: number;
  startKills: number;
};

export type PendingRecord = {
  id: number;
  kind: RecordKind;
  day: string;
  window: ScanWindow;
  inRaid: number | null;
  fighters: KillcountFighter[];
  excluded: KillCountExclusion[];
  missingEnd: MissingEndFighter[];
  warnings: string[];
  blockedReason: string | null;
};

export type RaidQueryRow = Pick<RaidRow, "id"> & {
  startDate: string;
  time: string;
  boss: string;
  people: number;
};

export type RecordQueryRow = Pick<
  ScannerRecordRow,
  "id" | "kind" | "started_at" | "ended_at" | "raid" | "killcount"
> &
  Pick<UserRow, "username">;
