"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  dueGameAlerts,
  type CouncilSection,
  type TaskMarks,
} from "./councilModel";

const ALERT_SOUND = "/images/notification/notification2.wav";
const ALERT_VOLUME = 0.2;

export function useGameTimeAlerts(
  sections: CouncilSection[],
  marks: TaskMarks,
  now: number,
  isSoundOn: boolean,
) {
  const alertedKeys = useRef(new Set<string>());

  useEffect(() => {
    if (!isSoundOn) return;
    for (const alert of dueGameAlerts(sections, marks, now)) {
      if (alertedKeys.current.has(alert.key)) continue;
      alertedKeys.current.add(alert.key);
      toast.info(`${alert.names.join(", ")}: через ${alert.inMinutes} мин`);
      playAlertSound();
    }
  }, [sections, marks, now, isSoundOn]);
}

function playAlertSound() {
  const audio = new Audio(ALERT_SOUND);
  audio.volume = ALERT_VOLUME;
  audio.play().catch((error: unknown) => {
    console.warn("Браузер не дал проиграть звук:", error);
  });
}
