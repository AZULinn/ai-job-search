import { NextResponse } from "next/server";
import { readJobs, readMeta } from "@/lib/snapshot";

export async function GET() {
  try {
    const jobs = readJobs();
    const meta = readMeta();
    return NextResponse.json({
      ok: true,
      count: jobs.length,
      fetchedAt: meta?.fetchedAt ?? null,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
