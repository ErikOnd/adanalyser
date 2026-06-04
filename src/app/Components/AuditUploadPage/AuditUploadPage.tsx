"use client";

import { Button } from "@/app/Atoms/Button/Button";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import { AuditSteps } from "@/app/Components/AuditSteps/AuditSteps";
import { UploadDropzone } from "@/app/Components/UploadDropzone/UploadDropzone";
import type { AnalysisAudit, AnalysisResponse, PriorityFix } from "@/lib/analysis/types";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import styles from "./AuditUploadPage.module.scss";

const DESTINATION_OPTIONS = [
	{ icon: "user", key: "linkInBio", value: "Link in bio" },
	{ icon: "arrow", key: "landingPage", value: "Landing page" },
	{ icon: "store", key: "profileShop", value: "Profile / shop" },
	{ icon: "quote", key: "dmComment", value: "DM or comment" },
	{ icon: "x", key: "nowhere", value: "Nowhere yet" },
] as const satisfies ReadonlyArray<{ icon: IconName; key: string; value: string }>;

const GOAL_OPTIONS = [
	{ icon: "store", key: "sales", value: "Sales" },
	{ icon: "user", key: "followers", value: "Followers" },
	{ icon: "eye", key: "awareness", value: "Awareness" },
	{ icon: "arrow", key: "traffic", value: "Traffic" },
] as const satisfies ReadonlyArray<{ icon: IconName; key: string; value: string }>;

type DestinationOption = (typeof DESTINATION_OPTIONS)[number]["key"];
type GoalOption = (typeof GOAL_OPTIONS)[number]["key"];

type TrustKey = "noCard" | "private" | "turnaround";

const trustItems: { key: TrustKey; icon: IconName }[] = [
	{ key: "noCard", icon: "check" },
	{ key: "private", icon: "shieldCheck" },
	{ key: "turnaround", icon: "clock" },
];

const stepIcons: IconName[] = ["upload", "target", "clock"];

type JobStatus = {
	stage: string;
	progress: number;
	error?: string;
	steps?: JobStep[];
};

type JobStep = {
	id: "media" | "transcript" | "visuals" | "audit";
	label: string;
	source: string;
	status: "pending" | "active" | "complete" | "error";
};

