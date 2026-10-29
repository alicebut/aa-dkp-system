"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Radar } from "lucide-react";
import { toast } from "sonner";
import {
  dismissScannerRecord,
  publishScannerRecord,
} from "@/actions/scannerRecords";
import type { PendingRecord } from "@/server/killcountEntries/types";
import { errorMessage } from "@/shared/lib/errorMessage";
import { formatNumber } from "@/shared/lib/format";
import { Button } from "@/shared/ui";
import { KillcountDay } from "../ui/KillcountDay";
import { longDate } from "../ui/killcountModel";
import {
  KIND_LABEL,
  playersText,
  timeOf,
  totalKills,
} from "./killcountEntriesModel";
import MissingEndList from "./MissingEndList";

type Props = {
  record: PendingRecord;
};

export default function PendingRecordCard({ record }: Props) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [busy, setBusy] = useState<"publish" | "dismiss" | null>(null);

  const run = async (
    action: "publish" | "dismiss",
    task: () => Promise<void>,
    done: string,
  ) => {
    setBusy(action);
    try {
      await task();
      toast.success(done);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Не получилось"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-label="Запись из сканера"
      className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Radar className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            Из сканера: {KIND_LABEL[record.kind]} за {longDate(record.day)} —
            ждёт проверки
          </h2>
          <p className="mt-0.5 text-sm">
            {formatNumber(totalKills(record.fighters))} килов ·{" "}
            {playersText(record.fighters.length)} ·{" "}
            {timeOf(record.window.startedAt)}–{timeOf(record.window.endedAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            Записал(а) {record.window.scannedBy}
            {record.inRaid !== null && ` · в рейде было ${record.inRaid}`}
            {record.kind === "prime" &&
              " · рейды привяжутся сами, когда секретарь внесёт посещение"}
          </p>
          <Notes record={record} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="cursor-pointer"
            disabled={busy !== null || record.blockedReason !== null}
            onClick={() =>
              run(
                "publish",
                () => publishScannerRecord(record.id),
                "Киллкаунт опубликован",
              )
            }
          >
            {busy === "publish" && <Loader2 className="animate-spin" />}
            Опубликовать
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setIsExpanded((value) => !value)}
          >
            {isExpanded ? "Свернуть" : "Проверить"}
          </Button>
          <Button
            variant="ghost"
            className="cursor-pointer text-muted-foreground"
            disabled={busy !== null}
            onClick={() =>
              run(
                "dismiss",
                () => dismissScannerRecord(record.id),
                "Запись убрана",
              )
            }
          >
            Удалить
          </Button>
        </div>
      </div>
      <MissingEndList record={record} />
      {record.kind === "prime" && (
        <p className="text-xs text-muted-foreground">
          После публикации киллкаунт появится на «Сегодня» и в истории, уйдёт
          сообщение в ВК.
        </p>
      )}
      {isExpanded && (
        <KillcountDay data={record.fighters} mode="saved" isCanEdit={false} />
      )}
    </section>
  );
}

function Notes({ record }: { record: PendingRecord }) {
  return (
    <div className="mt-1 flex flex-col gap-1 text-xs">
      {record.blockedReason && (
        <p className="font-medium text-amber-700 dark:text-amber-400">
          {record.blockedReason}
        </p>
      )}
      {record.warnings.map((warning) => (
        <p key={warning} className="text-amber-700 dark:text-amber-400">
          {warning}
        </p>
      ))}
      {record.excluded.length > 0 && (
        <details className="text-muted-foreground">
          <summary className="cursor-pointer">
            Не вошли: {record.excluded.length} (нет на сайте или не ДД-роль)
          </summary>
          <p className="mt-1">
            {record.excluded
              .map((item) => `${item.userName} — ${item.reason}`)
              .join(" · ")}
          </p>
        </details>
      )}
    </div>
  );
}
