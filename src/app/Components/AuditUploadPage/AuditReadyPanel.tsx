"use client";

import { Button } from "@/app/Atoms/Button/Button";
import { Icon } from "@/app/Atoms/Icon/Icon";
import { useTranslations } from "next-intl";
import { formatFileSize } from "./auditUploadHelpers";
import styles from "./AuditUploadPage.module.scss";
import {
	DESTINATION_OPTIONS,
	type DestinationOption,
	GOAL_OPTIONS,
	type GoalOption,
	type JobStatus,
} from "./auditUploadTypes";

type AuditReadyPanelProps = {
	destination: DestinationOption | null;
	error: string | null;
	goal: GoalOption | null;
	isSubmitting: boolean;
	notes: string;
	onChooseAnother: () => void;
	onDestinationChange: (destination: DestinationOption | null) => void;
	onGoalChange: (goal: GoalOption | null) => void;
	onNotesChange: (notes: string) => void;
	onStartAnalysis: () => void;
	previewUrl: string | null;
	selectedVideo: File;
	status: JobStatus;
};

export function AuditReadyPanel({
	destination,
	error,
	goal,
	isSubmitting,
	notes,
	onChooseAnother,
	onDestinationChange,
	onGoalChange,
	onNotesChange,
	onStartAnalysis,
	previewUrl,
	selectedVideo,
	status,
}: AuditReadyPanelProps) {
	const t = useTranslations("AuditUpload");

	return (
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
							size="sm"
							disabled={isSubmitting}
							onClick={onChooseAnother}
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
										className={styles.choicePill}
										type="button"
										variant={selected ? "optionSelected" : "option"}
										size="sm"
										role="radio"
										aria-checked={selected}
										leadingMedia={<Icon name={option.icon} size="small" />}
										onClick={() => onGoalChange(selected ? null : option.key)}
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
										className={styles.choicePill}
										type="button"
										variant={selected ? "optionSelected" : "option"}
										size="sm"
										role="radio"
										aria-checked={selected}
										leadingMedia={<Icon name={option.icon} size="small" />}
										onClick={() => onDestinationChange(selected ? null : option.key)}
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
								onChange={(event) => onNotesChange(event.target.value)}
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
						type="button"
						size="lg"
						icon="arrow"
						disabled={isSubmitting}
						onClick={onStartAnalysis}
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
	);
}
