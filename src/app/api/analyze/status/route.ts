import { jobs } from "@/lib/analysis/jobs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const jobId = searchParams.get("jobId");

	if (!jobId) {
		return NextResponse.json({ stage: "Waiting for upload", progress: 0 });
	}

	const status = jobs.get(jobId) ?? { stage: "Waiting for upload", progress: 0 };
	return NextResponse.json(status);
}
