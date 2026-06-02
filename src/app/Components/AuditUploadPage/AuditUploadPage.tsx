"use client";

import { Button } from "@/app/Atoms/Button/Button";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import { AuditSteps } from "@/app/Components/AuditSteps/AuditSteps";
import { UploadDropzone } from "@/app/Components/UploadDropzone/UploadDropzone";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import styles from "./AuditUploadPage.module.scss";

type TrustKey = "noCard" | "private" | "turnaround";

const trustItems: { key: TrustKey; icon: IconName }[] = [
	{ key: "noCard", icon: "check" },
	{ key: "private", icon: "shieldCheck" },
	{ key: "turnaround", icon: "clock" },
];

const stepIcons: IconName[] = ["upload", "target", "clock"];

function formatFileSize(bytes: number) {
	const megabytes = bytes / 1024 / 1024;
	return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

export function AuditUploadPage() {
	const t = useTranslations("AuditUpload");
	const locale = useLocale();
	const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
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
									<Button href="#start-audit" size="md" icon="arrow">
										{t("ready.start")}
									</Button>
									<Button
										type="button"
										variant="ghost"
										icon="refreshCw"
										iconSize="small"
										onClick={() => setSelectedVideo(null)}
									>
										{t("ready.chooseAnother")}
									</Button>
								</div>
							</div>
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
