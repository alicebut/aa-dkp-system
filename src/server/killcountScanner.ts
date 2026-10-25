import "server-only";
import sql from "@/shared/lib/db";
import type { UserArchetypeRow, UserRow } from "@/shared/lib/dbTypes";
import {
  KILLCOUNT_ROLES,
  resolveKillcountRole,
} from "@/shared/config/killcountRoles";
import type { KillCount, KillCountExclusion } from "@/widgets/killcount/types";

export type ScannerKillCount = {
  rows: KillCount[];
  excluded: KillCountExclusion[];
};

type RoleUserRow = Pick<
  UserRow,
  | "id"
  | "username"
  | "avatar_url"
  | "class"
  | "secondary_class"
  | "tertiary_class"
>;

type ArchetypeQueryRow = Pick<
  UserArchetypeRow,
  | "user_id"
  | "role_slot"
  | "specialization_1"
  | "specialization_2"
  | "specialization_3"
>;

const SCANNER_START_NOTE = /^начало с \d{1,2}:\d{2}$/;

export function stripStartNote(comment: string | null | undefined) {
  if (comment === null || comment === undefined) return undefined;
  return comment
    .split("; ")
    .filter((note) => !SCANNER_START_NOTE.test(note.trim()))
    .join("; ");
}

// Черновик из сканера: оставляет только пользователей сайта на нужных ролях
// (по умолчанию ДД).
// Роль определяется по трём веткам из сканера (слот архетипа), иначе основная.
export async function filterScannerRows(
  rows: KillCount[],
  roles: string[] = KILLCOUNT_ROLES,
): Promise<ScannerKillCount> {
  if (rows.length === 0) return { rows: [], excluded: [] };
  try {
    const users = await sql<RoleUserRow[]>`
      SELECT id, username, avatar_url, class, secondary_class, tertiary_class
      FROM "user"
      WHERE username IN ${sql(rows.flatMap((row) => [row.userName, ...(row.aliases ?? [])]))}
    `;
    const archetypes = users.length
      ? await sql<ArchetypeQueryRow[]>`
          SELECT user_id, role_slot, specialization_1, specialization_2, specialization_3
          FROM user_archetype
          WHERE user_id IN ${sql(users.map((user) => user.id))}
        `
      : [];
    const userByName = new Map(users.map((user) => [user.username, user]));

    const kept: KillCount[] = [];
    const excluded: KillCountExclusion[] = [];
    for (const row of rows) {
      // Сменил ник на прайме: на сайте может быть ещё прежний.
      const user = [row.userName, ...(row.aliases ?? [])]
        .map((name) => userByName.get(name))
        .find(Boolean);
      if (!user) {
        excluded.push({ userName: row.userName, reason: "нет на сайте" });
        continue;
      }
      const { role } = resolveKillcountRole(
        user,
        archetypes.filter((slot) => slot.user_id === user.id),
        row.specs,
      );
      if (!role || !roles.includes(role)) {
        excluded.push({
          userName: row.userName,
          reason: role ? `роль ${role}` : "роль не указана на сайте",
        });
        continue;
      }
      const resolved = {
        ...row,
        role,
        userId: user.id,
        avatarUrl: user.avatar_url,
        comment: stripStartNote(row.comment),
      };
      kept.push(
        user.username === row.userName
          ? resolved
          : {
              ...resolved,
              userName: user.username,
              comment: [resolved.comment, `ник в игре: ${row.userName}`]
                .filter(Boolean)
                .join("; "),
            },
      );
    }
    return { rows: kept, excluded };
  } catch (error) {
    throw new Error("Не удалось проверить список из сканера", { cause: error });
  }
}
