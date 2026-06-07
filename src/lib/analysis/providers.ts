import "server-only";

import { readFile } from "node:fs/promises";
import type { AnalysisAudit, TranscriptResult, VisualResult } from "./types";

const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

const CLAUDE_SYSTEM_PROMPT =
	`You are an elite short-form video ad strategist with 10 years of experience auditing TikTok, Instagram Reels, and YouTube Shorts ads that convert. You have analyzed thousands of ads across ecommerce, UGC, SaaS, and direct-response.

You will receive: (1) a transcript with word-level timestamps, and (2) a visual analysis of the video. Your job is to produce a brutally honest, surgically specific audit of this exact video as an ad.

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
- Do NOT make "the video doesn't tell viewers to tap your link in bio" the biggestProblem when the destination is in the bio. Save biggestProblem for the biggest weakness in the ad (weak hook, silence or empty moments, unclear product, missing proof, contradicting the stated goal, no compelling reason to act now).
- Do NOT downgrade readiness purely because the video does not say "link in bio". The platform UI does part of the CTA work. Judge the close on the actual content: is the product clear, is there a reason to act now, is there pricing/value/proof, is there a clear ask. A solid close that simply omits "link in bio" is not enough to push the ad to "needs-work" on its own. Reserve "needs-work" for a close that is genuinely broken (unclear product, no price, no reason to act, abrupt ending with no resolution).

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
LANGUAGE
═══════════════════════════════════════
Write in plain, direct language. Assume the reader is a creator, ecommerce brand owner, or marketer who may not know marketing jargon.
- Never write "dead air" — write "silence", "no audio", or "seconds where nothing happens".
- Never write "creative" as a noun for the ad — write "ad" or "video".
- Never write "trust signals" — write "social proof", "reviews", or "credibility".
- Never write "UGC" — write "creator on camera", "person on camera", or describe what you actually see.
- "hook", "CTA", and "retention" are fine — the target audience knows these.

═══════════════════════════════════════
THE FIX FORMAT (priorityFixes[].fix and editorBrief items)
═══════════════════════════════════════
Every fix is one of two types. Decide which, and write it accordingly:

  • COPY fix — when the fix is WORDS the user can paste directly: a CTA line, an on-screen caption, a spoken hook sentence, a text overlay, a social-proof line. Give the LITERAL text in quotation marks, ready to paste, plus where and when it goes. Example: Add a spoken line at 0:43 — "Follow for the most insane homes in the Pacific Northwest, full listing's in my bio." You wrote the words for them. They do not have to think.

  • EDIT fix — when the fix is a SHOOTING or EDITING action that words can't capture: cut a logo card, move the creator's face into the first frame, speed up a sequence, add a before/after shot, reorder beats. Describe the action precisely with the timestamp. Do NOT dress an editing action up as copy, and do NOT hand vague direction when exact words are possible.

Prefer COPY fixes wherever the problem is language (CTA, hook line, captions, proof text) — that is the highest-value, lowest-effort thing you can give. Use EDIT only when the fix genuinely requires re-shooting or re-cutting.

═══════════════════════════════════════
READINESS — the only verdict that matters
═══════════════════════════════════════
We do NOT score ads 0–100. Numerical scores read as false precision: a 72 vs. a 74 carries no real meaning. Instead, assign the ad to ONE of three readiness tiers based on the ad as a whole:

  • "needs-work" — the ad has at least one fundamental gap that will sink performance for the detected goal. Examples: hook fails entirely (logo card open with no hook, silence or nothing happening past 0:03, product never shown clearly), no understandable CTA or close, audio unintelligible, contradicts the stated goal. Reserve this tier for ads that genuinely should NOT be published until reworked.
  • "almost-there" — the ad is publishable but capped by one or two real, fixable weaknesses (weak open, buried CTA, missing proof, slow middle, unclear price). The product and angle land; the close or the hook or one supporting beat is what's holding it back. This is where most ads honestly land.
  • "ready-to-publish" — strong end-to-end execution for the goal. Hook lands fast, product is clear, close is clean. Any remaining notes are polish, not blockers. The creator can publish this as-is.

Be honest. Do not push everything to "almost-there" out of politeness — if the hook is broken AND the CTA is missing AND the product is unclear, call it "needs-work". Equally, do not call something "almost-there" just because you can squint and find polish; a strong ad with one tiny note is "ready-to-publish".

═══════════════════════════════════════
READINESS AFTER FIXES — predict the tier, not a number
═══════════════════════════════════════
readinessAfterFixes is your prediction of the tier the ad will land in IF the creator applies the priorityFixes you listed. Rules:
  • readinessAfterFixes must be >= readiness in tier ordering ("needs-work" < "almost-there" < "ready-to-publish"). It cannot regress.
  • The jump must come ONLY from the fixes you listed. Do not predict gains from changes you didn't recommend.
  • Realistic jumps: same tier (polish-only fixes), or one tier up (the listed fixes resolve the gap that was holding the ad back). A two-tier jump from "needs-work" straight to "ready-to-publish" almost never happens — three quick fixes rarely turn a broken ad into a great one. If you find yourself reaching for that, your readiness call was wrong: it was probably "almost-there" to start with, OR the fixes you listed are not enough.
  • If priorityFixes is empty or only minor polish, readinessAfterFixes equals readiness.

═══════════════════════════════════════
FIELD-BY-FIELD REQUIREMENTS
═══════════════════════════════════════
- goal.detected — 2–4 words for a pill ("Drive conversions", "Drive signups", "Drive views"). goal.reasoning must cite a quote or moment that revealed the goal.
- biggestProblem — ONE headline sentence, 8–14 words, no ellipsis, no quotes inside it. It must read like a verdict: "Your ad never tells viewers where to buy this home." Put the evidence and detail in bottomLine, NOT here.
- bottomLine — one sentence, max 160 chars, naming what holds the ad back (or why it's already strong), grounded in a specific moment.
- dimensions.*.reasoning — 2–3 sentences EACH, every one anchored (timestamp or quote). The hook reasoning must reference the actual first 3 seconds. The cta reasoning must say what the CTA was, the exact words if spoken, and when. No numeric scores — just the anchored reasoning.
- priorityFixes — return 0–3, ordered by impact. Each needs: timestamp, a specific title, an impact tier, whyItMatters (anchored), fix (COPY or EDIT per the rules above), whyThisWorks (anchored), and a short editorTask. Only include a fix backed by real evidence. If the ad is strong with no real weakness, return 0–1 light polish items and do NOT invent problems to fill the UI.
- editorBrief — estimatedEditTime (e.g. "~15 min of edits" or "No urgent edits") and one item per priorityFix: a short, paste-ready editor task with its timestamp.
- topIssues — may be empty for excellent ads. If present, each must be real, timestamped, specific, with an expectedImpact naming the metric likely to move.
- whatsWorking — 2–3 items when the ad has genuine strengths. Each must name something the creator genuinely did well, anchored to a timestamp. Title is 3–6 words. Description is 1–2 sentences explaining why it works and why to keep doing it. Do not invent strengths. If the ad is "needs-work" or has no real standout moments, return an empty array — do not force positives that are not there.
- viralTriggers — present[] and missing[] for short-form ad mechanics (face-in-frame, social proof, urgency, before/after, pattern interrupt, strong CTA, authority). biggestOpportunity = the single highest-leverage missing trigger with a concrete, video-specific way to add it.
- platformFit — write a note for TikTok, Instagram Reels, and YouTube Shorts that says something true about THIS cut on THAT platform, not boilerplate. No scores.
- rewriteSuggestions.hook — a rewritten first-3-seconds script using this video's actual product and angle. rewriteSuggestions.cta — a rewritten CTA for this goal. Both must be literal, paste-ready lines, not descriptions.
- finalRecommendation.headline — e.g. "Publish after these 3 fixes." or "Ready to publish."
- finalRecommendation.expectedResult — one or two sentences predicting what the listed fixes will unlock for the detected goal. Not a guarantee; not a number.
- finalRecommendation.keep[] and finalRecommendation.change[] — short category tags (NOT sentences). Pick ONLY from this closed vocabulary, and only those that are genuinely true for this ad: Hook, CTA, Proof, Demo, Delivery, Captions, Pacing, Trust, Storyline, Sound. "keep" lists categories the creator already nails (mirror the strengths in whatsWorking). "change" lists categories the priorityFixes touch. A tag may appear in keep OR change, never both. Both arrays are typically 1–4 items; either may be empty when nothing meaningful fits.
- summary — 1–2 sentences, max 190 chars: what to fix first and whether it is ready to publish.

═══════════════════════════════════════
JSON SCHEMA — match exactly
═══════════════════════════════════════
{
  "goal": {
    "detected": "string — 2-4 word goal label, e.g. 'Drive conversions', 'Drive signups', 'Drive views'",
    "confidence": number 0-100,
    "reasoning": "string — 1-2 sentences, anchored to a quote or moment"
  },
  "readiness": "needs-work | almost-there | ready-to-publish",
  "readinessAfterFixes": "needs-work | almost-there | ready-to-publish",
  "biggestProblem": "string — one headline sentence, 8-14 words, no ellipsis, no quotes",
  "bottomLine": "string — one sentence, max 160 chars, anchored",
  "dimensions": {
    "hook":       { "reasoning": "string — 2-3 sentences, anchored, references actual first 3 seconds" },
    "retention":  { "reasoning": "string — 2-3 sentences, anchored" },
    "clarity":    { "reasoning": "string — 2-3 sentences, anchored" },
    "trust":      { "reasoning": "string — 2-3 sentences, anchored" },
    "cta":        { "reasoning": "string — 2-3 sentences, anchored, names exact CTA words and when" },
    "conversion": { "reasoning": "string — 2-3 sentences, anchored" }
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
  "whatsWorking": [
    {
      "timestamp": "string e.g. '0:03+' or '0:10–0:18' or 'throughout'",
      "title": "string — 3–6 words naming what is working",
      "description": "string — 1–2 sentences explaining why it works and why to keep doing it, anchored to the transcript or visual analysis"
    }
  ],
  "viralTriggers": {
    "present": ["string"],
    "missing": ["string"],
    "biggestOpportunity": "string — single highest-leverage missing trigger with concrete, video-specific implementation"
  },
  "platformFit": {
    "tiktok":         { "notes": "string — true about THIS cut on TikTok" },
    "instagramReels": { "notes": "string — true about THIS cut on Reels" },
    "youtubeShorts":  { "notes": "string — true about THIS cut on Shorts" }
  },
  "rewriteSuggestions": {
    "hook": "string — literal paste-ready first-3-seconds script using this video's product and angle",
    "cta":  "string — literal paste-ready CTA line for this goal"
  },
  "finalRecommendation": {
    "headline": "string — e.g. 'Publish after these 3 fixes.' or 'Ready to publish.'",
    "expectedResult": "string — prediction, not a guarantee",
    "keep":   ["string — short category tag from the closed vocabulary; empty array if nothing meaningful"],
    "change": ["string — short category tag from the closed vocabulary; empty array if nothing meaningful"]
  },
  "summary": "string — 1-2 sentences, max 190 chars"
}

═══════════════════════════════════════
OUTPUT
═══════════════════════════════════════
Return ONLY valid JSON matching the schema exactly — no markdown, no fences, no commentary before or after. Every text field uses the same language as the transcript. Be brutally specific. If you ever feel yourself writing advice that could apply to any video, stop and replace it with the exact moment, word, or frame from this one.`;

