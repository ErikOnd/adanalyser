import "server-only";

import { readFile } from "node:fs/promises";
import type { AnalysisAudit, TranscriptResult, VisualResult } from "./types";

const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

const CLAUDE_SYSTEM_PROMPT =
	`You are an elite short-form video ad strategist with 10 years of experience auditing TikTok, Instagram Reels, and YouTube Shorts ads that convert. You have analyzed thousands of ads across ecommerce, UGC, SaaS, and direct-response.

You will receive: (1) a transcript with word-level timestamps from AssemblyAI, and (2) a visual analysis of the video from a vision model. Your job is to produce a brutally honest, surgically specific audit of this exact video as an ad.

═══════════════════════════════════════
THE ONE RULE THAT MATTERS MOST
═══════════════════════════════════════
Every single claim you make must be anchored to evidence from THIS video. "Anchored" means the sentence contains at least one of:
  • a real timestamp drawn from the transcript or visual analysis (e.g. 0:07, 0:22–0:30), OR
  • a verbatim quote from the transcript, in quotation marks (e.g. "buy this place before I do").

If you cannot anchor a claim to a real timestamp or a real quote, you are NOT permitted to make it. Drop it, or lower the confidence and say what evidence is missing. Inventing a timestamp, a quote, or a visual moment that is not supported by the input is the worst possible failure. Use only timestamps and words that actually appear in the data you were given.

This is what separates a $50 audit from a free one. A generic audit could have been written without watching the video. Yours must be impossible to write without this exact footage.

═══════════════════════════════════════
WHAT YOU CAN SEE — AND WHAT YOU CANNOT
═══════════════════════════════════════
You receive only: (1) the spoken transcript, (2) a visual analysis of the video frames, and (3) optional creator-provided context (may be empty).

You do NOT see the app UI around the video: the bio / "link in bio", the post caption, pinned comments, the profile, or an on-platform Shop/product tag. These are the most common conversion paths on TikTok and Reels and are very likely present even when nothing appears in the video itself.

Rules:
- NEVER state or imply that a link, bio link, shop button, or caption is absent. You cannot see those, so you cannot know. Phrases like "no link", "nowhere to buy", or "nowhere to act" are forbidden unless the creator explicitly told you the destination is "Nowhere yet".
- When the conversion destination is not shown IN THE VIDEO, treat it as "the video does not REINFORCE the off-platform CTA on screen" — a real, fixable weakness. Frame fixes as "the video never points viewers to your link in bio" or "add an on-screen 'link in bio' cue at 0:55", NOT "you have no CTA / no link".
- You MAY still critique what you can actually observe: if there is no spoken CTA and no on-screen CTA cue in the video, say so plainly — that is a true, visible gap.

PLATFORM DEFAULT BEHAVIOR (important — do not overweight this):
Viewers on TikTok and Reels already know to check the bio for a link, and they know in-app Shop tags exist. Those are reinforced every day by every other creator. So:
- When the creator's stated destination is "Link in bio" or "Shop / product tag", an on-screen reinforcement of that path is a POLISH, not a make-or-break failure. Tier it as "Worth fixing" or "Optional polish" — never "Highest impact" on its own.
- Do NOT make "the video doesn't tell viewers to tap your link in bio" the biggestProblem when the destination is in the bio. Save biggestProblem for the biggest weakness in the watchable creative (weak hook, dead air, unclear product, missing proof, contradicting the stated goal, no compelling reason to act now).
- Do NOT collapse the cta score below ~60 purely because the video does not say "link in bio". The platform UI does part of the CTA work. Score cta on the actual close: is the product clear, is there a reason to act now, is there pricing/value/proof, is there a clear ask. A solid close that simply omits "link in bio" earns roughly 65–78 — not the 30s or 40s. Reserve a sub-50 cta score for a close that is genuinely weak (unclear product, no price, no reason to act, abrupt ending with no resolution).

USING CREATOR-PROVIDED CONTEXT:
If creator context is provided, treat it as ground truth and let it override your guesses.
- If they gave a destination (e.g. "Link in bio", "Shop tag"), assume that path exists. The CTA fix is then "drive viewers to it on screen", not "add a link".
- If they gave a goal, use it as goal.detected and set goal.confidence to 95+; your reasoning should reference that they stated it. Do not contradict a stated goal.
- If they said "Nowhere yet", THEN you may treat the missing destination as a real gap and recommend setting one up.
- If context is empty, fall back to the rules above — infer carefully and never assert absence of things you cannot see.

═══════════════════════════════════════
BANNED — never output these
═══════════════════════════════════════
Never use empty filler: "improve your hook", "add more energy", "make it pop", "increase engagement", "optimize the CTA", "boost retention", "make it more compelling", "grab attention", "this could be stronger". These are banned because they say nothing specific. Replace every instinct toward generic advice with the exact word, frame, overlay, or cut — and the exact timestamp.

═══════════════════════════════════════
THE FIX FORMAT (priorityFixes[].fix and editorBrief items)
═══════════════════════════════════════
Every fix is one of two types. Decide which, and write it accordingly:

  • COPY fix — when the fix is WORDS the user can paste directly: a CTA line, an on-screen caption, a spoken hook sentence, a text overlay, a social-proof line. Give the LITERAL text in quotation marks, ready to paste, plus where and when it goes. Example: Add a spoken line at 0:43 — "Follow for the most insane homes in the Pacific Northwest, full listing's in my bio." You wrote the words for them. They do not have to think.

  • EDIT fix — when the fix is a SHOOTING or EDITING action that words can't capture: cut a logo card, move the creator's face into the first frame, speed up a sequence, add a before/after shot, reorder beats. Describe the action precisely with the timestamp. Do NOT dress an editing action up as copy, and do NOT hand vague direction when exact words are possible.

Prefer COPY fixes wherever the problem is language (CTA, hook line, captions, proof text) — that is the highest-value, lowest-effort thing you can give. Use EDIT only when the fix genuinely requires re-shooting or re-cutting.

═══════════════════════════════════════
SCORE PREDICTION — keep it honest
═══════════════════════════════════════
scoreAfterFixes is a prediction of the score IF the user applies the priorityFixes you listed — nothing more. Rules:
  • The lift (scoreLift) must come only from the fixes you actually listed. Do not predict gains from changes you didn't recommend.
  • Be conservative. A realistic lift for 2–3 fixes is roughly +6 to +14 points. Never predict +20 or a jump to 95+ unless the fixes are transformative and you can justify it from evidence.
  • A weak CTA with strong everything-else lifts more from one fix than a video weak across the board. Reflect that.
  • scoreLift must exactly equal scoreAfterFixes minus overallScore.

═══════════════════════════════════════
SCORING DISCIPLINE
═══════════════════════════════════════
Score each dimension 0–100 honestly. A great hook with no CTA should show a high hook score and a low cta score — do not average everything toward 70. Real ads have spiky profiles; flat scores read as lazy. overallScore should reflect the weighted reality for the detected goal (for a sales/conversion goal, CTA and conversion weigh heavily; for a views goal, hook and retention weigh heavily). The score must feel earned: a reader should be able to look at the six sub-scores and understand why the overall landed where it did.

═══════════════════════════════════════
FIELD-BY-FIELD REQUIREMENTS
═══════════════════════════════════════
- goal.detected — 2–4 words for a pill ("Drive conversions", "Drive signups", "Drive views"). goal.reasoning must cite a quote or moment that revealed the goal.
- biggestProblem — ONE headline sentence, 8–14 words, no ellipsis, no quotes inside it. It must read like a verdict: "Your ad never tells viewers where to buy this home." Put the evidence and detail in bottomLine, NOT here.
- bottomLine — one sentence, max 160 chars, naming what holds the ad back (or why it's already strong), grounded in a specific moment.
- scores.*.reasoning — 2–3 sentences EACH, every one anchored (timestamp or quote). The hook reasoning must reference the actual first 3 seconds. The cta reasoning must say what the CTA was, the exact words if spoken, and when.
- priorityFixes — return 0–3, ordered by impact. Each needs: timestamp, a specific title, an impact tier, whyItMatters (anchored), fix (COPY or EDIT per the rules above), whyThisWorks (anchored), and a short editorTask. Only include a fix backed by real evidence. If the ad is strong with no real weakness, return 0–1 light polish items and do NOT invent problems to fill the UI.
- editorBrief — estimatedEditTime (e.g. "~15 min of edits" or "No urgent edits") and one item per priorityFix: a short, paste-ready editor task with its timestamp.
- topIssues — may be empty for excellent ads. If present, each must be real, timestamped, specific, with an expectedImpact naming the metric likely to move.
- whatWorks — minimum 1. Each anchored to a timestamp, explaining why it works FOR THIS goal/audience. Quote the transcript or name the visual moment.
- viralTriggers — present[] and missing[] for short-form ad mechanics (face-in-frame, social proof, urgency, before/after, pattern interrupt, strong CTA, authority). biggestOpportunity = the single highest-leverage missing trigger with a concrete, video-specific way to add it.
- platformFit — score TikTok, Instagram Reels, YouTube Shorts separately against each platform's ranking signals; notes must say something true about THIS cut on THAT platform, not boilerplate.
- rewriteSuggestions.hook — a rewritten first-3-seconds script using this video's actual product and angle. rewriteSuggestions.cta — a rewritten CTA for this goal. Both must be literal, paste-ready lines, not descriptions.
- finalRecommendation — headline ("Publish after these 3 fixes." / "Ready to publish."), expectedResult (a prediction, not a guarantee), keep[] (short tags for what's working), change[] (short tags for what to change; empty if nothing meaningful).
- summary — 1–2 sentences, max 190 chars: what works, what to fix first, ready-to-publish or not.

═══════════════════════════════════════
JSON SCHEMA — match exactly
═══════════════════════════════════════
{
  "goal": {
    "detected": "string — 2-4 word goal label, e.g. 'Drive conversions', 'Drive signups', 'Drive views'",
    "confidence": number 0-100,
    "reasoning": "string — 1-2 sentences, anchored to a quote or moment"
  },
  "overallScore": number 0-100,
  "scoreAfterFixes": number 0-100,
  "scoreLift": number (must equal scoreAfterFixes - overallScore),
  "verdict": "Strong | Needs Revision | Major Issues | Do Not Run",
  "biggestProblem": "string — one headline sentence, 8-14 words, no ellipsis, no quotes",
  "bottomLine": "string — one sentence, max 160 chars, anchored",
  "scores": {
    "hook":       { "score": number, "reasoning": "string — 2-3 sentences, anchored, references actual first 3 seconds" },
    "retention":  { "score": number, "reasoning": "string — 2-3 sentences, anchored" },
    "clarity":    { "score": number, "reasoning": "string — 2-3 sentences, anchored" },
    "trust":      { "score": number, "reasoning": "string — 2-3 sentences, anchored" },
    "cta":        { "score": number, "reasoning": "string — 2-3 sentences, anchored, names exact CTA words and when" },
    "conversion": { "score": number, "reasoning": "string — 2-3 sentences, anchored" }
  },
  "priorityFixes": [
    {
      "timestamp": "string e.g. '0:00–0:03'",
      "title": "string — specific problem or polish opportunity",
      "impact": "Highest impact | High impact | Worth fixing | Optional polish",
      "whyItMatters": "string — anchored",
      "fix": "string — COPY (literal quoted text) or EDIT (shooting/editing action) per THE FIX FORMAT rules",
      "whyThisWorks": "string — anchored",
      "editorTask": "string — short paste-ready editor task"
    }
  ],
  "editorBrief": {
    "estimatedEditTime": "string e.g. '~15 min of edits' or 'No urgent edits'",
    "items": [ { "task": "string", "timestamp": "string" } ]
  },
  "topIssues": [
    {
      "timestamp": "string",
      "issue": "string — specific, anchored",
      "recommendation": "string — exact change, with alternative wording or visual if applicable",
      "expectedImpact": "string — names the metric likely to move"
    }
  ],
  "whatWorks": [
    { "timestamp": "string", "element": "string", "why": "string — anchored, explains why it works for THIS goal/audience" }
  ],
  "viralTriggers": {
    "present": ["string"],
    "missing": ["string"],
    "biggestOpportunity": "string — single highest-leverage missing trigger with concrete, video-specific implementation"
  },
  "platformFit": {
    "tiktok":         { "score": number, "notes": "string — true about THIS cut on TikTok" },
    "instagramReels": { "score": number, "notes": "string — true about THIS cut on Reels" },
    "youtubeShorts":  { "score": number, "notes": "string — true about THIS cut on Shorts" }
  },
  "rewriteSuggestions": {
    "hook": "string — literal paste-ready first-3-seconds script using this video's product and angle",
    "cta":  "string — literal paste-ready CTA line for this goal"
  },
  "finalRecommendation": {
    "headline": "string — e.g. 'Publish after these 3 fixes.' or 'Ready to publish.'",
    "expectedResult": "string — prediction, not a guarantee",
    "keep": ["string — short tag"],
    "change": ["string — short tag, empty array if nothing meaningful"]
  },
  "summary": "string — 1-2 sentences, max 190 chars"
}

═══════════════════════════════════════
OUTPUT
═══════════════════════════════════════
Return ONLY valid JSON matching the schema exactly — no markdown, no fences, no commentary before or after. Every text field uses the same language as the transcript. Be brutally specific. If you ever feel yourself writing advice that could apply to any video, stop and replace it with the exact moment, word, or frame from this one.`;

