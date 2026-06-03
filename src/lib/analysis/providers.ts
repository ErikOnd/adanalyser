import "server-only";

import { readFile } from "node:fs/promises";
import type { AnalysisAudit, TranscriptResult, VisualResult } from "./types";

const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-8";

const CLAUDE_SYSTEM_PROMPT =
	`You are an elite TikTok and Instagram ad strategist with 10 years of experience analyzing what makes short-form video ads convert. You have audited thousands of ads across ecommerce, SaaS, UGC, and direct response categories.

You will receive a video transcript with word timestamps and a detailed visual analysis. Your job is to produce a brutally honest, highly specific audit of this video as an ad.

CRITICAL: Every insight must be specific to THIS video. Reference exact timestamps, specific words from the transcript, specific visual moments. Never write generic advice. If you say "improve your hook", you must say exactly what word or frame to change and exactly what to replace it with.

Return ONLY valid JSON matching this exact structure:
{
  "goal": {
    "detected": "string — short goal label, ideally 2-4 words like 'Drive conversions', 'Drive signups', or 'Drive views'",
    "confidence": number between 0-100,
    "reasoning": "string — 1-2 sentences explaining how you detected this"
  },
  "overallScore": number between 0-100,
  "scoreAfterFixes": number between 0-100 — realistic predicted score after applying only the recommended fixes,
  "scoreLift": number — scoreAfterFixes minus overallScore,
  "verdict": "string — one of: Strong, Needs Revision, Major Issues, Do Not Run",
  "biggestProblem": "string — one complete short sentence, 8-14 words, no ellipsis, naming the single most important weakness. If the ad is genuinely strong, write the biggest remaining polish opportunity instead.",
  "bottomLine": "string — 1 concise sentence, max 160 characters, explaining what is holding the ad back or why it is already strong.",
  "scores": {
    "hook": { "score": number, "reasoning": "specific 2-3 sentence explanation referencing the actual first 3 seconds" },
    "retention": { "score": number, "reasoning": "specific explanation referencing pacing, scene changes, attention risks in this video" },
    "clarity": { "score": number, "reasoning": "specific explanation of how clearly the offer/product is communicated" },
    "trust": { "score": number, "reasoning": "specific explanation of social proof, demonstrations, authenticity signals present or missing" },
    "cta": { "score": number, "reasoning": "specific explanation of the CTA — what was said/shown, when, how strong" },
    "conversion": { "score": number, "reasoning": "specific prediction of conversion likelihood with reasoning" }
  },
  "priorityFixes": [
    {
      "timestamp": "string e.g. '0:00–0:03'",
      "title": "string — specific problem or polish opportunity",
      "impact": "string — one of: Highest impact, High impact, Worth fixing, Optional polish",
      "whyItMatters": "string — why this exact moment affects performance",
      "fix": "string — exact edit/script/overlay/shot change",
      "whyThisWorks": "string — why the proposed fix should improve the ad",
      "editorTask": "string — short copy-paste task for an editor"
    }
  ],
  "editorBrief": {
    "estimatedEditTime": "string e.g. '~15 min of edits' or 'No urgent edits'",
    "items": [
      { "task": "string — concrete editor task", "timestamp": "string" }
    ]
  },
  "topIssues": [
    {
      "timestamp": "string e.g. '0:00–0:04'",
      "issue": "string — specific problem, not generic",
      "recommendation": "string — exact change to make, with specific alternative wording or visuals if applicable",
      "expectedImpact": "string — what metric this will likely improve and by how much"
    }
  ],
  "whatWorks": [
    {
      "timestamp": "string",
      "element": "string — what is working",
      "why": "string — why this works for this specific goal/audience"
    }
  ],
  "viralTriggers": {
    "present": ["array of strings — viral mechanics detected in this video"],
    "missing": ["array of strings — high-value viral mechanics absent from this video"],
    "biggestOpportunity": "string — single highest-leverage viral trigger to add, with specific implementation idea"
  },
  "platformFit": {
    "tiktok": { "score": number, "notes": "string" },
    "instagramReels": { "score": number, "notes": "string" },
    "youtubeShorts": { "score": number, "notes": "string" }
  },
  "rewriteSuggestions": {
    "hook": "string — rewritten opening hook (first 3 seconds script), specific to this video's product/goal",
    "cta": "string — rewritten CTA, specific to this video's goal"
  },
  "finalRecommendation": {
    "headline": "string — e.g. 'Publish after these 3 fixes.' or 'Ready to publish.'",
    "expectedResult": "string — realistic expected outcome after the fixes, framed as a prediction not a guarantee",
    "keep": ["array of short tags for what to keep"],
    "change": ["array of short tags for what to change; empty if there are no meaningful changes"]
  },
  "summary": "string — 1-2 concise sentences, max 190 characters: what works, what to change first, and whether it is ready to publish"
}

Return 0-3 priorityFixes. Keep goal.detected short enough for a pill UI. Keep biggestProblem short enough for a large headline; it must read like "Your hook opens on a logo instead of the result." Put all explanation, quotes, CTA details, and rationale in bottomLine, whyItMatters, and fix fields, not in biggestProblem. Only include a fix when there is real evidence in the transcript or visual analysis. If the ad is strong and has no major weakness, return 0 or 1 lightweight polish items, keep "change" short or empty, and do not invent problems to fill the layout. Minimum 1 whatWorks item. topIssues can be empty for excellent ads, but if included they must be real, timestamped, and specific. Be brutally specific. No generic advice.`;

