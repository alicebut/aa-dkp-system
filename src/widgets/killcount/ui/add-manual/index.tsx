"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input } from "@/shared/ui";
import { type KillCount, type KillCountExclusion } from "../../types";
import { setKillCountCurrent } from "../../api/current";
import {
  findUnknownKillCountUsers,
  prepareScannerKillCount,
} from "../../api/scanner";
import { useScannerRecordImport } from "../../useScannerRecordImport";
import { KillcountDay } from "../KillcountDay";
import { isScannerRecordJson, parseKillcountJson } from "../killcountModel";
import { DraftNotices } from "./DraftNotices";

type AddManualKillCountProps = {
  onBack: () => void;
  isCanEdit: boolean;
};

export function AddManualKillCount({
  onBack,
  isCanEdit,
}: AddManualKillCountProps) {
  const router = useRouter();
  const [rows, setRows] = useState<KillCount[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const [saving, setSaving] = useState(false);
  // Результат проверки ников хранится вместе с ключом списка, для которого он
  // получен: пока ключ не совпал с текущим, проверка ещё идёт.
  const [checked, setChecked] = useState({
    key: "[]",
    unknown: [] as string[],
  });
  const [excluded, setExcluded] = useState<KillCountExclusion[]>([]);
  const [preparing, setPreparing] = useState(false);
  const prepareSeq = useRef(0);
  const { isImporting, importRecord } = useScannerRecordImport();

  const namesKey = JSON.stringify(rows.map((row) => row.userName));
  const checking = checked.key !== namesKey;
  const unknownNames = checking ? [] : checked.unknown;
  useEffect(() => {
    const names: string[] = JSON.parse(namesKey);
    let ignore = false;
    (names.length ? findUnknownKillCountUsers(names) : Promise.resolve([]))
      .then((unknown) => {
        if (!ignore) setChecked({ key: namesKey, unknown });
      })
      // Проверка — только подсказка: если она не удалась, ошибку покажет сохранение.
      .catch(() => {
        if (!ignore) setChecked({ key: namesKey, unknown: [] });
      });
    return () => {
      ignore = true;
    };
  }, [namesKey]);

  const removeUnknown = () => {
    setRows(rows.filter((row) => !unknownNames.includes(row.userName)));
  };

  // JSON из сканера (есть specs) сначала фильтруется на сервере: только
  // пользователи сайта на ДД-ролях. Обычный JSON вставляется как раньше.
  const applyParsed = (parsed: KillCount[]) => {
    const seq = ++prepareSeq.current;
    if (!parsed.some((row) => Array.isArray(row.specs))) {
      setPreparing(false);
      setExcluded([]);
      setRows(parsed);
      return;
    }
    setPreparing(true);
    setRows([]);
    prepareScannerKillCount(parsed)
      .then((result) => {
        if (seq !== prepareSeq.current) return;
        setRows(result.rows);
        setExcluded(result.excluded);
      })
      .catch((error) => {
        if (seq !== prepareSeq.current) return;
        setExcluded([]);
        toast.error("Не удалось проверить список из сканера", {
          description: error instanceof Error ? error.message : undefined,
        });
      })
      .finally(() => {
        if (seq === prepareSeq.current) setPreparing(false);
      });
  };

  const handleJsonChange = async (value: string) => {
    setJsonInput(value);
    if (isScannerRecordJson(value)) {
      if (await importRecord(value)) onBack();
      return;
    }
    const parsed = parseKillcountJson(value);
    if (parsed) applyParsed(parsed);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setKillCountCurrent(rows);
      toast.success("Киллкаунт сохранён");
      router.refresh();
    } catch (error) {
      toast.error("Не удалось сохранить", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <Button variant="secondary" className="cursor-pointer" onClick={onBack}>
          Назад
        </Button>
        <Input
          // Напрямую вставляет данные в таблицу
          // Временное решение
          placeholder="Вставьте JSON"
          aria-label="JSON киллкаунта"
          value={jsonInput}
          disabled={isImporting}
          onChange={(event) => handleJsonChange(event.currentTarget.value)}
        />
        <Button
          className="cursor-pointer"
          disabled={
            rows.length === 0 ||
            saving ||
            preparing ||
            checking ||
            unknownNames.length > 0
          }
          onClick={handleSave}
        >
          Сохранить
        </Button>
      </div>

      {preparing && (
        <p className="text-sm text-muted-foreground">
          Проверяю список из сканера…
        </p>
      )}

      <DraftNotices
        excluded={excluded}
        unknownNames={unknownNames}
        onRemoveUnknown={removeUnknown}
      />

      <KillcountDay
        data={rows}
        mode="draft"
        isCanEdit={isCanEdit}
        onDraftChange={setRows}
      />
    </div>
  );
}
