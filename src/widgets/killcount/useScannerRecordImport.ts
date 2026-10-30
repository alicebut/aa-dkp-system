import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { importScannerRecord } from "@/actions/scannerRecords";
import { errorMessage } from "@/shared/lib/errorMessage";
import { duplicateRecordMessage } from "./ui/killcountModel";

export function useScannerRecordImport() {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);

  const importRecord = async (json: string) => {
    setIsImporting(true);
    try {
      const saved = await importScannerRecord(json);
      if (saved.duplicate) {
        toast.info(duplicateRecordMessage(saved.status));
      } else {
        toast.success("Запись загружена — проверь и опубликуй");
      }
      router.refresh();
      return true;
    } catch (error) {
      toast.error(errorMessage(error, "Не удалось загрузить запись"));
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  return { isImporting, importRecord };
}
