import { notFound } from "next/navigation";
import { getWeeklySchedule } from "@/actions/getWeeklySchedule";
import { canOpenCouncilChecklist } from "@/server/councilAccess";
import CouncilChecklist from "@/widgets/CouncilChecklist";

export default async function CouncilPage() {
  if (!(await canOpenCouncilChecklist())) notFound();

  return <CouncilChecklist schedule={await getWeeklySchedule()} />;
}
