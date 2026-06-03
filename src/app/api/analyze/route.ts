import { updateJob } from "@/lib/analysis/jobs";
import { analyzeWithTwelveLabs, generateClaudeAudit, transcribeWithAssemblyAI } from "@/lib/analysis/providers";
import type { TranscriptResult, VisualResult } from "@/lib/analysis/types";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 900;

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export async function POST(request: Request) {
	const formData = await request.formData();
	const file = formData.get("video");
	const jobId = String(formData.get("jobId") || randomUUID());

	if (!(file instanceof File)) {
		updateJob(jobId, "Failed", 100, "Choose a video file before starting the audit.");
		return NextResponse.json({ error: "Choose a video file before starting the audit.", jobId }, { status: 400 });
	}

	if (file.size > MAX_FILE_SIZE) {
		updateJob(jobId, "Failed", 100, "The selected video is larger than the 500MB limit.");
		return NextResponse.json({ error: "The selected video is larger than the 500MB limit.", jobId }, { status: 400 });
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		updateJob(jobId, "Failed", 100, "Upload an MP4, MOV, or WebM video.");
		return NextResponse.json({ error: "Upload an MP4, MOV, or WebM video.", jobId }, { status: 400 });
	}

	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
	const filePath = join(tmpdir(), `${jobId}-${safeName}`);
	let transcript: TranscriptResult | null = null;
	let visuals: VisualResult | null = null;

	try {
		updateJob(jobId, "Uploading video", 10);
		await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

		updateJob(jobId, "Extracting transcript", 30);
		try {
			transcript = await transcribeWithAssemblyAI(filePath);
		} catch (error) {
			transcript = {
				text: "",
				words: [],
				error: error instanceof Error ? error.message : "AssemblyAI transcription failed",
			};
		}

		updateJob(jobId, "Analyzing visuals", 55);
		try {
			visuals = await analyzeWithTwelveLabs(filePath, file.name);
		} catch (error) {
			visuals = {
				text: "",
				error: error instanceof Error ? error.message : "TwelveLabs visual analysis failed",
			};
		}

		updateJob(jobId, "Generating audit", 80);
		const audit = await generateClaudeAudit(transcript, visuals);

		updateJob(jobId, "Complete", 100);
		return NextResponse.json({ jobId, audit, sourceStatus: { transcript, visuals } });
	} catch (error) {
		const message = error instanceof Error ? error.message : "The audit pipeline failed.";
		updateJob(jobId, "Failed", 100, message);
		return NextResponse.json({ error: message, jobId }, { status: 500 });
	} finally {
		await rm(filePath, { force: true }).catch(() => undefined);
	}
}
