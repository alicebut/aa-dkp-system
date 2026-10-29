import { Clock, Moon } from "lucide-react";
import { cn } from "@/shared/lib/tw-merge";
import {
  formatCountdown,
  formatGameHour,
  formatMoscowTime,
  nextBossSpawn,
} from "@/widgets/PromoQuests/gameClock";
import { isPastTime, type CouncilItem } from "./councilModel";

type Props = {
  item: CouncilItem;
  now: number;
};

const TIMING_CLASS =
  "flex flex-wrap items-center gap-x-1.5 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0";

export default function TaskTiming({ item, now }: Props) {
  const { timing } = item.task;

  if (timing.kind === "game") {
    const spawn = nextBossSpawn(now, timing.hour);
    return (
      <span
        className={cn(TIMING_CLASS, "text-sky-700 dark:text-sky-400")}
        title="Игровые сутки длятся 4 часа, событие повторяется каждые 4 часа"
      >
        <Moon />
        {formatGameHour(timing.hour)} по игровому: через{" "}
        {formatCountdown(spawn.inMinutes)}, в {formatMoscowTime(spawn.at)} МСК
      </span>
    );
  }

  if (timing.kind === "schedule") {
    return (
      <span className={cn(TIMING_CLASS, "text-amber-700 dark:text-amber-400")}>
        <Clock />
        {item.times.map((time) => (
          <span
            key={time}
            className={cn(isPastTime(time, now) && "line-through opacity-60")}
          >
            {time}
          </span>
        ))}
        МСК
      </span>
    );
  }

  return null;
}
