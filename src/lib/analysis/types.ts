export type TranscriptResult = {
	text: string;
	words: Array<{ text: string; start: number; end: number; confidence?: number }>;
	languageCode?: string;
	languageConfidence?: number;
	confidence?: number;
	error?: string;
};

export type VisualResult = {
	text: string;
	error?: string;
};

export type ReadinessTier = "needs-work" | "almost-there" | "ready-to-publish";

export type DimensionInsight = {
	reasoning: string;
};

export type WhatsWorkingItem = {
	timestamp: string;
	title: string;
	description: string;
};

export type TimestampedIssue = {
	timestamp: string;
	issue: string;
	recommendation: string;
	expectedImpact: string;
};

export type PlatformNote = {
	notes: string;
};

export type PriorityFix = {
	timestamp: string;
	title: string;
	impact: "Highest impact" | "High impact" | "Worth fixing" | "Optional polish" | string;
	whyItMatters: string;
	fix: string;
	whyThisWorks: string;
	editorTask: string;
};

export type EditorBriefItem = {
	task: string;
	timestamp: string;
};

export type AnalysisAudit = {
	goal: {
		detected: string;
		confidence: number;
		reasoning: string;
	};
	readiness: ReadinessTier;
	readinessAfterFixes?: ReadinessTier;
	biggestProblem?: string;
	bottomLine?: string;
	dimensions: {
		hook: DimensionInsight;
		retention: DimensionInsight;
		clarity: DimensionInsight;
		trust: DimensionInsight;
		cta: DimensionInsight;
		conversion: DimensionInsight;
	};
	priorityFixes?: PriorityFix[];
	editorBrief?: {
		estimatedEditTime: string;
		items: EditorBriefItem[];
	};
	topIssues: TimestampedIssue[];
	whatsWorking?: WhatsWorkingItem[];
	viralTriggers: {
		present: string[];
		missing: string[];
		biggestOpportunity: string;
	};
	platformFit: {
		tiktok: PlatformNote;
		instagramReels: PlatformNote;
		youtubeShorts: PlatformNote;
	};
	rewriteSuggestions: {
		hook: string;
		cta: string;
	};
	finalRecommendation?: {
		headline: string;
		expectedResult: string;
		keep: string[];
		change: string[];
	};
	summary: string;
};

export type AnalysisResponse = {
	jobId: string;
	audit: AnalysisAudit;
	sourceStatus: {
		transcript: TranscriptResult | null;
		visuals: VisualResult | null;
	};
};
