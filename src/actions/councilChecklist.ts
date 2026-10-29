"use server";

import {
  COUNCIL_CANDIDATE_ID,
  ensureCouncilAccess,
} from "@/server/councilAccess";
import { publishChanges } from "@/server/liveChanges";
import { COUNCIL_TASKS } from "@/shared/config/councilTasks";
import sql from "@/shared/lib/db";
import type { CouncilMarkRow, CouncilProgressRow } from "@/shared/lib/dbTypes";
import {
  moscowDayKey,
  type TaskMarks,
} from "@/widgets/CouncilChecklist/councilModel";

export type CouncilDayData = {
  marks: TaskMarks;
  merits: number | null;
};

type MarkRow = Pick<CouncilMarkRow, "task_id" | "count">;

export async function getCouncilDay(): Promise<CouncilDayData> {
  await ensureCouncilAccess();
  const day = moscowDayKey(Date.now());

  try {
    const [marks, [progress]] = await Promise.all([
      sql<MarkRow[]>`
        SELECT task_id, count FROM council_mark
        WHERE user_id = ${COUNCIL_CANDIDATE_ID} AND day = ${day}
      `,
      sql<Pick<CouncilProgressRow, "merits">[]>`
        SELECT merits FROM council_progress
        WHERE user_id = ${COUNCIL_CANDIDATE_ID}
      `,
    ]);
    return {
      marks: Object.fromEntries(
        marks.map((mark) => [mark.task_id, mark.count]),
      ),
      merits: progress?.merits ?? null,
    };
  } catch (error) {
    console.error("Ошибка при загрузке чеклиста совета:", error);
    throw new Error("Не удалось загрузить чеклист");
  }
}

export async function setCouncilTaskCount(taskId: string, count: number) {
  await ensureCouncilAccess();
  const task = COUNCIL_TASKS.find((councilTask) => councilTask.id === taskId);
  if (!task) throw new Error("Такого задания нет");
  if (!Number.isInteger(count) || count < 0 || count > task.times) {
    throw new Error("Некорректное количество");
  }
  const day = moscowDayKey(Date.now());

  try {
    if (count === 0) {
      await sql`
        DELETE FROM council_mark
        WHERE user_id = ${COUNCIL_CANDIDATE_ID} AND day = ${day}
          AND task_id = ${taskId}
      `;
    } else {
      await sql`
        INSERT INTO council_mark (user_id, day, task_id, count)
        VALUES (${COUNCIL_CANDIDATE_ID}, ${day}, ${taskId}, ${count})
        ON CONFLICT (user_id, day, task_id)
        DO UPDATE SET count = EXCLUDED.count, updated_at = now()
      `;
    }
  } catch (error) {
    console.error("Ошибка при отметке задания совета:", error);
    throw new Error("Не удалось сохранить отметку");
  }
  await publishChanges("council");
}

export async function setCouncilMerits(merits: number | null) {
  await ensureCouncilAccess();
  if (merits !== null && (!Number.isInteger(merits) || merits < 0)) {
    throw new Error("Заслуги должны быть целым числом не меньше нуля");
  }

  try {
    await sql`
      INSERT INTO council_progress (user_id, merits)
      VALUES (${COUNCIL_CANDIDATE_ID}, ${merits})
      ON CONFLICT (user_id)
      DO UPDATE SET merits = EXCLUDED.merits, updated_at = now()
    `;
  } catch (error) {
    console.error("Ошибка при сохранении заслуг совета:", error);
    throw new Error("Не удалось сохранить заслуги");
  }
  await publishChanges("council");
}
