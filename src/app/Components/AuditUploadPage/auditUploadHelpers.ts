import type { AnalysisAudit, AnalysisResponse, PriorityFix, ReadinessTier } from "@/lib/analysis/types";
import { READINESS_ORDER, type TranslationFunction } from "./auditUploadTypes";

export function tierRank(tier: ReadinessTier) {
	return READINESS_ORDER.indexOf(tier);
}

export function formatFileSize(bytes: number) {
	const megabytes = bytes / 1024 / 1024;
	return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

export function truncateText(text: string, maxLength: number) {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getShortSummary(audit: AnalysisAudit) {
	const summary = audit.summary ?? "";
	const bottomLine = audit.bottomLine ?? "";
	const source = bottomLine && (!summary || bottomLine.length < summary.length) ? bottomLine : summary;

	if (!source) {
		return "";
	}

	const firstSentence = source.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();

	return truncateText(firstSentence ?? source, 190);
}

export function getCompactGoal(goal: string, t: TranslationFunction) {
	const lowerGoal = goal.toLowerCase();

	if (lowerGoal.includes("conversion") || lowerGoal.includes("lead") || lowerGoal.includes("inquir")) {
		return t("compactGoal.conversions");
	}

	if (lowerGoal.includes("view") || lowerGoal.includes("reach") || lowerGoal.includes("engagement")) {
		return t("compactGoal.views");
	}

	if (lowerGoal.includes("signup") || lowerGoal.includes("sign-up")) {
		return t("compactGoal.signups");
	}

	if (lowerGoal.includes("sale") || lowerGoal.includes("purchase")) {
		return t("compactGoal.sales");
	}

	return truncateText(goal.replace(/\s*\(.+?\)\s*/g, "").split(/[/:—-]/)[0]?.trim() || goal, 30);
}

export function getBiggestProblemHeadline(
	audit: AnalysisAudit,
	priorityFixes: PriorityFix[],
	hasFixes: boolean,
	noFixesFallback: string,
) {
	const fallback = hasFixes ? priorityFixes[0]?.title : noFixesFallback;
	const source = (audit.biggestProblem || fallback || "").trim();

	if (source.length <= 120) {
		return source;
	}

	const fixTitle = priorityFixes[0]?.title?.trim();

	if (fixTitle && fixTitle.length <= 120) {
		return fixTitle;
	}

	const sentence = source.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();

	if (sentence && sentence.length <= 120) {
		return sentence;
	}

	const clause = source
		.replace(/\s*\(.+?\)\s*/g, " ")
		.split(/\s+[—–-]\s+|;\s+/)[0]
		?.trim();

	if (clause && clause.length <= 120) {
		return /[.!?]$/.test(clause) ? clause : `${clause}.`;
	}

	const colonLead = source.split(":")[0]?.trim();

	if (colonLead && colonLead.length >= 16) {
		return /[.!?]$/.test(colonLead) ? colonLead : `${colonLead}.`;
	}

	return fallback;
}

export function isAnalysisResponse(value: unknown): value is AnalysisResponse {
	if (!value || typeof value !== "object" || !("audit" in value)) {
		return false;
	}

	const tier = (value as AnalysisResponse).audit?.readiness;
	return typeof tier === "string" && READINESS_ORDER.includes(tier as ReadinessTier);
}

export function buildFallbackFixes(audit: AnalysisAudit): PriorityFix[] {
	return audit.topIssues.slice(0, 3).map((issue, index) => ({
		editorTask: issue.recommendation,
		fix: issue.recommendation,
		impact: index === 0 ? "Highest impact" : index === 1 ? "High impact" : "Worth fixing",
		timestamp: issue.timestamp,
		title: issue.issue,
		whyItMatters: issue.expectedImpact,
		whyThisWorks: issue.expectedImpact,
	}));
}

export function getReadinessLabel(tier: ReadinessTier, t: TranslationFunction) {
	return t(`readiness.${tier}`);
}

export function getLocalizedError(message: string, t: TranslationFunction) {
	if (message.includes("Choose a video file")) {
		return t("errors.chooseVideo");
	}

	if (message.includes("larger than the 500MB limit")) {
		return t("errors.tooLarge");
	}

	if (message.includes("Upload an MP4, MOV, or WebM video")) {
		return t("errors.unsupportedType");
	}

	if (message.includes("not in the expected format")) {
		return t("errors.unexpectedFormat");
	}

	if (message.includes("could not be completed") || message.includes("analysis failed")) {
		return t("errors.failed");
	}

	return message;
}
