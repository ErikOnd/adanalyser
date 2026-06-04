import { type JobStep, updateJob } from "@/lib/analysis/jobs";
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

type PipelinePhase = JobStep["id"] | "failed";

function buildSteps(phase: PipelinePhase): JobStep[] {
	const order: JobStep["id"][] = ["media", "transcript", "visuals", "audit"];
	const activeIndex = phase === "failed" ? -1 : order.indexOf(phase);

	const steps: JobStep[] = [
		{ id: "media", label: "Preparing video", source: "Secure upload", status: "pending" },
		{ id: "transcript", label: "Transcribing audio", source: "Audio AI", status: "pending" },
		{ id: "visuals", label: "Understanding visuals", source: "Visual AI", status: "pending" },
		{ id: "audit", label: "Scoring & writing fixes", source: "Creative AI", status: "pending" },
	];

	return steps.map((step, index) => {
		if (phase === "failed" && index === 0) return { ...step, status: "error" };
		if (activeIndex === -1) return step;
		if (index < activeIndex) return { ...step, status: "complete" };
		if (index === activeIndex) return { ...step, status: "active" };
		return step;
	});
}

function buildParallelSteps(mediaDone: boolean, transcriptProgress: number, visualProgress: number): JobStep[] {
	return [
		{ id: "media", label: "Preparing video", source: "Secure upload", status: mediaDone ? "complete" : "active" },
		{
			id: "transcript",
			label: "Transcribing audio",
			source: "Audio AI",
			status: transcriptProgress >= 1 ? "complete" : "active",
		},
		{
			id: "visuals",
			label: "Understanding visuals",
			source: "Visual AI",
			status: visualProgress >= 1 ? "complete" : "active",
		},
		{ id: "audit", label: "Scoring & writing fixes", source: "Creative AI", status: "pending" },
	];
}

function clampPercent(value: number) {
	return Math.max(0, Math.min(100, Math.round(value)));
}

export async function POST(request: Request) {
	const formData = await request.formData();
	const file = formData.get("video");
	const jobId = String(formData.get("jobId") || randomUUID());

	const readField = (name: string) => {
		const value = formData.get(name);
		return typeof value === "string" ? value.trim().slice(0, 500) : "";
	};

	const userContext = {
		platform: readField("platform"),
		destination: readField("destination"),
		goal: readField("goal"),
		notes: readField("notes"),
	};

	if (!(file instanceof File)) {
		updateJob(jobId, "Failed", 100, "Choose a video file before starting the audit.", { steps: buildSteps("failed") });
		return NextResponse.json({ error: "Choose a video file before starting the audit.", jobId }, { status: 400 });
	}

	if (file.size > MAX_FILE_SIZE) {
		updateJob(jobId, "Failed", 100, "The selected video is larger than the 500MB limit.", { steps: buildSteps("failed") });
		return NextResponse.json({ error: "The selected video is larger than the 500MB limit.", jobId }, { status: 400 });
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		updateJob(jobId, "Failed", 100, "Upload an MP4, MOV, or WebM video.", { steps: buildSteps("failed") });
		return NextResponse.json({ error: "Upload an MP4, MOV, or WebM video.", jobId }, { status: 400 });
	}

	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
	const filePath = join(tmpdir(), `${jobId}-${safeName}`);
	let transcript: TranscriptResult | null = null;
	let visuals: VisualResult | null = null;
	let transcriptProgress = 0;
	let visualProgress = 0;

	try {
		updateJob(jobId, "Preparing video", 6, undefined, { steps: buildSteps("media") });
		await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

		const updateParallelProgress = (stage: string) => {
			const progress = clampPercent(15 + transcriptProgress * 30 + visualProgress * 40);
			updateJob(jobId, stage, progress, undefined, {
				steps: buildParallelSteps(true, transcriptProgress, visualProgress),
			});
		};

		updateJob(jobId, "Reading transcript and visuals", 15, undefined, {
			steps: buildParallelSteps(true, transcriptProgress, visualProgress),
		});

		const transcriptPromise = transcribeWithAssemblyAI(filePath, (progress) => {
			transcriptProgress = progress;
			updateParallelProgress("Transcribing audio");
		})
			.catch((): TranscriptResult => {
				transcriptProgress = 1;
				updateParallelProgress("Audio transcript unavailable");
				return {
					text: "",
					words: [],
					error: "Audio analysis failed",
				};
			});
		const visualsPromise = analyzeWithTwelveLabs(filePath, file.name, (progress) => {
			visualProgress = progress;
			updateParallelProgress("Understanding visuals");
		})
			.catch((): VisualResult => {
				visualProgress = 1;
				updateParallelProgress("Visual analysis unavailable");
				return {
					text: "",
					error: "Visual analysis failed",
				};
			});

		[transcript, visuals] = await Promise.all([transcriptPromise, visualsPromise]);

		updateJob(jobId, "Scoring & writing fixes", 90, undefined, { steps: buildSteps("audit") });
		const audit = await generateClaudeAudit(transcript, visuals, userContext);

		updateJob(jobId, "Complete", 100, undefined, {
			steps: buildSteps("audit").map((step) => ({ ...step, status: "complete" })),
		});
		return NextResponse.json({ jobId, audit, sourceStatus: { transcript, visuals } });
	} catch (error) {
		const internalMessage = error instanceof Error ? error.message : "The audit pipeline failed.";
		const message = "The audit could not be completed. Please try again with another video.";
		console.error("[analyze] pipeline failed", { jobId, message: internalMessage, error });
		updateJob(jobId, "Failed", 100, message, {
			steps: (buildParallelSteps(true, transcriptProgress, visualProgress)).map((step) => (
				step.status === "active" ? { ...step, status: "error" } : step
			)),
		});
		return NextResponse.json({ error: message, jobId }, { status: 500 });
	} finally {
		await rm(filePath, { force: true }).catch(() => undefined);
	}
}