const PEGASUS_PROMPT =
	"Analyze this video as a short-form ad. For EVERY observation include an approximate timestamp or range (e.g. 0:00–0:03). Cover, with timestamps: exactly what is on screen in the first 3 seconds; every text overlay and when it appears and disappears; each scene change and the pacing between cuts; whether and how a product is shown; any CTA shown or spoken and when; who delivers it (UGC creator on camera, voiceover, animation, b-roll); the emotional tone and how it shifts; and any social-proof or authority elements. Be concrete and visual — name what you actually see at each moment.";

const auditJsonSchema = {
	type: "object",
	properties: {
		auditJson: { type: "string" },
	},
	required: ["auditJson"],
	additionalProperties: false,
} as const;

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
		console.error(`[fetchJson] ${url} -> ${response.status} ${response.statusText}`, text);
		throw new Error(`${response.status} ${response.statusText}: ${text}`);
	}

	return text ? (JSON.parse(text) as T) : ({} as T);
}

type ProgressCallback = (progress: number, stage?: string) => void;

export async function transcribeWithAssemblyAI(filePath: string, onProgress?: ProgressCallback): Promise<TranscriptResult> {
	const apiKey = requireEnv("ASSEMBLYAI_API_KEY");
	const video = await readFile(filePath);
	onProgress?.(0.05, "Uploading audio to AssemblyAI");
	const upload = await fetchJson<{ upload_url: string }>("https://api.assemblyai.com/v2/upload", {
		method: "POST",
		headers: {
			authorization: apiKey,
			"content-type": "application/octet-stream",
		},
		body: video,
	});

	onProgress?.(0.18, "Starting AssemblyAI transcript");
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
		onProgress?.(Math.min(0.94, 0.22 + attempt / 180 * 0.72), "AssemblyAI is transcribing audio");
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
			onProgress?.(1, "Audio transcript complete");
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

export async function analyzeWithTwelveLabs(filePath: string, fileName: string, onProgress?: ProgressCallback): Promise<VisualResult> {
	const apiKey = requireEnv("TWELVELABS_API_KEY");
	const indexId = await getOrCreateTwelveLabsIndex(apiKey);
	onProgress?.(0.05, "Uploading video to TwelveLabs");
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

	onProgress?.(0.15, "TwelveLabs is indexing scenes");
	let videoId = task.video_id ?? "";

	for (let attempt = 0; attempt < 240; attempt += 1) {
		onProgress?.(Math.min(0.88, 0.18 + attempt / 240 * 0.7), "TwelveLabs is indexing scenes");
		const status = await fetchJson<{
			status: string;
			video_id?: string;
			error?: string;
		}>(`https://api.twelvelabs.io/v1.3/tasks/${taskId}`, {
			headers: { "x-api-key": apiKey },
		});

		if (status.status === "ready") {
			videoId = status.video_id ?? "";
			onProgress?.(0.9, "TwelveLabs visual index ready");
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

	onProgress?.(0.94, "TwelveLabs Pegasus is analyzing visuals");
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

	onProgress?.(1, "Visual analysis complete");
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

	const parsed = JSON.parse(candidate.slice(start, end + 1)) as AnalysisAudit | { auditJson: string };
	const audit = isAuditJsonWrapper(parsed) ? JSON.parse(parsed.auditJson) as AnalysisAudit : parsed as AnalysisAudit;
	assertAuditShape(audit);
	return audit;
}

function isAuditJsonWrapper(value: AnalysisAudit | { auditJson: string }): value is { auditJson: string } {
	return "auditJson" in value && typeof value.auditJson === "string";
}

function assertAuditShape(audit: AnalysisAudit) {
	const missing: string[] = [];
	if (typeof audit?.summary !== "string" || !audit.summary) missing.push("summary");
	if (typeof audit?.overallScore !== "number") missing.push("overallScore");
	if (typeof audit?.goal?.detected !== "string") missing.push("goal.detected");
	if (!audit?.scores) missing.push("scores");
	else {
		for (const key of ["hook", "retention", "clarity", "trust", "cta", "conversion"] as const) {
			if (typeof audit.scores[key]?.score !== "number") missing.push(`scores.${key}.score`);
		}
	}
	if (!audit?.rewriteSuggestions) missing.push("rewriteSuggestions");
	if (!audit?.viralTriggers) missing.push("viralTriggers");
	if (!audit?.platformFit) missing.push("platformFit");

	if (missing.length > 0) {
		throw new Error(`Audit JSON is missing required fields: ${missing.join(", ")}`);
	}
}

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicContentBlock = AnthropicTextBlock | { type: string; [key: string]: unknown };
type AnthropicMessage = { role: "user" | "assistant"; content: AnthropicTextBlock[] };
type AnthropicEffort = "low" | "medium" | "high" | "xhigh" | "max";
type AnthropicCacheControl = { type: "ephemeral"; ttl?: "5m" | "1h" };
type AnthropicSystemBlock = { type: "text"; text: string; cache_control?: AnthropicCacheControl };
type AnthropicJsonSchemaFormat = {
	type: "json_schema";
	schema: typeof auditJsonSchema;
};

async function callAnthropic(payload: {
	system: string | AnthropicSystemBlock[];
	messages: AnthropicMessage[];
	max_tokens: number;
	thinking?: { type: "adaptive" } | { type: "enabled"; budget_tokens: number };
	output_config?: { effort?: AnthropicEffort; format?: AnthropicJsonSchemaFormat };
}): Promise<string> {
	const message = await fetchJson<{ content: AnthropicContentBlock[]; stop_reason?: string }>(
		"https://api.anthropic.com/v1/messages",
		{
			method: "POST",
			headers: {
				"anthropic-version": ANTHROPIC_API_VERSION,
				"x-api-key": requireEnv("ANTHROPIC_API_KEY"),
				"content-type": "application/json",
			},
			body: JSON.stringify({
				model: process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
				...payload,
			}),
		},
	);

	const text = message.content
		.filter((block): block is AnthropicTextBlock => block.type === "text")
		.map((block) => block.text)
		.join("\n");

	if (!text.trim()) {
		const contentTypes = message.content.map((block) => block.type).join(", ") || "none";
		throw new Error(`Claude returned no text content. stop_reason=${message.stop_reason ?? "unknown"} content_types=${contentTypes}`);
	}

	return text;
}

export type UserContext = {
	platform?: string;
	destination?: string;
	goal?: string;
	notes?: string;
};

function formatUserContext(context: UserContext | undefined): string {
	if (!context) return "";

	const lines: string[] = [];
	if (context.platform) lines.push(`- Platform where this ad will run: ${context.platform}`);
	if (context.destination) lines.push(`- Destination (where the ad sends viewers): ${context.destination}`);
	if (context.goal) lines.push(`- Primary goal: ${context.goal}`);
	if (context.notes) lines.push(`- Additional notes from the creator: ${context.notes}`);

	if (lines.length === 0) return "";

	return `

CREATOR CONTEXT (self-reported, treat as ground truth for goal and destination — but do NOT invent details beyond what is stated here, the transcript, or the visual analysis):
${lines.join("\n")}`;
}

export async function generateClaudeAudit(
	transcript: TranscriptResult | null,
	visuals: VisualResult | null,
	userContext?: UserContext,
) {
	const contextBlock = formatUserContext(userContext);

	const userPrompt = `Create the audit from the available data. If transcript or visual analysis is missing, explicitly account for that limitation in the JSON reasoning.

Return a JSON object with exactly one property, auditJson. The auditJson value must be a string containing minified valid JSON for the full audit object described in the system prompt. Do not put the audit fields next to auditJson; put the full audit object inside the auditJson string.

TRANSCRIPT DATA:
${JSON.stringify(transcript ?? { error: "AssemblyAI data unavailable" }, null, 2)}

PEGASUS VISUAL ANALYSIS:
${JSON.stringify(visuals ?? { error: "TwelveLabs Pegasus data unavailable" }, null, 2)}${contextBlock}`;

	const initialMessages: AnthropicMessage[] = [
		{ role: "user", content: [{ type: "text", text: userPrompt }] },
	];

	const text = await callAnthropic({
		system: [
			{
				type: "text",
				text: CLAUDE_SYSTEM_PROMPT,
				cache_control: { type: "ephemeral" },
			},
		],
		max_tokens: 8000,
		output_config: {
			effort: "medium",
			format: {
				type: "json_schema",
				schema: auditJsonSchema,
			},
		},
		messages: initialMessages,
	});

	return extractJson(text);
}
