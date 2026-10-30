"use client";

import { type ChangeEvent, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/shared/ui";
import { useScannerRecordImport } from "./useScannerRecordImport";

export default function ImportRecordButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isImporting, importRecord } = useScannerRecordImport();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (file) await importRecord(await file.text());
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer"
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
      >
        {isImporting ? <Loader2 className="animate-spin" /> : <Upload />}
        Загрузить файл сканера
      </Button>
    </>
  );
}