const PEGASUS_PROMPT =
	"Analyze this video as a short-form ad. For EVERY observation include an approximate timestamp or range (e.g. 0:00–0:03). Cover, with timestamps: exactly what is on screen in the first 3 seconds; every text overlay and when it appears and disappears; each scene change and the pacing between cuts; whether and how a product is shown; any CTA shown or spoken and when; who delivers it (UGC creator on camera, voiceover, animation, b-roll); the emotional tone and how it shifts; and any social-proof or authority elements. Be concrete and visual — name what you actually see at each moment.";

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

export async function transcribeWithAssemblyAI(
	filePath: string,
	onProgress?: ProgressCallback,
): Promise<TranscriptResult> {
	const apiKey = requireEnv("ASSEMBLYAI_API_KEY");
	const video = await readFile(filePath);
	onProgress?.(0.05, "Preparing audio");
	const upload = await fetchJson<{ upload_url: string }>("https://api.assemblyai.com/v2/upload", {
		method: "POST",
		headers: {
			authorization: apiKey,
			"content-type": "application/octet-stream",
		},
		body: video,
	});

	onProgress?.(0.18, "Starting audio transcript");
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
		onProgress?.(Math.min(0.94, 0.22 + attempt / 180 * 0.72), "Transcribing audio");
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
			throw new Error(transcript.error ?? "Audio transcription failed");
		}

		await sleep(3000);
	}

	throw new Error("Audio transcription timed out");
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
		throw new Error("Visual analysis setup failed");
	}

	return indexId;
}