function formatFileSize(bytes: number) {
	const megabytes = bytes / 1024 / 1024;
	return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function truncateText(text: string, maxLength: number) {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function getShortSummary(audit: AnalysisAudit) {
	const summary = audit.summary ?? "";
	const bottomLine = audit.bottomLine ?? "";
	const source = bottomLine && (!summary || bottomLine.length < summary.length) ? bottomLine : summary;

	if (!source) {
		return "";
	}

	const firstSentence = source.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();

	return truncateText(firstSentence ?? source, 190);
}

type TranslationValues = Record<string, string | number>;
type TranslationFunction = (key: string, values?: TranslationValues) => string;

function getCompactGoal(goal: string, t: TranslationFunction) {
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

function getBiggestProblemHeadline(
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

const fallbackJobSteps: JobStep[] = [
	{ id: "media", label: "Preparing video", source: "Secure upload", status: "pending" },
	{ id: "transcript", label: "Transcribing audio", source: "Audio AI", status: "pending" },
	{ id: "visuals", label: "Understanding visuals", source: "Visual AI", status: "pending" },
	{ id: "audit", label: "Scoring & writing fixes", source: "Creative AI", status: "pending" },
];

function AuditLoadingPanel({
	error,
	fileName,
	onAuditAnother,
	status,
}: {
	error: string | null;
	fileName: string;
	onAuditAnother: () => void;
	status: JobStatus;
}) {
	const t = useTranslations("AuditUpload.loading");
	const steps = status.steps?.length ? status.steps : fallbackJobSteps;
	const progress = Math.max(0, Math.min(100, status.progress));

	return (
		<section className={styles.loadingShell} aria-labelledby="audit-loading-title" aria-live="polite">
			<div className={styles.loadingPanel}>
				<div className={styles.loadingMark}>
					<Icon name={error ? "lock" : "spark"} size="large" />
				</div>
				<h1 id="audit-loading-title">
					{error ? t("failedTitle") : t("title", { fileName })}
				</h1>
				<p>{error ? t("failedCopy") : t("copy")}</p>

				<div className={styles.loadingPlatform}>
					<Icon name="film" size="small" />
					{t("platform")}
				</div>

				<div className={styles.loadingProgress}>
					<div className={styles.loadingBar}>
						<span style={{ width: `${progress}%` }} />
					</div>
					<strong>{progress}%</strong>
				</div>

				<ul className={styles.loadingSteps}>
					{steps.map((step) => (
						<li key={step.id} className={clsx(styles.loadingStep, styles[`step${step.status}`])}>
							<span>
								{step.status === "complete" ? <Icon name="check" size="small" /> : null}
								{step.status === "active" ? <Icon name="spark" size="small" /> : null}
								{step.status === "error" ? <Icon name="lock" size="small" /> : null}
							</span>
							<strong>{t(`steps.${step.id}.label`)}</strong>
							<em>{t(`steps.${step.id}.source`)}</em>
						</li>
					))}
				</ul>

				{error
					? (
						<div className={styles.loadingError}>
							<p>{error}</p>
							<Button type="button" variant="secondary" icon="refreshCw" iconSize="small" onClick={onAuditAnother}>
								{t("chooseAnother")}
							</Button>
						</div>
					)
					: null}
			</div>
		</section>
	);
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
	return Boolean(
		value
			&& typeof value === "object"
			&& "audit" in value
			&& typeof (value as AnalysisResponse).audit?.overallScore === "number",
	);
}

function buildFallbackFixes(audit: AnalysisAudit): PriorityFix[] {
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

function getReportTone(score: number, t: TranslationFunction) {
	if (score >= 80) {
		return t("readyToPublish");
	}

	if (score >= 65) {
		return t("needsRevision");
	}

	return t("needsWork");
}

function getVerdictShort(score: number, t: TranslationFunction) {
	if (score >= 80) return t("verdictReady");
	if (score >= 65) return t("verdictNotYet");
	return t("verdictPoor");
}

function getVerdictClass(score: number, styles: Record<string, string>) {
	if (score >= 80) return styles.verdictGood;
	if (score >= 65) return styles.verdictFair;
	return styles.verdictWeak;
}

function getImpactClass(impact: string) {
	const normalized = impact.toLowerCase();

	if (normalized.includes("highest")) {
		return styles.highestImpact;
	}

	if (normalized.includes("high")) {
		return styles.highImpact;
	}

	if (normalized.includes("optional")) {
		return styles.optionalImpact;
	}

	return styles.worthImpact;
}

function getFixIcon(): IconName {
	return "bolt";
}

const whatsWorkingIcons: IconName[] = ["user", "film", "captions", "shieldCheck", "wave", "spark"];

function getWhatsWorkingIcon(index: number): IconName {
	return whatsWorkingIcons[index % whatsWorkingIcons.length];
}

function getLocalizedError(message: string, t: TranslationFunction) {
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

function AnalysisReport({ audit, onAuditAnother }: {
	audit: AnalysisAudit;
	onAuditAnother: () => void;
}) {
	const t = useTranslations("AuditUpload.report");
	const shortSummary = getShortSummary(audit);
	const compactGoal = getCompactGoal(audit.goal.detected, t);
	const whatsWorking = audit.whatsWorking?.slice(0, 3) ?? [];
	const priorityFixes = audit.priorityFixes?.length ? audit.priorityFixes : buildFallbackFixes(audit);
	const hasFixes = priorityFixes.length > 0;
	const biggestProblemHeadline = getBiggestProblemHeadline(audit, priorityFixes, hasFixes, t("noFixesFallback"));
	const scoreAfterFixes = audit.scoreAfterFixes ?? Math.min(100, audit.overallScore + (hasFixes ? 12 : 0));
	const scoreLift = audit.scoreLift ?? Math.max(0, scoreAfterFixes - audit.overallScore);
	const editorItems = audit.editorBrief?.items.length
		? audit.editorBrief.items
		: priorityFixes.map((fix) => ({ task: fix.editorTask, timestamp: fix.timestamp }));
	const estimatedEditTime = audit.editorBrief?.estimatedEditTime
		?? (hasFixes ? t("estimatedEditTime") : t("noUrgentEdits"));
	const finalRecommendation = audit.finalRecommendation ?? {
		change: priorityFixes.map((fix) => fix.title.split(" ").slice(0, 3).join(" ")),
		expectedResult: audit.summary,
		headline: hasFixes ? t("fallbackRecommendation", { count: priorityFixes.length }) : t("readyToPublish"),
	};
	const copyBrief = async () => {
		const brief = editorItems
			.map((item, index) => `${index + 1}. ${item.task} (${item.timestamp})`)
			.join("\n");

		await navigator.clipboard?.writeText(brief).catch(() => undefined);
	};

	return (
		<section className={styles.reportStage} aria-labelledby="analysis-report-title">
			<div className={styles.resultIntro}>
				<div>
					<p className={styles.statusLine}>
						<span />
						{t("auditComplete")}
					</p>
					<h1 id="analysis-report-title">{t("title")}</h1>
					<p>{shortSummary}</p>
				</div>
				<div className={styles.resultActions}>
					<Button
						className={styles.auditAgainButton}
						type="button"
						variant="secondary"
						size="md"
						icon="upload"
						iconSize="small"
						onClick={onAuditAnother}
					>
						{t("auditAnother")}
					</Button>
					<Button className={styles.shareButton} type="button" size="md" icon="share" iconSize="small">
						{t("shareReport")}
					</Button>
				</div>
			</div>

			<article className={styles.reportPanel}>
				<div className={styles.windowBar}>
					<div aria-hidden="true">
						<span />
						<span />
						<span />
					</div>
					<span>{t("reportFile")}</span>
					<strong>
						<span />
						{t("auditComplete")}
					</strong>
				</div>

				<div className={styles.diagnosis}>
					{audit.overallScore < 80
						? (
							<div className={styles.revisionBadge}>
								<span />
								{t("needsRevision")}
							</div>
						)
						: null}
					<div>
						<div className={styles.goalPills}>
							<span>{t("detectedGoal")}</span>
							<strong>
								<Icon name="target" size="small" />
								{compactGoal}
							</strong>
							<small>{t("confidence", { confidence: audit.goal.confidence })}</small>
						</div>

						<p className={styles.problemLabel}>{hasFixes ? t("biggestProblem") : t("mainReadout")}</p>
						<h2>{biggestProblemHeadline}</h2>

						<div className={styles.bottomLine}>
							<span>
								<b aria-hidden="true">”</b>
								{t("bottomLine")}
							</span>
							<p>{audit.bottomLine ?? audit.goal.reasoning}</p>
						</div>
					</div>

					{audit.overallScore < 80 && <aside
						className={styles.scoreLift}
						aria-label={t("scoreAria", { current: audit.overallScore, predicted: scoreAfterFixes })}
					>
						<span>{hasFixes ? t("scoreAfterFixes", { count: priorityFixes.length }) : t("currentScore")}</span>
						<div>
							<small>{audit.overallScore}</small>
							<b aria-hidden="true">→</b>
							<strong>{scoreAfterFixes}</strong>
							{scoreLift > 0
								? (
									<em>
										<Icon name="wave" size="small" />
										+{scoreLift} pts
									</em>
								)
								: null}
						</div>
						<div className={styles.liftBar}>
							<span style={{ "--score-width": `${audit.overallScore}%` } as CSSProperties} />
							<span
								style={{
									"--score-start": `${audit.overallScore}%`,
									"--score-width": `${scoreAfterFixes}%`,
								} as CSSProperties}
							/>
						</div>
						<p>
							{t("todayScore", { score: audit.overallScore })}{" "}
							{scoreLift > 0 ? t("liftPrediction") : getReportTone(audit.overallScore, t)}
						</p>
					</aside>}
				</div>

				<section className={styles.fixSection}>
					<p className={styles.sectionKicker}>{hasFixes ? t("whatToChange") : t("readout")}</p>
					<h3>{hasFixes ? t("fixesHeading", { count: priorityFixes.length }) : t("noMajorFixes")}</h3>

					{hasFixes
						? (
							<div className={styles.fixList}>
								{priorityFixes.map((fix, index) => (
									<article className={styles.fixCard} key={`${fix.timestamp}-${fix.title}`}>
										<div className={styles.fixNumber}>
											<strong>{String(index + 1).padStart(2, "0")}</strong>
											<div className={getImpactClass(fix.impact)} aria-hidden="true">
												<i />
												<i />
												<i />
											</div>
											<span className={getImpactClass(fix.impact)}>{fix.impact}</span>
										</div>
										<div className={styles.fixBody}>
											<div className={styles.fixMeta}>
												<span className={getImpactClass(fix.impact)}>
													<Icon name={getFixIcon()} size="small" />
												</span>
												<span>
													<Icon name="clock" size="small" />
													{fix.timestamp}
												</span>
												<em>
													<i />
													{t("highConfidence")}
												</em>
											</div>
											<h4>{fix.title}</h4>
											<p className={styles.fixReason}>{fix.whyItMatters}</p>
											<div className={styles.fixCallout}>
												<span>
													<Icon name="wandSparkles" size="small" />
												</span>
												<div>
													<strong>{t("theFix")}</strong>
													<p>{fix.fix}</p>
												</div>
											</div>
											<div className={styles.whyBox}>
												<Icon name="wave" size="small" />
												<p>{fix.whyThisWorks}</p>
											</div>
										</div>
									</article>
								))}
							</div>
						)
						: <p className={styles.emptyFixes}>{t("emptyFixes")}</p>}
				</section>

				{editorItems.length
					? (
						<section className={styles.editorBrief}>
							<div className={styles.briefHeader}>
								<div>
									<span>
										<Icon name="badgeCard" size="medium" />
									</span>
									<div>
										<h3>{t("editorHeading")}</h3>
										<p>{t("editorCopy", { count: editorItems.length })}</p>
									</div>
								</div>
								<div>
									<span>
										<Icon name="clock" size="small" />
										{estimatedEditTime}
									</span>
									<Button
										className={styles.copyBriefButton}
										type="button"
										size="md"
										leadingMedia={<Icon name="layers" size="small" />}
										onClick={copyBrief}
									>
										{t("copyBrief")}
									</Button>
								</div>
							</div>
							<ol>
								{editorItems.map((item, index) => (
									<li key={`${item.timestamp}-${item.task}`}>
										<span>{index + 1}</span>
										<p>{item.task}</p>
										<small>{item.timestamp}</small>
									</li>
								))}
							</ol>
						</section>
					)
					: null}

				{whatsWorking.length > 0 && (
					<section className={styles.whatsWorkingSection}>
						<p className={styles.sectionKicker}>{t("whatsWorking")}</p>
						<h3>{t("keepDoingThis")}</h3>
						<div className={styles.whatsWorkingList}>
							{whatsWorking.map((item, index) => (
								<article className={styles.whatsWorkingCard} key={`${item.timestamp}-${item.title}`}>
									<div className={styles.whatsWorkingCardHeader}>
										<span className={styles.whatsWorkingIcon}>
											<Icon name={getWhatsWorkingIcon(index)} size="small" />
										</span>
										<span className={styles.whatsWorkingTimestamp}>{item.timestamp}</span>
									</div>
									<h4>{item.title}</h4>
									<p>{item.description}</p>
								</article>
							))}
						</div>
					</section>
				)}

				<section className={styles.finalCard}>
					<div className={styles.finalHeader}>
						<span>
							<Icon name="rocket" size="medium" />
						</span>
						<div>
							<span>{t("finalRecommendation")}</span>
							<h3>{finalRecommendation.headline}</h3>
						</div>
					</div>
					<div className={styles.expectedResult}>
						<div className={styles.verdictPanel}>
							<div className={styles.verdictLeft}>
								<span className={styles.verdictLabel}>{t("readyToPublishQ")}</span>
								<strong className={getVerdictClass(audit.overallScore, styles)}>
									{getVerdictShort(audit.overallScore, t)}
								</strong>
								<p>{finalRecommendation.headline}</p>
							</div>
							{scoreLift > 0 && audit.overallScore < 80
								? (
									<div className={styles.verdictRight}>
										<span>{t("scoreAfterFixesLabel")}</span>
										<div>
											<small>{audit.overallScore}</small>
											<b aria-hidden="true">→</b>
											<strong>{scoreAfterFixes}</strong>
										</div>
									</div>
								)
								: null}
						</div>
						<div className={styles.expectedDivider} />
						<p>{finalRecommendation.expectedResult}</p>
					</div>
					{finalRecommendation.change.length
						? (
							<div className={styles.tagRows}>
								<div>
									<strong>
										<Icon name="wandSparkles" size="small" />
										{t("change")}
									</strong>
									{finalRecommendation.change.map((tag) => <span key={tag}>{tag}</span>)}
								</div>
							</div>
						)
						: null}
				</section>
			</article>
		</section>
	);
}

export function AuditUploadPage() {
	const t = useTranslations("AuditUpload");
	const locale = useLocale();
	const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
	const [activeJobId, setActiveJobId] = useState<string | null>(null);
	const [status, setStatus] = useState<JobStatus>({ stage: "Waiting for upload", progress: 0 });
	const [analysis, setAnalysis] = useState<AnalysisAudit | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [destination, setDestination] = useState<DestinationOption | null>(null);
	const [goal, setGoal] = useState<GoalOption | null>(null);
	const [notes, setNotes] = useState("");
	const previewUrl = useMemo(() => (selectedVideo ? URL.createObjectURL(selectedVideo) : null), [selectedVideo]);

	const steps = stepIcons.map((icon, index) => ({
		body: t(`steps.${index}.body`),
		icon,
		title: t(`steps.${index}.title`),
	}));

	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	useEffect(() => {
		if (!activeJobId || !isSubmitting) {
			return undefined;
		}

		const intervalId = window.setInterval(async () => {
			try {
				const response = await fetch(`/api/analyze/status?jobId=${activeJobId}`, { cache: "no-store" });
				const nextStatus = (await response.json()) as JobStatus;
				setStatus(nextStatus);
			} catch {
				setStatus((current) => ({ ...current, stage: "Checking analysis status" }));
			}
		}, 1200);

		return () => window.clearInterval(intervalId);
	}, [activeJobId, isSubmitting]);

	const resetSelection = () => {
		setSelectedVideo(null);
		setActiveJobId(null);
		setStatus({ stage: "Waiting for upload", progress: 0 });
		setAnalysis(null);
		setError(null);
		setIsSubmitting(false);
		setDestination(null);
		setGoal(null);
		setNotes("");
	};

	const startAnalysis = async () => {
		if (!selectedVideo || isSubmitting) {
			return;
		}

		const jobId = crypto.randomUUID();
		const formData = new FormData();

		formData.set("video", selectedVideo);
		formData.set("jobId", jobId);

		if (destination) {
			formData.set(
				"destination",
				DESTINATION_OPTIONS.find((option) => option.key === destination)?.value ?? destination,
			);
		}

		if (goal) {
			formData.set("goal", GOAL_OPTIONS.find((option) => option.key === goal)?.value ?? goal);
		}

		const trimmedNotes = notes.trim();
		if (trimmedNotes) {
			formData.set("notes", trimmedNotes);
		}
		setActiveJobId(jobId);
		setStatus({
			stage: "Preparing video",
			progress: 5,
			steps: fallbackJobSteps.map((step) => step.id === "media" ? { ...step, status: "active" } : step),
		});
		setAnalysis(null);
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/analyze", {
				method: "POST",
				body: formData,
			});
			const payload = (await response.json()) as unknown;

			if (!response.ok) {
				const message = payload && typeof payload === "object" && "error" in payload
					? String((payload as { error: unknown }).error)
					: t("errors.failed");
				throw new Error(message);
			}

			if (!isAnalysisResponse(payload)) {
				throw new Error(t("errors.unexpectedFormat"));
			}

			setAnalysis(payload.audit);
			setStatus({ stage: "Complete", progress: 100 });
		} catch (analysisError) {
			const message = analysisError instanceof Error ? analysisError.message : t("errors.failed");
			const localizedMessage = getLocalizedError(message, t);
			setError(localizedMessage);
			setStatus({ stage: "Failed", progress: 100, error: localizedMessage });
		} finally {
			setIsSubmitting(false);
		}
	};

	const header = (
		<header className={styles.auditHeader}>
			<div className={styles.headerInner}>
				<a className={styles.brand} href={`/${locale}`} aria-label={t("brandAriaLabel")}>
					<span className={styles.mark}>
						<Icon name="arrow" size="medium" />
					</span>
					<span dangerouslySetInnerHTML={{ __html: t.raw("brandHtml") }} />
				</a>
				<a className={styles.backLink} href={`/${locale}`}>
					<Icon className={styles.backIcon} name="arrow" size="medium" />
					{t("backHome")}
				</a>
			</div>
		</header>
	);

	if (selectedVideo) {
		if (analysis) {
			return (
				<main className={styles.page}>
					{header}
					<section className={styles.resultShell} aria-labelledby="analysis-report-title">
						<AnalysisReport audit={analysis} onAuditAnother={resetSelection} />
					</section>
				</main>
			);
		}

		if (isSubmitting || error) {
			return (
				<main className={styles.page}>
					{header}
					<AuditLoadingPanel
						error={error}
						fileName={selectedVideo.name}
						onAuditAnother={resetSelection}
						status={status}
					/>
				</main>
			);
		}

		return (
			<main className={styles.page}>
				{header}
				<section className={styles.readyShell} aria-labelledby="audit-ready-title">
					<div className={styles.readyPanel}>
						<p className={styles.eyebrow}>{t("ready.eyebrow")}</p>
						<div className={styles.readyMediaHeader}>
							<div className={styles.previewFrame}>
								{previewUrl
									? <video className={styles.previewVideo} src={previewUrl} muted playsInline preload="metadata" />
									: null}
								<span className={styles.aspectBadge}>9:16</span>
							</div>

							<div className={styles.readyDetails}>
								<h1 id="audit-ready-title">{selectedVideo.name}</h1>
								<div className={styles.metaList} aria-label={t("ready.metaLabel")}>
									<span>
										<Icon name="film" size="small" />
										{t("ready.video")}
									</span>
									<span>{formatFileSize(selectedVideo.size)}</span>
									<span>
										<Icon name="check" size="small" />
										{t("ready.status")}
									</span>
								</div>

								<Button
									className={styles.chooseInline}
									type="button"
									variant="ghost"
									icon="refreshCw"
									iconSize="small"
									disabled={isSubmitting}
									onClick={resetSelection}
								>
									{t("ready.chooseAnother")}
								</Button>
							</div>
						</div>

						<div className={styles.briefAudit}>
							<div className={styles.briefIntro}>
								<p>
									<Icon name="spark" size="small" />
									{t("brief.eyebrow")}
								</p>
								<h2>{t("brief.title")}</h2>
								<span>{t("brief.copy")}</span>
							</div>

							<div className={styles.briefField}>
								<div className={styles.briefLabel}>
									<span>
										<Icon name="target" size="small" />
									</span>
									<h3>{t("brief.goalLabel")}</h3>
								</div>
								<div className={styles.choiceRow} role="radiogroup" aria-label={t("brief.goalLabel")}>
									{GOAL_OPTIONS.map((option) => {
										const selected = goal === option.key;
										return (
											<Button
												key={option.key}
												className={clsx(styles.choicePill, selected && styles.choiceSelected)}
												type="button"
												variant={selected ? "primary" : "secondary"}
												size="md"
												role="radio"
												aria-checked={selected}
												leadingMedia={<Icon name={option.icon} size="small" />}
												onClick={() => setGoal(selected ? null : option.key)}
												disabled={isSubmitting}
											>
												{t(`brief.goals.${option.key}`)}
											</Button>
										);
									})}
								</div>
							</div>

							<div className={styles.briefField}>
								<div className={styles.briefLabel}>
									<span>
										<Icon name="share" size="small" />
									</span>
									<h3>{t("brief.destinationLabel")}</h3>
									<small>{t("brief.optional")}</small>
								</div>
								<div className={styles.choiceRow} role="radiogroup" aria-label={t("brief.destinationLabel")}>
									{DESTINATION_OPTIONS.map((option) => {
										const selected = destination === option.key;
										return (
											<Button
												key={option.key}
												className={clsx(styles.choicePill, selected && styles.choiceSelected)}
												type="button"
												variant={selected ? "primary" : "secondary"}
												size="md"
												role="radio"
												aria-checked={selected}
												leadingMedia={<Icon name={option.icon} size="small" />}
												onClick={() => setDestination(selected ? null : option.key)}
												disabled={isSubmitting}
											>
												{t(`brief.destinations.${option.key}`)}
											</Button>
										);
									})}
								</div>
							</div>

							<div className={styles.briefField}>
								<div className={styles.briefLabel}>
									<span>
										<Icon name="quote" size="small" />
									</span>
									<h3>{t("brief.notesLabel")}</h3>
									<small>{t("brief.optional")}</small>
								</div>
								<div className={styles.notesWrap}>
									<textarea
										className={styles.notesInput}
										placeholder={t("brief.notesPlaceholder")}
										value={notes}
										onChange={(event) => setNotes(event.target.value)}
										disabled={isSubmitting}
										maxLength={280}
										aria-label={t("brief.notesLabel")}
									/>
									<span>{notes.length}/280</span>
								</div>
							</div>
						</div>

						{isSubmitting || error
							? (
								<div className={styles.progressWrap} aria-live="polite">
									<div className={styles.progressMeta}>
										<span>{status.stage}</span>
										<strong>{status.progress}%</strong>
									</div>
									<div className={styles.progressBar}>
										<span style={{ width: `${status.progress}%` }} />
									</div>
									<p className={styles.progressHint}>{t("progressHint")}</p>
									{error ? <p className={styles.errorText}>{error}</p> : null}
								</div>
							)
							: null}

						<div className={styles.readyFooter}>
							<Button
								className={styles.startButton}
								type="button"
								size="md"
								icon="arrow"
								disabled={isSubmitting}
								onClick={startAnalysis}
							>
								{isSubmitting ? status.stage : t("ready.start")}
							</Button>
							<div className={styles.privacyNote}>
								<Icon name="shieldCheck" size="small" />
								<p>{t("ready.privacy")}</p>
							</div>
						</div>
					</div>
				</section>
			</main>
		);
	}

	return (
		<main className={styles.page}>
			{header}
			<section className={styles.shell} aria-labelledby="audit-upload-title">
				<div className={styles.panel}>
					<p className={styles.eyebrow}>{t("eyebrow")}</p>
					<h1 id="audit-upload-title">{t("title")}</h1>
					<p className={styles.copy}>{t("copy")}</p>

					<UploadDropzone
						className={styles.dropzone}
						buttonLabel={t("dropzone.button")}
						formats={t("dropzone.formats")}
						onFileSelect={setSelectedVideo}
						title={t("dropzone.title")}
					/>

					<ul className={styles.trustList}>
						{trustItems.map((item) => (
							<li key={item.key}>
								<Icon className={styles.trustIcon} name={item.icon} size="small" />
								{t(`trust.${item.key}`)}
							</li>
						))}
					</ul>
				</div>

				<AuditSteps heading={t("stepsHeading")} steps={steps} />
			</section>
		</main>
	);
}
