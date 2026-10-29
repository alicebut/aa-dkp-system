"use server";

import * as v from "valibot";
import sql from "@/shared/lib/db";
import type { ScannerRecordRow } from "@/shared/lib/dbTypes";
import { KILLCOUNT_EDITOR_TAGS } from "@/server/killcountEditors";
import { parseKillcountDoc } from "@/server/scanner/record";
import { parseMoscowISOString } from "@/utils/getMoscowISOString";
import { lookupClassSpecs } from "@/widgets/profile/archetype/classCombinations";
import ensurePrivilieges from "./ensurePrivilieges";

const COUNTER = v.pipe(v.number(), v.integer(), v.minValue(0));

const END_VALUES_SCHEMA = v.object({
  recordId: v.pipe(v.number(), v.integer()),
  userName: v.pipe(v.string(), v.minLength(1)),
  playerClass: v.pipe(v.string(), v.maxLength(64)),
  endHonor: COUNTER,
  endKills: COUNTER,
});

type RecordQueryRow = Pick<ScannerRecordRow, "ended_at" | "killcount">;

export async function fillScannerRecordEnd(
  input: v.InferInput<typeof END_VALUES_SCHEMA>,
) {
  await ensurePrivilieges(KILLCOUNT_EDITOR_TAGS);
  const { recordId, userName, playerClass, endHonor, endKills } = v.parse(
    END_VALUES_SCHEMA,
    input,
  );

  await sql.begin(async (tx) => {
    const [record] = await tx<RecordQueryRow[]>`
      SELECT ended_at, killcount
      FROM scanner_record
      WHERE id = ${recordId} AND status = 'pending' AND killcount IS NOT NULL
      FOR UPDATE
    `;
    if (!record) throw new Error("Запись уже обработана");

    const doc = parseKillcountDoc(record.killcount);
    const missing = doc.excluded.find((item) => item.name === userName);
    if (
      !missing ||
      missing.startHonor === undefined ||
      missing.startKills === undefined ||
      missing.startAt === undefined
    ) {
      throw new Error("У этого игрока нет данных на начало");
    }
    if (endHonor < missing.startHonor || endKills < missing.startKills) {
      throw new Error("На конец не может быть меньше, чем на начало");
    }

    const row = {
      id: Math.max(0, ...doc.rows.map((fighter) => fighter.id)) + 1,
      userName,
      playerClass,
      specs: lookupClassSpecs(playerClass) ?? undefined,
      startHonor: missing.startHonor,
      endHonor,
      startKills: missing.startKills,
      endKills,
      startAt: missing.startAt,
      endAt: parseMoscowISOString(record.ended_at).toISOString(),
    };
    const killcount = {
      ...doc,
      rows: [...doc.rows, row],
      excluded: doc.excluded.filter((item) => item !== missing),
    };
    await tx`
      UPDATE scanner_record SET killcount = ${tx.json(killcount)}
      WHERE id = ${recordId}
    `;
  });
}
