import type { PendingRecord } from "@/server/killcountEntries/types";
import MissingEndRow from "./MissingEndRow";

type Props = {
  record: PendingRecord;
};

export default function MissingEndList({ record }: Props) {
  if (record.missingEnd.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300/70 bg-background/60 p-3 dark:border-amber-500/30">
      <div>
        <h3 className="text-sm font-semibold">Нет данных на конец</h3>
        <p className="text-xs text-muted-foreground">
          Сканер не увидел этих игроков в конце рейда. Спроси у них честь и
          убийства и введи вручную — они попадут в киллкаунт.
        </p>
      </div>
      {record.missingEnd.map((fighter) => (
        <MissingEndRow
          key={fighter.userName}
          recordId={record.id}
          fighter={fighter}
        />
      ))}
    </div>
  );
}
