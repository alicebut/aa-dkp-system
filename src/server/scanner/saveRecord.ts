import "server-only";
import sql from "@/shared/lib/db";
import type { ScannerRecordRow } from "@/shared/lib/dbTypes";
import { moscowNaive, type ScannerRecordDoc } from "./record";

type SavedRow = Pick<ScannerRecordRow, "id" | "status">;

export type SavedScannerRecord = SavedRow & { duplicate: boolean };

// Повтор с тем же client_id (сканер переотправил запись или её загрузили
// на сайте вручную) ничего не дублирует.
export async function saveScannerRecord(
  record: ScannerRecordDoc,
  userId: number,
): Promise<SavedScannerRecord> {
  const [inserted] = await sql<SavedRow[]>`
    INSERT INTO scanner_record (client_id, user_id, kind, started_at, ended_at, raid, killcount)
    VALUES (
      ${record.client_id},
      ${userId},
      ${record.kind},
      ${moscowNaive(record.started_at)},
      ${moscowNaive(record.ended_at)},
      ${record.raid === null ? null : sql.json(record.raid)},
      ${record.killcount === null ? null : sql.json(record.killcount)}
    )
    ON CONFLICT (client_id) DO NOTHING
    RETURNING id, status
  `;
  if (inserted) return { ...inserted, duplicate: false };

  const [existing] = await sql<SavedRow[]>`
    SELECT id, status FROM scanner_record WHERE client_id = ${record.client_id}
  `;
  return { ...existing, duplicate: true };
}
