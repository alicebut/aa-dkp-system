import { errorMessage } from "@/shared/lib/errorMessage";
import { Label, Skeleton, Switch } from "@/shared/ui";
import CouncilProgressCard from "./CouncilProgressCard";
import {
  ALERT_BEFORE_MINUTES,
  doneLast,
  earnedPoints,
  maxPoints,
  moscowDayKey,
  todaySections,
  type ScheduleMap,
} from "./councilModel";
import TaskRow from "./TaskRow";
import { useCouncilProgress } from "./useCouncilProgress";
import { useCouncilSound } from "./useCouncilSound";
import { useGameTimeAlerts } from "./useGameTimeAlerts";

type Props = {
  now: number;
  schedule: ScheduleMap;
};

export default function CouncilDay({ now, schedule }: Props) {
  const progress = useCouncilProgress(moscowDayKey(now));
  const { isSoundOn, setSoundOn } = useCouncilSound();
  const sections = todaySections(schedule, now);
  useGameTimeAlerts(
    sections,
    progress.marks,
    now,
    isSoundOn && progress.isLoaded,
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-5 text-sm">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Путь в совет</h1>
      </header>
      <DayLoadState isLoaded={progress.isLoaded} error={progress.error} />
      {progress.isLoaded && (
        <CouncilProgressCard
          now={now}
          merits={progress.merits}
          earnedToday={earnedPoints(sections, progress.marks)}
          maxToday={maxPoints(sections)}
          onMeritsChange={progress.setMerits}
        />
      )}
      {progress.isLoaded &&
        sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{section.title}</h2>
              {section.kind === "game" && (
                <SoundSwitch isOn={isSoundOn} onChange={setSoundOn} />
              )}
            </div>
            <ul className="flex flex-col gap-2">
              {doneLast(section.items, progress.marks).map((item) => (
                <TaskRow
                  key={item.task.id}
                  item={item}
                  now={now}
                  count={progress.marks[item.task.id] ?? 0}
                  onCountChange={(count) =>
                    progress.setTaskCount(item.task.id, count)
                  }
                />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function DayLoadState({
  isLoaded,
  error,
}: {
  isLoaded: boolean;
  error: unknown;
}) {
  if (isLoaded) return null;
  if (error) {
    return (
      <p className="text-destructive">
        {errorMessage(error, "Не удалось загрузить чеклист")}
      </p>
    );
  }
  return <Skeleton className="h-96 w-full rounded-xl" />;
}

function SoundSwitch({
  isOn,
  onChange,
}: {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
}) {
  return (
    <Label className="cursor-pointer text-xs font-normal text-muted-foreground">
      <Switch checked={isOn} onCheckedChange={onChange} />
      Звук за {ALERT_BEFORE_MINUTES} минут, пока страница открыта
    </Label>
  );
}
