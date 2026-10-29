"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  getCouncilDay,
  setCouncilMerits,
  setCouncilTaskCount,
} from "@/actions/councilChecklist";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useLiveChanges } from "@/hooks/useLiveChanges";
import { errorMessage } from "@/shared/lib/errorMessage";
import type { TaskMarks } from "./councilModel";

export function useCouncilProgress(todayKey: string) {
  const day = useAsyncData(todayKey, getCouncilDay);
  const [savingMarks, setSavingMarks] = useState<TaskMarks>({});
  useLiveChanges(["council"], day.reload);

  const setTaskCount = async (taskId: string, count: number) => {
    setSavingMarks((current) => ({ ...current, [taskId]: count }));
    try {
      await setCouncilTaskCount(taskId, count);
      await day.reload();
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось сохранить отметку"));
    } finally {
      setSavingMarks((current) => withoutSaved(current, taskId, count));
    }
  };

  const setMerits = async (merits: number | null) => {
    try {
      await setCouncilMerits(merits);
      await day.reload();
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось сохранить заслуги"));
    }
  };

  return {
    marks: { ...day.data?.marks, ...savingMarks },
    merits: day.data?.merits ?? null,
    isLoaded: day.data !== undefined,
    error: day.error,
    setTaskCount,
    setMerits,
  };
}

function withoutSaved(marks: TaskMarks, taskId: string, count: number) {
  if (marks[taskId] !== count) return marks;
  const rest = { ...marks };
  delete rest[taskId];
  return rest;
}
