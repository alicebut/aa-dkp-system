import type { PendingRecord } from "@/server/killcountEntries/types";
import MissingStartRow from "./MissingStartRow";

type Props = {
  record: PendingRecord;
};

export default function MissingStartList({ record }: Props) {
  if (record.missingStart.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300/70 bg-background/60 p-3 dark:border-amber-500/30">
      <div>
        <h3 className="text-sm font-semibold">Нет данных на начало</h3>
        <p className="text-xs text-muted-foreground">
          Сканер не снял начало этих игроков. Введи честь и убийства на начало и
          конец вручную — они попадут в киллкаунт.
        </p>
      </div>
      {record.missingStart.map((fighter) => (
        <MissingStartRow
          key={fighter.userName}
          recordId={record.id}
          fighter={fighter}
        />
      ))}
    </div>
  );
}
