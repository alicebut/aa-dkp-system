import { cn } from "@/shared/lib/tw-merge";
import type { CouncilItem } from "./councilModel";
import TaskMark from "./TaskMark";
import TaskTiming from "./TaskTiming";

type Props = {
  item: CouncilItem;
  now: number;
  count: number;
  onCountChange: (count: number) => void;
};

export default function TaskRow({ item, now, count, onCountChange }: Props) {
  const { task } = item;
  const isDone = count >= task.times;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors",
        isDone && "border-emerald-500/40 bg-emerald-500/5",
      )}
    >
      <span className="grid h-8 min-w-11 shrink-0 place-items-center rounded-lg bg-amber-500/15 px-1.5 text-sm font-bold text-amber-700 tabular-nums dark:text-amber-400">
        +{task.points}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("font-medium", isDone && "text-muted-foreground")}>
          {task.name}
        </span>
        {task.hint && (
          <span className="text-xs text-muted-foreground">{task.hint}</span>
        )}
        <TaskTiming item={item} now={now} />
      </div>
      <TaskMark task={task} count={count} onCountChange={onCountChange} />
    </li>
  );
}
