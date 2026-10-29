"use client";

import { useClock } from "@/hooks/useClock";
import { Skeleton } from "@/shared/ui";
import CouncilDay from "./CouncilDay";
import type { ScheduleMap } from "./councilModel";

type Props = {
  schedule: ScheduleMap;
};

const MINUTE_MS = 60_000;

export default function CouncilChecklist({ schedule }: Props) {
  const now = useClock(MINUTE_MS, 15_000);

  if (now === null) {
    return <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-xl" />;
  }
  return <CouncilDay now={now} schedule={schedule} />;
}
