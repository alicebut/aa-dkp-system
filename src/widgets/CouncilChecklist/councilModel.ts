import {
  COUNCIL_TASKS,
  type CouncilTask,
  type CouncilTaskTiming,
} from "@/shared/config/councilTasks";
import {
  getMoscowISOString,
  parseMoscowISOString,
} from "@/utils/getMoscowISOString";
import { nextBossSpawn } from "@/widgets/PromoQuests/gameClock";

export type ScheduleMap = Record<string, [string, string][]>;

export type CouncilItem = { task: CouncilTask; times: string[] };

export type CouncilSection = {
  kind: CouncilTaskTiming["kind"];
  title: string;
  items: CouncilItem[];
};

export type TaskMarks = Record<string, number>;

export type GameAlert = { key: string; names: string[]; inMinutes: number };

export const ALERT_BEFORE_MINUTES = 10;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const WEDNESDAY = 3;

const WEEKDAYS = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

export function moscowDayKey(nowMs: number) {
  return getMoscowISOString(new Date(nowMs)).slice(0, 10);
}

export function isPastTime(time: string, nowMs: number) {
  return getMoscowISOString(new Date(nowMs)).slice(11, 16) > time;
}

export function todaySections(
  schedule: ScheduleMap,
  nowMs: number,
): CouncilSection[] {
  const todayEvents = schedule[moscowWeekday(nowMs)] ?? [];
  const scheduled: CouncilItem[] = [];
  const game: CouncilItem[] = [];
  const free: CouncilItem[] = [];

  for (const task of COUNCIL_TASKS) {
    if (task.timing.kind === "schedule") {
      const event = task.timing.event;
      const times = todayEvents
        .filter(([, name]) => name === event)
        .map(([time]) => time);
      if (times.length > 0) scheduled.push({ task, times });
    } else if (task.timing.kind === "game") {
      game.push({ task, times: [] });
    } else {
      free.push({ task, times: [] });
    }
  }

  const sections: CouncilSection[] = [
    { kind: "schedule", title: "Сегодня по расписанию", items: scheduled },
    { kind: "game", title: "По игровому времени", items: game },
    { kind: "free", title: "В любое время", items: free },
  ];
  return sections.filter((section) => section.items.length > 0);
}

export function dueGameAlerts(
  sections: CouncilSection[],
  marks: TaskMarks,
  nowMs: number,
): GameAlert[] {
  const namesByHour = new Map<number, string[]>();
  for (const { task } of sections.flatMap((section) => section.items)) {
    if (task.timing.kind !== "game") continue;
    if (isTaskDone(task, marks)) continue;
    const names = namesByHour.get(task.timing.hour) ?? [];
    namesByHour.set(task.timing.hour, [...names, task.name]);
  }

  const alerts: GameAlert[] = [];
  for (const [hour, names] of namesByHour) {
    const spawn = nextBossSpawn(nowMs, hour);
    if (spawn.inMinutes > ALERT_BEFORE_MINUTES) continue;
    alerts.push({
      key: `${hour}:${Math.round(spawn.at / MINUTE_MS)}`,
      names,
      inMinutes: spawn.inMinutes,
    });
  }
  return alerts;
}

export function isTaskDone(task: CouncilTask, marks: TaskMarks) {
  return (marks[task.id] ?? 0) >= task.times;
}

export function doneLast(items: CouncilItem[], marks: TaskMarks) {
  const pending = items.filter((item) => !isTaskDone(item.task, marks));
  const done = items.filter((item) => isTaskDone(item.task, marks));
  return [...pending, ...done];
}

export function earnedPoints(sections: CouncilSection[], marks: TaskMarks) {
  return sumTasks(sections, (task) => task.points * (marks[task.id] ?? 0));
}

export function maxPoints(sections: CouncilSection[]) {
  return sumTasks(sections, (task) => task.points * task.times);
}

export function nextMeritsReset(nowMs: number) {
  const [year, month] = moscowDayKey(nowMs).split("-").map(Number);
  const thisMonthReset = meritsResetOf(year, month);
  if (nowMs < thisMonthReset) return thisMonthReset;
  if (month === 12) return meritsResetOf(year + 1, 1);
  return meritsResetOf(year, month + 1);
}

export function daysUntil(targetMs: number, nowMs: number) {
  return Math.ceil((targetMs - nowMs) / DAY_MS);
}

export function formatLastMeritsDay(resetMs: number) {
  return new Date(resetMs - DAY_MS).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Moscow",
  });
}

function meritsResetOf(year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month, 0));
  const lastWednesday =
    lastDay.getUTCDate() - ((lastDay.getUTCDay() - WEDNESDAY + 7) % 7);
  const lastWednesdayStart = parseMoscowISOString(
    `${year}-${month}-${lastWednesday}`,
  ).getTime();
  return lastWednesdayStart + DAY_MS;
}

function moscowWeekday(nowMs: number) {
  const [year, month, day] = moscowDayKey(nowMs).split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function sumTasks(
  sections: CouncilSection[],
  pointsOf: (task: CouncilTask) => number,
) {
  return sections
    .flatMap((section) => section.items)
    .reduce((sum, item) => sum + pointsOf(item.task), 0);
}
