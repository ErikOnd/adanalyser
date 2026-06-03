"use client";

import { Button } from "@/app/Atoms/Button/Button";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import { AuditSteps } from "@/app/Components/AuditSteps/AuditSteps";
import { UploadDropzone } from "@/app/Components/UploadDropzone/UploadDropzone";
import type { AnalysisAudit, AnalysisResponse, PriorityFix } from "@/lib/analysis/types";
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import styles from "./AuditUploadPage.module.scss";

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
	const source = audit.bottomLine && audit.bottomLine.length < audit.summary.length ? audit.bottomLine : audit.summary;
	const firstSentence = source.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();

	return truncateText(firstSentence ?? source, 190);
}

function getCompactGoal(goal: string) {
	const lowerGoal = goal.toLowerCase();

	if (lowerGoal.includes("conversion") || lowerGoal.includes("lead") || lowerGoal.includes("inquir")) {
		return "Drive conversions";
	}

	if (lowerGoal.includes("view") || lowerGoal.includes("reach") || lowerGoal.includes("engagement")) {
		return "Drive views";
	}

	if (lowerGoal.includes("signup") || lowerGoal.includes("sign-up")) {
		return "Drive signups";
	}

	if (lowerGoal.includes("sale") || lowerGoal.includes("purchase")) {
		return "Drive sales";
	}

	return truncateText(goal.replace(/\s*\(.+?\)\s*/g, "").split(/[/:—-]/)[0]?.trim() || goal, 30);
}

