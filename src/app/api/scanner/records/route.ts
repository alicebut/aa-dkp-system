import { NextResponse } from "next/server";
import * as v from "valibot";
import { getScannerUser } from "@/server/scanner/auth";
import {
  recordIssueMessage,
  SCANNER_RECORD_SCHEMA,
} from "@/server/scanner/record";
import { saveScannerRecord } from "@/server/scanner/saveRecord";

// Сканер присылает запись рейда после «Закончить рейд».
export async function POST(request: Request) {
  const user = await getScannerUser(request);
  if (!user) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body is not JSON" }, { status: 400 });
  }

  const parsed = v.safeParse(SCANNER_RECORD_SCHEMA, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: recordIssueMessage(parsed.issues[0]) },
      { status: 400 },
    );
  }

  return NextResponse.json(await saveScannerRecord(parsed.output, user.id));
}
