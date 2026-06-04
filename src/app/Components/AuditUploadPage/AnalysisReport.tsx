"use client";

import { Button } from "@/app/Atoms/Button/Button";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import type { AnalysisAudit, PriorityFix, ReadinessTier } from "@/lib/analysis/types";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import {
	buildFallbackFixes,
	getBiggestProblemHeadline,
	getCompactGoal,
	getReadinessLabel,
	getShortSummary,
	tierRank,
} from "./auditUploadHelpers";
import styles from "./AuditUploadPage.module.scss";
import { READINESS_ORDER, type TranslationFunction } from "./auditUploadTypes";

type AnalysisReportProps = {
	audit: AnalysisAudit;
	onAuditAnother: () => void;
};

function getVerdictShort(tier: ReadinessTier, t: TranslationFunction) {
	if (tier === "ready-to-publish") return t("verdictReady");
	if (tier === "almost-there") return t("verdictNotYet");
	return t("verdictPoor");
}

function getReadinessClass(tier: ReadinessTier) {
	if (tier === "ready-to-publish") return styles.verdictGood;
	if (tier === "almost-there") return styles.verdictFair;
	return styles.verdictWeak;
}

function getReadinessBadgeClass(tier: ReadinessTier) {
	if (tier === "ready-to-publish") return styles.statusReady;
	if (tier === "almost-there") return styles.statusAlmost;
	return styles.statusWork;
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

function ReadinessBar({ tier, t }: { tier: ReadinessTier; t: TranslationFunction }) {
	const activeIndex = tierRank(tier);

	return (
		<div className={styles.readinessTrack} role="img" aria-label={getReadinessLabel(tier, t)}>
			{READINESS_ORDER.map((step, index) => (
				<div
					key={step}
					className={clsx(
						styles.readinessSegment,
						index === activeIndex && styles.readinessSegmentActive,
						index === activeIndex && getReadinessBadgeClass(step),
					)}
				>
					<span />
					<small>{t(`readiness.${step}`)}</small>
				</div>
			))}
		</div>
	);
}

export function AnalysisReport({ audit, onAuditAnother }: AnalysisReportProps) {
	const t = useTranslations("AuditUpload.report");
	const shortSummary = getShortSummary(audit);
	const compactGoal = getCompactGoal(audit.goal.detected, t);
	const whatsWorking = audit.whatsWorking?.slice(0, 3) ?? [];
	const priorityFixes = audit.priorityFixes?.length ? audit.priorityFixes : buildFallbackFixes(audit);
	const hasFixes = priorityFixes.length > 0;
	const biggestProblemHeadline = getBiggestProblemHeadline(audit, priorityFixes, hasFixes, t("noFixesFallback"));
	const readiness: ReadinessTier = audit.readiness;
	const readinessAfterFixes: ReadinessTier = audit.readinessAfterFixes ?? readiness;
	const isReady = readiness === "ready-to-publish";
	const hasLift = tierRank(readinessAfterFixes) > tierRank(readiness);
	const readinessLabel = getReadinessLabel(readiness, t);
	const readinessAfterFixesLabel = getReadinessLabel(readinessAfterFixes, t);
	const editorItems = audit.editorBrief?.items.length
		? audit.editorBrief.items
		: priorityFixes.map((fix) => ({ task: fix.editorTask, timestamp: fix.timestamp }));
	const estimatedEditTime = audit.editorBrief?.estimatedEditTime
		?? (hasFixes ? t("estimatedEditTime") : t("noUrgentEdits"));
	const finalRecommendation = audit.finalRecommendation ?? {
		change: priorityFixes.map((fix) => fix.title.split(" ").slice(0, 3).join(" ")),
		expectedResult: audit.summary,
		headline: hasFixes ? t("fallbackRecommendation", { count: priorityFixes.length }) : t("readyToPublish"),
		keep: [] as string[],
	};
	const keepTags = finalRecommendation.keep ?? [];
	const changeTags = finalRecommendation.change ?? [];
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
						type="button"
						variant="secondary"
						size="md"
						icon="upload"
						iconSize="small"
						onClick={onAuditAnother}
					>
						{t("auditAnother")}
					</Button>
					<Button type="button" variant="pulse" size="md" icon="share" iconSize="small">
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
					<div className={clsx(styles.statusBadge, getReadinessBadgeClass(readiness))}>
						<span />
						{readinessLabel}
					</div>
					<div>
						<div className={styles.goalPills}>
							<span>{t("detectedGoal")}</span>
							<strong>
								<Icon name="target" size="small" />
								{compactGoal}
							</strong>
							<small>
								<b>{audit.goal.confidence}%</b>
								{t("confidence")}
							</small>
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

					<aside
						className={styles.readinessCard}
						aria-label={t("readinessAria", { current: readinessLabel, predicted: readinessAfterFixesLabel })}
					>
						<span className={styles.readinessKicker}>{t("readinessLabel")}</span>
						<strong className={clsx(styles.readinessTier, getReadinessClass(readiness))}>
							{readinessLabel}
						</strong>
						<ReadinessBar tier={readiness} t={t} />
						<p>
							{hasLift
								? t("readinessLiftCopy", { current: readinessLabel, predicted: readinessAfterFixesLabel })
								: isReady
								? t("readinessReadyCopy")
								: t("readinessHoldingCopy", { current: readinessLabel })}
						</p>
					</aside>
				</div>

				<section className={styles.fixSection}>
					<p className={styles.sectionKicker}>{hasFixes ? t("whatToChange") : t("readout")}</p>
					<h3>{hasFixes ? t("fixesHeading", { count: priorityFixes.length }) : t("noMajorFixes")}</h3>

					{hasFixes
						? (
							<div className={styles.fixList}>
								{priorityFixes.map((fix, index) => (
									<PriorityFixCard fix={fix} index={index} key={`${fix.timestamp}-${fix.title}`} t={t} />
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
										type="button"
										size="sm"
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

				<FinalRecommendation
					changeTags={changeTags}
					finalRecommendation={finalRecommendation}
					hasLift={hasLift}
					keepTags={keepTags}
					readiness={readiness}
					readinessAfterFixes={readinessAfterFixes}
					readinessAfterFixesLabel={readinessAfterFixesLabel}
					readinessLabel={readinessLabel}
					t={t}
				/>
			</article>
		</section>
	);
}

function PriorityFixCard({ fix, index, t }: { fix: PriorityFix; index: number; t: TranslationFunction }) {
	return (
		<article className={styles.fixCard}>
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
	);
}

type FinalRecommendationProps = {
	changeTags: string[];
	finalRecommendation: NonNullable<AnalysisAudit["finalRecommendation"]>;
	hasLift: boolean;
	keepTags: string[];
	readiness: ReadinessTier;
	readinessAfterFixes: ReadinessTier;
	readinessAfterFixesLabel: string;
	readinessLabel: string;
	t: TranslationFunction;
};

function FinalRecommendation({
	changeTags,
	finalRecommendation,
	hasLift,
	keepTags,
	readiness,
	readinessAfterFixes,
	readinessAfterFixesLabel,
	readinessLabel,
	t,
}: FinalRecommendationProps) {
	return (
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
						<strong className={getReadinessClass(readiness)}>
							{getVerdictShort(readiness, t)}
						</strong>
						<p>{finalRecommendation.headline}</p>
					</div>
					{hasLift
						? (
							<div className={styles.verdictRight}>
								<span>{t("readinessAfterFixesLabel")}</span>
								<div className={styles.tierTransition}>
									<small>{readinessLabel}</small>
									<b aria-hidden="true">→</b>
									<strong className={getReadinessClass(readinessAfterFixes)}>
										{readinessAfterFixesLabel}
									</strong>
								</div>
							</div>
						)
						: null}
				</div>
				<div className={styles.expectedDivider} />
				<p>{finalRecommendation.expectedResult}</p>
			</div>
			{(keepTags.length > 0 || changeTags.length > 0)
				? (
					<div className={styles.tagRows}>
						{keepTags.length > 0
							? (
								<div className={styles.keepRow}>
									<strong>
										<Icon name="check" size="small" />
										{t("keep")}
									</strong>
									{keepTags.map((tag) => <span key={`keep-${tag}`}>{tag}</span>)}
								</div>
							)
							: null}
						{keepTags.length > 0 && changeTags.length > 0
							? <span className={styles.tagDivider} aria-hidden="true" />
							: null}
						{changeTags.length > 0
							? (
								<div className={styles.changeRow}>
									<strong>
										<Icon name="wandSparkles" size="small" />
										{t("change")}
									</strong>
									{changeTags.map((tag) => <span key={`change-${tag}`}>{tag}</span>)}
								</div>
							)
							: null}
					</div>
				)
				: null}
		</section>
	);
}
