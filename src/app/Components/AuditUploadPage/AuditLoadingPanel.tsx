"use client";

import { Button } from "@/app/Atoms/Button/Button";
import { Icon } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import styles from "./AuditUploadPage.module.scss";
import { fallbackJobSteps, type JobStatus } from "./auditUploadTypes";

type AuditLoadingPanelProps = {
	error: string | null;
	fileName: string;
	onAuditAnother: () => void;
	status: JobStatus;
};

export function AuditLoadingPanel({ error, fileName, onAuditAnother, status }: AuditLoadingPanelProps) {
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
