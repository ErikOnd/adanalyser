"use client";

import type { AnalysisAudit } from "@/lib/analysis/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AnalysisReport } from "./AnalysisReport";
import { AuditHeader } from "./AuditHeader";
import { AuditLoadingPanel } from "./AuditLoadingPanel";
import { AuditReadyPanel } from "./AuditReadyPanel";
import { getLocalizedError, isAnalysisResponse } from "./auditUploadHelpers";
import { AuditUploadLanding } from "./AuditUploadLanding";
import styles from "./AuditUploadPage.module.scss";
import {
	DESTINATION_OPTIONS,
	type DestinationOption,
	fallbackJobSteps,
	GOAL_OPTIONS,
	type GoalOption,
	type JobStatus,
} from "./auditUploadTypes";

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

		const failAnalysis = (message: string) => {
			const localizedMessage = getLocalizedError(message, t);
			setError(localizedMessage);
			setStatus({ stage: "Failed", progress: 100, error: localizedMessage });
		};

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
				failAnalysis(message);
				return;
			}

			if (!isAnalysisResponse(payload)) {
				failAnalysis(t("errors.unexpectedFormat"));
				return;
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
		<AuditHeader
			backLabel={t("backHome")}
			brandAriaLabel={t("brandAriaLabel")}
			brandHtml={t.raw("brandHtml")}
			locale={locale}
		/>
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
				<AuditReadyPanel
					destination={destination}
					error={error}
					goal={goal}
					isSubmitting={isSubmitting}
					notes={notes}
					onChooseAnother={resetSelection}
					onDestinationChange={setDestination}
					onGoalChange={setGoal}
					onNotesChange={setNotes}
					onStartAnalysis={startAnalysis}
					previewUrl={previewUrl}
					selectedVideo={selectedVideo}
					status={status}
				/>
			</main>
		);
	}

	return (
		<main className={styles.page}>
			{header}
			<AuditUploadLanding onFileSelect={setSelectedVideo} />
		</main>
	);
}