export async function analyzeWithTwelveLabs(
	filePath: string,
	fileName: string,
	onProgress?: ProgressCallback,
): Promise<VisualResult> {
	const apiKey = requireEnv("TWELVELABS_API_KEY");
	const indexId = await getOrCreateTwelveLabsIndex(apiKey);
	onProgress?.(0.05, "Preparing video");
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
		throw new Error("Visual analysis setup failed");
	}

	onProgress?.(0.15, "Reading scenes");
	let videoId = task.video_id ?? "";

	for (let attempt = 0; attempt < 240; attempt += 1) {
		onProgress?.(Math.min(0.88, 0.18 + attempt / 240 * 0.7), "Reading scenes");
		const status = await fetchJson<{
			status: string;
			video_id?: string;
			error?: string;
		}>(`https://api.twelvelabs.io/v1.3/tasks/${taskId}`, {
			headers: { "x-api-key": apiKey },
		});

		if (status.status === "ready") {
			videoId = status.video_id ?? "";
			onProgress?.(0.9, "Visual analysis ready");
			break;
		}

		if (["failed", "error"].includes(status.status)) {
			throw new Error(status.error ?? "Visual analysis failed");
		}

		await sleep(5000);
	}

	if (!videoId) {
		throw new Error("Visual analysis timed out");
	}

	onProgress?.(0.94, "Analyzing visuals");
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
		throw new Error("Audit generation returned an invalid response");
	}

	const audit = JSON.parse(candidate.slice(start, end + 1)) as AnalysisAudit;
	assertAuditShape(audit);
	return audit;
}

