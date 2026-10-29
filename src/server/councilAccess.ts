import "server-only";
import { cookies } from "next/headers";
import { hasTag } from "@/actions/hasTag";
import { getSessionUser } from "@/shared/lib/session";

export const COUNCIL_CANDIDATE_ID = 48;

export async function canOpenCouncilChecklist() {
  const sessionToken = (await cookies()).get("session_token")?.value ?? "";
  const user = await getSessionUser(sessionToken);
  if (user?.id === COUNCIL_CANDIDATE_ID) return true;
  return hasTag(sessionToken, ["Администратор"]);
}

export async function ensureCouncilAccess() {
  if (!(await canOpenCouncilChecklist())) {
    throw new Error("Нет доступа к чеклисту совета");
  }
}