function getBiggestProblemHeadline(audit: AnalysisAudit, priorityFixes: PriorityFix[], hasFixes: boolean) {
	const fallback = hasFixes ? priorityFixes[0]?.title : "This creative is already in good shape.";
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

function getReportTone(score: number) {
	if (score >= 80) {
		return "Ready to publish";
	}

	if (score >= 65) {
		return "Needs revision";
	}

	return "Needs work";
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

function getFixIcon(index: number): IconName {
	return index === 0 ? "bolt" : index === 1 ? "target" : "shieldCheck";
}

function getWorkingIcon(index: number): IconName {
	if (index === 0) {
		return "user";
	}

	if (index === 1) {
		return "film";
	}

	return "captions";
}

function AnalysisReport({ audit, onAuditAnother }: {
	audit: AnalysisAudit;
	onAuditAnother: () => void;
}) {
	const shortSummary = getShortSummary(audit);
	const compactGoal = getCompactGoal(audit.goal.detected);
	const priorityFixes = audit.priorityFixes?.length ? audit.priorityFixes : buildFallbackFixes(audit);
	const hasFixes = priorityFixes.length > 0;
	const biggestProblemHeadline = getBiggestProblemHeadline(audit, priorityFixes, hasFixes);
	const scoreAfterFixes = audit.scoreAfterFixes ?? Math.min(100, audit.overallScore + (hasFixes ? 12 : 0));
	const scoreLift = audit.scoreLift ?? Math.max(0, scoreAfterFixes - audit.overallScore);
	const editorItems = audit.editorBrief?.items.length
		? audit.editorBrief.items
		: priorityFixes.map((fix) => ({ task: fix.editorTask, timestamp: fix.timestamp }));
	const estimatedEditTime = audit.editorBrief?.estimatedEditTime ?? (hasFixes ? "~15 min of edits" : "No urgent edits");
	const finalRecommendation = audit.finalRecommendation ?? {
		change: priorityFixes.map((fix) => fix.title.split(" ").slice(0, 3).join(" ")),
		expectedResult: audit.summary,
		headline: hasFixes ? `Publish after ${priorityFixes.length} ${priorityFixes.length === 1 ? "fix" : "fixes"}.` : "Ready to publish.",
		keep: audit.whatWorks.slice(0, 3).map((item) => item.element.split(" ").slice(0, 3).join(" ")),
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
						Audit complete
					</p>
					<h1 id="analysis-report-title">Here&apos;s your creative audit</h1>
					<p>{shortSummary}</p>
				</div>
				<div className={styles.resultActions}>
					<Button className={styles.auditAgainButton} type="button" variant="secondary" size="md" icon="upload" iconSize="small" onClick={onAuditAnother}>
						Audit another
					</Button>
					<Button className={styles.shareButton} type="button" size="md" icon="share" iconSize="small">
						Share report
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
					<span>creative-audit.report</span>
					<strong>
						<span />
						Audit complete
					</strong>
				</div>

				<div className={styles.diagnosis}>
					<div>
						<div className={styles.goalPills}>
							<span>Detected goal</span>
							<strong>
								<Icon name="target" size="small" />
								{compactGoal}
							</strong>
							<small>{audit.goal.confidence}% confidence</small>
						</div>

						<p className={styles.problemLabel}>{hasFixes ? "Biggest problem" : "Main readout"}</p>
						<h2>{biggestProblemHeadline}</h2>

						<div className={styles.bottomLine}>
							<span>
								<b aria-hidden="true">”</b>
								Bottom line
							</span>
							<p>{audit.bottomLine ?? audit.goal.reasoning}</p>
						</div>
					</div>

					<aside className={styles.scoreLift} aria-label={`Today ${audit.overallScore}, predicted ${scoreAfterFixes}`}>
						<span>{hasFixes ? `Score after your ${priorityFixes.length} ${priorityFixes.length === 1 ? "fix" : "fixes"}` : "Current score"}</span>
						<div>
							<small>{audit.overallScore}</small>
							<b aria-hidden="true">→</b>
							<strong>{scoreAfterFixes}</strong>
							{scoreLift > 0 ? <em>+{scoreLift} pts</em> : null}
						</div>
						<div className={styles.liftBar}>
							<span style={{ "--score-width": `${audit.overallScore}%` } as CSSProperties} />
							<span style={{ "--score-width": `${scoreAfterFixes}%` } as CSSProperties} />
						</div>
						<p>Today it scores {audit.overallScore}. {scoreLift > 0 ? "The lift is a prediction after the edits below." : getReportTone(audit.overallScore)}</p>
					</aside>
				</div>

				<section className={styles.fixSection}>
					<p className={styles.sectionKicker}>{hasFixes ? "What to change" : "What to keep"}</p>
					<h3>{hasFixes ? `The ${priorityFixes.length} ${priorityFixes.length === 1 ? "fix that matters most" : "fixes that matter most"}` : "No major fixes needed"}</h3>

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
												<Icon name={getFixIcon(index)} size="small" />
												<span>{fix.timestamp}</span>
											</div>
											<h4>{fix.title}</h4>
											<span>Why it matters</span>
											<p>{fix.whyItMatters}</p>
											<div className={styles.fixCallout}>
												<Icon name="spark" size="small" />
												<div>
													<strong>The fix</strong>
													<p>{fix.fix}</p>
												</div>
											</div>
											<div className={styles.whyBox}>
												<strong>Why this works</strong>
												<p>{fix.whyThisWorks}</p>
											</div>
										</div>
									</article>
								))}
							</div>
						)
						: <p className={styles.emptyFixes}>The analysis did not find a meaningful problem worth forcing into the report. Keep the strongest elements below and publish with normal platform testing.</p>}
				</section>

				{editorItems.length ? (
					<section className={styles.editorBrief}>
						<div className={styles.briefHeader}>
							<div>
								<Icon name="badgeCard" size="medium" />
								<div>
									<h3>Hand this to your editor</h3>
									<p>The {editorItems.length} {editorItems.length === 1 ? "fix is" : "fixes are"} a copy-paste task list — paste it straight to whoever cuts the next version.</p>
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
									Copy brief
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
				) : null}

				<section className={styles.workingSection}>
					<p className={styles.sectionKicker}>What&apos;s working</p>
					<h3>Keep doing this</h3>
					<div>
						{audit.whatWorks.map((item, index) => (
							<article key={`${item.timestamp}-${item.element}`}>
								<Icon name={getWorkingIcon(index)} size="small" />
								<span>{item.timestamp}</span>
								<h4>{item.element}</h4>
								<p>{item.why}</p>
							</article>
						))}
					</div>
				</section>

				<section className={styles.finalCard}>
					<div className={styles.finalHeader}>
						<Icon name="rocket" size="medium" />
						<div>
							<span>Final recommendation</span>
							<h3>{finalRecommendation.headline}</h3>
						</div>
					</div>
					<div className={styles.expectedResult}>
						<span>Expected result</span>
						<p>{finalRecommendation.expectedResult}</p>
					</div>
					<div className={styles.tagRows}>
						{finalRecommendation.keep.length ? (
							<div>
								<strong>Keep</strong>
								{finalRecommendation.keep.map((tag) => <span key={tag}>{tag}</span>)}
							</div>
						) : null}
						{finalRecommendation.change.length ? (
							<div>
								<strong>Change</strong>
								{finalRecommendation.change.map((tag) => <span key={tag}>{tag}</span>)}
							</div>
						) : null}
					</div>
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
	};

	const startAnalysis = async () => {
		if (!selectedVideo || isSubmitting) {
			return;
		}

		const jobId = crypto.randomUUID();
		const formData = new FormData();

		formData.set("video", selectedVideo);
		formData.set("jobId", jobId);
		setActiveJobId(jobId);
		setStatus({ stage: "Uploading video", progress: 10 });
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
					: "The analysis failed. Try again with a different video.";
				throw new Error(message);
			}

			if (!isAnalysisResponse(payload)) {
				throw new Error("The analysis response was not in the expected format.");
			}

			setAnalysis(payload.audit);
			setStatus({ stage: "Complete", progress: 100 });
		} catch (analysisError) {
			const message = analysisError instanceof Error ? analysisError.message : "The analysis failed.";
			setError(message);
			setStatus({ stage: "Failed", progress: 100, error: message });
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

		return (
			<main className={styles.page}>
				{header}
				<section className={styles.readyShell} aria-labelledby="audit-ready-title">
					<div className={styles.readyPanel}>
						<p className={styles.eyebrow}>{t("ready.eyebrow")}</p>
						<div className={styles.readyContent}>
							<div className={styles.previewFrame}>
								{previewUrl
									? <video className={styles.previewVideo} src={previewUrl} muted playsInline preload="metadata" />
									: null}
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
								<div className={styles.readyActions}>
									<Button type="button" size="md" icon="arrow" disabled={isSubmitting} onClick={startAnalysis}>
										{isSubmitting ? status.stage : t("ready.start")}
									</Button>
									<Button
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
						</div>

						<div className={styles.progressWrap} aria-live="polite">
							<div className={styles.progressMeta}>
								<span>{status.stage}</span>
								<strong>{status.progress}%</strong>
							</div>
							<div className={styles.progressBar}>
								<span style={{ width: `${status.progress}%` }} />
							</div>
							{analysis
								? null
								: <p className={styles.progressHint}>This can take up to 3 minutes while the AI reviews the video.</p>}
							{error ? <p className={styles.errorText}>{error}</p> : null}
						</div>

						<div className={styles.privacyNote}>
							<Icon name="shieldCheck" size="small" />
							<p>{t("ready.privacy")}</p>
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