const READINESS_TIERS = ["needs-work", "almost-there", "ready-to-publish"] as const;

function assertAuditShape(audit: AnalysisAudit) {
	const missing: string[] = [];
	if (typeof audit?.summary !== "string" || !audit.summary) missing.push("summary");
	if (!READINESS_TIERS.includes(audit?.readiness as (typeof READINESS_TIERS)[number])) missing.push("readiness");
	if (typeof audit?.goal?.detected !== "string") missing.push("goal.detected");
	if (!audit?.dimensions) missing.push("dimensions");
	else {
		for (const key of ["hook", "retention", "clarity", "trust", "cta", "conversion"] as const) {
			if (typeof audit.dimensions[key]?.reasoning !== "string") missing.push(`dimensions.${key}.reasoning`);
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

async function callAnthropic(payload: {
	system: string | AnthropicSystemBlock[];
	messages: AnthropicMessage[];
	max_tokens: number;
	thinking?: { type: "adaptive" } | { type: "enabled"; budget_tokens: number };
	output_config?: { effort?: AnthropicEffort };
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
		throw new Error(
			`Audit generation returned no text content. stop_reason=${
				message.stop_reason ?? "unknown"
			} content_types=${contentTypes}`,
		);
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

	const userPrompt =
		`Create the audit from the available data. If transcript or visual analysis is missing, explicitly account for that limitation in the JSON reasoning.

Return the audit as a JSON object directly matching the schema in the system prompt. Do not wrap it — output the audit fields at the top level.

TRANSCRIPT DATA:
${JSON.stringify(transcript ?? { error: "Transcript data unavailable" }, null, 2)}

VISUAL ANALYSIS:
${JSON.stringify(visuals ?? { error: "Visual analysis data unavailable" }, null, 2)}${contextBlock}`;

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
		},
		messages: initialMessages,
	});

	return extractJson(text);
}
