import { COUNCIL_GOAL } from "@/shared/config/councilTasks";
import { formatNumber, plural } from "@/shared/lib/format";
import { Label, StatTile, StatUnit } from "@/shared/ui";
import {
  daysUntil,
  formatLastMeritsDay,
  nextMeritsReset,
} from "./councilModel";
import MeritsInput from "./MeritsInput";

type Props = {
  now: number;
  merits: number | null;
  earnedToday: number;
  maxToday: number;
  onMeritsChange: (merits: number | null) => void;
};

export default function CouncilProgressCard({
  now,
  merits,
  earnedToday,
  maxToday,
  onMeritsChange,
}: Props) {
  const remaining = Math.max(COUNCIL_GOAL - (merits ?? 0), 0);
  const percent = Math.min(((merits ?? 0) / COUNCIL_GOAL) * 100, 100);
  const resetAt = nextMeritsReset(now);
  const daysLeft = daysUntil(resetAt, now);
  const perDay = Math.ceil(remaining / daysLeft);

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="council-merits">Сейчас заслуг в игре</Label>
          <MeritsInput
            key={merits}
            id="council-merits"
            merits={merits}
            onSave={onMeritsChange}
          />
        </div>
        <span className="pb-2 text-muted-foreground">
          Для совета нужно {formatNumber(COUNCIL_GOAL)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Осталось до совета">
          {formatNumber(remaining)}
        </StatTile>
        <StatTile
          label="Нужно в день"
          hint={`чтобы успеть, сегодня можно до ${maxToday}`}
        >
          {formatNumber(perDay)}
        </StatTile>
        <StatTile label="Отмечено сегодня">
          {earnedToday}
          <StatUnit>из {maxToday}</StatUnit>
        </StatTile>
        <StatTile
          label="Дней на сбор"
          hint={`последний день — среда, ${formatLastMeritsDay(resetAt)}`}
        >
          {daysLeft}
          <StatUnit>{plural(daysLeft, "день", "дня", "дней")}</StatUnit>
        </StatTile>
      </div>
    </div>
  );
}
