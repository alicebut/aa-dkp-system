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

const FIGHTER_VALUES_SCHEMA = v.pipe(
  v.object({
    recordId: v.pipe(v.number(), v.integer()),
    userName: v.pipe(v.string(), v.minLength(1)),
    playerClass: v.pipe(v.string(), v.maxLength(64)),
    startHonor: COUNTER,
    endHonor: COUNTER,
    startKills: COUNTER,
    endKills: COUNTER,
  }),
  v.check(
    (values) =>
      values.endHonor >= values.startHonor &&
      values.endKills >= values.startKills,
    "На конец не может быть меньше, чем на начало",
  ),
);

type RecordQueryRow = Pick<
  ScannerRecordRow,
  "started_at" | "ended_at" | "killcount"
>;

export async function fillScannerRecordValues(
  input: v.InferInput<typeof FIGHTER_VALUES_SCHEMA>,
) {
  await ensurePrivilieges(KILLCOUNT_EDITOR_TAGS);
  const { recordId, userName, playerClass, ...values } = v.parse(
    FIGHTER_VALUES_SCHEMA,
    input,
  );

  await sql.begin(async (tx) => {
    const [record] = await tx<RecordQueryRow[]>`
      SELECT started_at, ended_at, killcount
      FROM scanner_record
      WHERE id = ${recordId} AND status = 'pending' AND killcount IS NOT NULL
      FOR UPDATE
    `;
    if (!record) throw new Error("Запись уже обработана");

    const doc = parseKillcountDoc(record.killcount);
    const missing = doc.excluded.find((item) => item.name === userName);
    if (!missing) throw new Error("Этот игрок уже в киллкаунте");

    const row = {
      id: Math.max(0, ...doc.rows.map((fighter) => fighter.id)) + 1,
      userName,
      playerClass,
      specs: lookupClassSpecs(playerClass) ?? undefined,
      ...values,
      startAt: parseMoscowISOString(record.started_at).toISOString(),
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
