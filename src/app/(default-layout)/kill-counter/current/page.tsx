import { cookies } from "next/headers";
import Link from "next/link";
import { hasTag } from "@/actions/hasTag";
import { KILLCOUNT_EDITOR_TAGS } from "@/server/killcountEditors";
import {
  getAglToday,
  getPendingRecords,
  getPrimeDay,
  getSelectedAglRecord,
} from "@/server/killcountEntries";
import { getMoscowISOString } from "@/utils/getMoscowISOString";
import ImportRecordButton from "@/widgets/killcount/ImportRecordButton";
import AglToday from "@/widgets/killcount/entries/AglToday";
import KindSwitch from "@/widgets/killcount/entries/KindSwitch";
import PendingRecordCard from "@/widgets/killcount/entries/PendingRecordCard";
import PrimeToday from "@/widgets/killcount/entries/PrimeToday";
import { KillcountHeader } from "@/widgets/killcount/ui/KillcountHeader";
import { longDate } from "@/widgets/killcount/ui/killcountModel";

type Props = {
  searchParams: Promise<{ kind?: string; record?: string }>;
};

const SUBTITLE = {
  prime: "кто сколько набил за прайм",
  agl: "киллкаунты АГЛ — для интереса, ни на что не влияют",
};

export default async function KillCounterPage({ searchParams }: Props) {
  const params = await searchParams;
  const kind = params.kind === "agl" ? "agl" : "prime";
  const today = getMoscowISOString(new Date()).slice(0, 10);
  const sessionToken = (await cookies()).get("session_token")?.value ?? "";
  const canEdit = await hasTag(sessionToken, KILLCOUNT_EDITOR_TAGS);
  const [pending, prime, aglItems] = await Promise.all([
    canEdit ? getPendingRecords() : [],
    kind === "prime" ? getPrimeDay(today) : null,
    kind === "agl" ? getAglToday(today) : [],
  ]);
  const selectedAgl = await getSelectedAglRecord(aglItems, params.record);

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 text-sm">
      <KillcountHeader
        subtitle={`Сегодня, ${longDate(today)} · ${SUBTITLE[kind]}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <KindSwitch page="/kill-counter/current" kind={kind} />
          {canEdit && <ImportRecordButton />}
          {canEdit && (
            <Link
              href="/scanner"
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Заполнить сканером: программа и инструкция →
            </Link>
          )}
        </div>
      </KillcountHeader>
      {pending
        .filter((record) => record.kind === kind)
        .map((record) => (
          <PendingRecordCard key={record.id} record={record} />
        ))}
      {prime && <PrimeToday entry={prime} canEdit={canEdit} />}
      {kind === "agl" && <AglToday items={aglItems} selected={selectedAgl} />}
    </div>
  );
}