const PEGASUS_PROMPT =
	"Analyze this video as a TikTok or Instagram ad. Describe: the first 3 seconds in detail, all text overlays and when they appear, scene changes and pacing, whether a product is shown and how, any CTA (call to action) shown visually or spoken, the presenter (UGC, voiceover, animation, b-roll), emotional tone, and any social proof elements.";

function requireEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is not configured`);
	}

	return value;
}

async function sleep(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	const text = await response.text();

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}: ${text}`);
	}

	return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function transcribeWithAssemblyAI(filePath: string): Promise<TranscriptResult> {
	const apiKey = requireEnv("ASSEMBLYAI_API_KEY");
	const video = await readFile(filePath);
	const upload = await fetchJson<{ upload_url: string }>("https://api.assemblyai.com/v2/upload", {
		method: "POST",
		headers: {
			authorization: apiKey,
			"content-type": "application/octet-stream",
		},
		body: video,
	});

	const submitted = await fetchJson<{ id: string }>("https://api.assemblyai.com/v2/transcript", {
		method: "POST",
		headers: {
			authorization: apiKey,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			audio_url: upload.upload_url,
			language_detection: true,
			speech_models: ["universal-3-pro", "universal-2"],
		}),
	});

	for (let attempt = 0; attempt < 180; attempt += 1) {
		const transcript = await fetchJson<{
			status: string;
			error?: string;
			text?: string;
			words?: TranscriptResult["words"];
			language_code?: string;
			language_confidence?: number;
			confidence?: number;
		}>(`https://api.assemblyai.com/v2/transcript/${submitted.id}`, {
			headers: { authorization: apiKey },
		});

		if (transcript.status === "completed") {
			return {
				text: transcript.text ?? "",
				words: transcript.words ?? [],
				languageCode: transcript.language_code,
				languageConfidence: transcript.language_confidence,
				confidence: transcript.confidence,
			};
		}

		if (transcript.status === "error") {
			throw new Error(transcript.error ?? "AssemblyAI transcription failed");
		}

		await sleep(3000);
	}

	throw new Error("AssemblyAI transcription timed out");
}

