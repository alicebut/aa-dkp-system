import { COUNCIL_FREE_TASKS } from "./councilFreeTasks";

export type CouncilTaskTiming =
  | { kind: "schedule"; event: string }
  | { kind: "game"; hour: number }
  | { kind: "free" };

export type CouncilTask = {
  id: string;
  name: string;
  hint?: string;
  points: number;
  times: number;
  timing: CouncilTaskTiming;
};

export const COUNCIL_GOAL = 3500;

const TIMED_TASKS: CouncilTask[] = [
  {
    id: "kraken",
    name: "Кракен",
    points: 10,
    times: 1,
    timing: { kind: "schedule", event: "Кракен" },
  },
  {
    id: "leviathan",
    name: "Левиафан",
    points: 20,
    times: 1,
    timing: { kind: "schedule", event: "Левиафан" },
  },
  {
    id: "xanatos",
    name: "Ксанатос",
    points: 20,
    times: 1,
    timing: { kind: "schedule", event: "Ксанатос" },
  },
  {
    id: "kalidis",
    name: "Калидис",
    points: 20,
    times: 1,
    timing: { kind: "schedule", event: "Калидис" },
  },
  {
    id: "antallon",
    name: "Анталлон",
    points: 10,
    times: 1,
    timing: { kind: "schedule", event: "Анталлон" },
  },
  {
    id: "delphinad",
    name: "Летучий Дельфиец",
    points: 10,
    times: 1,
    timing: { kind: "schedule", event: "Летучий Дельфиец" },
  },
  {
    id: "siege",
    name: "Осада",
    hint: "50 за победу, 30 за поражение",
    points: 50,
    times: 1,
    timing: { kind: "schedule", event: "Осада замка" },
  },
  {
    id: "lorea",
    name: "Лорея",
    hint: "Солнечные поля, появляется вместе с Гленном",
    points: 7,
    times: 1,
    timing: { kind: "game", hour: 6 },
  },
  {
    id: "glenn",
    name: "Гленн",
    hint: "Солнечные поля, появляется вместе с Лореей",
    points: 7,
    times: 1,
    timing: { kind: "game", hour: 6 },
  },
  {
    id: "ashyara",
    name: "Ашьяра Змееволосая",
    hint: "Бездна",
    points: 7,
    times: 1,
    timing: { kind: "game", hour: 6 },
  },
  {
    id: "blood-army-elite",
    name: "Кровавая армия: «Элитный легион»",
    hint: "Квест 6-го этапа наступления",
    points: 10,
    times: 1,
    timing: { kind: "game", hour: 18 },
  },
  {
    id: "blood-army-leader",
    name: "Кровавая армия: «Предводитель демонов»",
    hint: "Квест 7-го этапа, Эшнака Перерожденный в Солнечных полях",
    points: 10,
    times: 1,
    timing: { kind: "game", hour: 18 },
  },
  {
    id: "ghost-legion-gates",
    name: "Призрачный легион: «Потусторонние врата»",
    hint: "Квест 6-го этапа",
    points: 10,
    times: 1,
    timing: { kind: "game", hour: 0 },
  },
  {
    id: "ghost-legion-leader",
    name: "Призрачный легион: «Призрачный предводитель»",
    hint: "Квест 7-го этапа, призрак Эшнаки",
    points: 10,
    times: 1,
    timing: { kind: "game", hour: 0 },
  },
];

export const COUNCIL_TASKS = [...TIMED_TASKS, ...COUNCIL_FREE_TASKS];
