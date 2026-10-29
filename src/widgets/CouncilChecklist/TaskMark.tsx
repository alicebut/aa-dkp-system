import { Minus, Plus } from "lucide-react";
import type { CouncilTask } from "@/shared/config/councilTasks";
import { Button, Checkbox } from "@/shared/ui";

type Props = {
  task: CouncilTask;
  count: number;
  onCountChange: (count: number) => void;
};

export default function TaskMark({ task, count, onCountChange }: Props) {
  if (task.times === 1) {
    return (
      <Checkbox
        className="size-6 cursor-pointer"
        aria-label={task.name}
        checked={count > 0}
        onCheckedChange={(checked) => onCountChange(checked === true ? 1 : 0)}
      />
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`${task.name}: убрать`}
        disabled={count === 0}
        onClick={() => onCountChange(count - 1)}
      >
        <Minus />
      </Button>
      <span className="w-10 text-center font-semibold tabular-nums">
        {count}/{task.times}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`${task.name}: добавить`}
        disabled={count >= task.times}
        onClick={() => onCountChange(count + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
