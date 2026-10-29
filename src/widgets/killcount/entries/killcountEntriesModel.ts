import type {
  AglItem,
  KillcountFighter,
  MissingEndFighter,
  ScanWindow,
} from "@/server/killcountEntries/types";
import { formatDuration, formatNumber, plural } from "@/shared/lib/format";
import { parseMoscowISOString } from "@/utils/getMoscowISOString";
import { honor, kills } from "../ui/killcountModel";

export type EntryKind = "prime" | "agl";

export type KillcountPage = "/kill-counter/current" | "/kill-counter/history";

export type SummaryTile = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
};

export const KIND_LABEL: Record<EntryKind, string> = {
  prime: "Прайм",
  agl: "АГЛ",
};

const MINUTE_MS = 60_000;

export function kindHref(page: KillcountPage, kind: EntryKind) {
  return kind === "prime" ? page : `${page}?kind=agl`;
}

export function aglHref(page: KillcountPage, key: string) {
  return `${page}?kind=agl&record=${key}`;
}

export function timeOf(naive: string) {
  return naive.slice(11, 16);
}

export function windowMinutes(window: ScanWindow) {
  const span =
    parseMoscowISOString(window.endedAt).getTime() -
    parseMoscowISOString(window.startedAt).getTime();
  return Math.max(1, Math.round(span / MINUTE_MS));
}

export function windowText(window: ScanWindow) {
  return `${timeOf(window.startedAt)} – ${timeOf(window.endedAt)} · ${formatDuration(windowMinutes(window))} · записал(а) ${window.scannedBy} сканером`;
}

export function playersText(count: number) {
  return `${count} ${plural(count, "игрок", "игрока", "игроков")}`;
}

export function startValuesText(fighter: MissingEndFighter) {
  return `на начало честь ${formatNumber(fighter.startHonor)}, убийства ${formatNumber(fighter.startKills)}`;
}

export function totalKills(fighters: KillcountFighter[]) {
  return fighters.reduce((sum, fighter) => sum + kills(fighter), 0);
}

export function totalHonor(fighters: KillcountFighter[]) {
  return fighters.reduce((sum, fighter) => sum + honor(fighter), 0);
}

export function aglTiles(items: AglItem[]): SummaryTile[] {
  const scanned = items.filter((item) => item.record);
  const total = scanned.reduce(
    (sum, item) => sum + (item.record?.totalKills ?? 0),
    0,
  );
  return [
    {
      label: "АГЛ со сканером",
      value: String(scanned.length),
      unit: `из ${items.length}`,
    },
    { label: "Всего килов", value: formatNumber(total) },
    {
      label: "В среднем за АГЛ",
      value: scanned.length
        ? formatNumber(Math.round(total / scanned.length))
        : "0",
    },
    {
      label: "Лучший АГЛ",
      value: formatNumber(
        Math.max(0, ...scanned.map((item) => item.record?.totalKills ?? 0)),
      ),
    },
  ];
}