async function getOrCreateTwelveLabsIndex(apiKey: string) {
	if (process.env.TWELVELABS_INDEX_ID) {
		return process.env.TWELVELABS_INDEX_ID;
	}

	const index = await fetchJson<{ id?: string; _id?: string; index_id?: string }>(
		"https://api.twelvelabs.io/v1.3/indexes",
		{
			method: "POST",
			headers: {
				"x-api-key": apiKey,
				"content-type": "application/json",
			},
			body: JSON.stringify({
				index_name: `adanalyser-${Date.now()}`,
				models: [
					{
						model_name: "pegasus1.2",
						model_options: ["visual", "audio"],
					},
				],
			}),
		},
	);

	const indexId = index.id ?? index._id ?? index.index_id;

	if (!indexId) {
		throw new Error("TwelveLabs did not return an index id");
	}

	return indexId;
}

export async function analyzeWithTwelveLabs(filePath: string, fileName: string): Promise<VisualResult> {
	const apiKey = requireEnv("TWELVELABS_API_KEY");
	const indexId = await getOrCreateTwelveLabsIndex(apiKey);
	const video = new Blob([await readFile(filePath)]);
	const form = new FormData();

	form.set("index_id", indexId);
	form.set("video_file", video, fileName);
	form.set("language", "en");

	const task = await fetchJson<{ id?: string; _id?: string; task_id?: string; video_id?: string }>(
		"https://api.twelvelabs.io/v1.3/tasks",
		{
			method: "POST",
			headers: { "x-api-key": apiKey },
			body: form,
		},
	);

	const taskId = task.id ?? task._id ?? task.task_id;

	if (!taskId) {
		throw new Error("TwelveLabs did not return a task id");
	}

	let videoId = task.video_id ?? "";

	for (let attempt = 0; attempt < 240; attempt += 1) {
		const status = await fetchJson<{
			status: string;
			video_id?: string;
			error?: string;
		}>(`https://api.twelvelabs.io/v1.3/tasks/${taskId}`, {
			headers: { "x-api-key": apiKey },
		});

		if (status.status === "ready") {
			videoId = status.video_id ?? "";
			break;
		}

		if (["failed", "error"].includes(status.status)) {
			throw new Error(status.error ?? "TwelveLabs indexing failed");
		}

		await sleep(5000);
	}

	if (!videoId) {
		throw new Error("TwelveLabs indexing timed out before returning a video id");
	}

	const generated = await fetchJson<{
		data?: string;
		text?: string;
		result?: string;
	}>("https://api.twelvelabs.io/v1.3/analyze", {
		method: "POST",
		headers: {
			"x-api-key": apiKey,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model_name: "pegasus1.2",
			video_id: videoId,
			prompt: PEGASUS_PROMPT,
			stream: false,
			max_tokens: 4096,
		}),
	});

	return { text: generated.data ?? generated.text ?? generated.result ?? JSON.stringify(generated) };
}

function extractJson(text: string): AnalysisAudit {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	const candidate = fenced?.[1] ?? text;
	const start = candidate.indexOf("{");
	const end = candidate.lastIndexOf("}");

	if (start === -1 || end === -1 || end <= start) {
		throw new Error("Claude response did not contain JSON");
	}

	return JSON.parse(candidate.slice(start, end + 1)) as AnalysisAudit;
}

export async function generateClaudeAudit(transcript: TranscriptResult | null, visuals: VisualResult | null) {
	const message = await fetchJson<{
		content: Array<{ type: "text"; text: string } | { type: string }>;
	}>("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"anthropic-version": ANTHROPIC_API_VERSION,
			"x-api-key": requireEnv("ANTHROPIC_API_KEY"),
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model: process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
			max_tokens: 5000,
			system: CLAUDE_SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text:
								`Create the audit from the available data. If transcript or visual analysis is missing, explicitly account for that limitation in the JSON reasoning.

TRANSCRIPT DATA:
${JSON.stringify(transcript ?? { error: "AssemblyAI data unavailable" }, null, 2)}

PEGASUS VISUAL ANALYSIS:
${JSON.stringify(visuals ?? { error: "TwelveLabs Pegasus data unavailable" }, null, 2)}`,
						},
					],
				},
			],
		}),
	});

	const text = message.content
		.filter((block): block is { type: "text"; text: string } => block.type === "text")
		.map((block) => block.text)
		.join("\n");

	return extractJson(text);
}
