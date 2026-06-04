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

export type ScoreDetail = {
	score: number;
	reasoning: string;
};

export type TimestampedIssue = {
	timestamp: string;
	issue: string;
	recommendation: string;
	expectedImpact: string;
};

export type PlatformScore = {
	score: number;
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
	overallScore: number;
	scoreAfterFixes?: number;
	scoreLift?: number;
	verdict: "Strong" | "Needs Revision" | "Major Issues" | "Do Not Run" | string;
	biggestProblem?: string;
	bottomLine?: string;
	scores: {
		hook: ScoreDetail;
		retention: ScoreDetail;
		clarity: ScoreDetail;
		trust: ScoreDetail;
		cta: ScoreDetail;
		conversion: ScoreDetail;
	};
	priorityFixes?: PriorityFix[];
	editorBrief?: {
		estimatedEditTime: string;
		items: EditorBriefItem[];
	};
	topIssues: TimestampedIssue[];
	viralTriggers: {
		present: string[];
		missing: string[];
		biggestOpportunity: string;
	};
	platformFit: {
		tiktok: PlatformScore;
		instagramReels: PlatformScore;
		youtubeShorts: PlatformScore;
	};
	rewriteSuggestions: {
		hook: string;
		cta: string;
	};
	finalRecommendation?: {
		headline: string;
		expectedResult: string;
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
