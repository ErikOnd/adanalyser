"use client";

import { Icon } from "@/app/Atoms/Icon/Icon";
import { AuditSteps } from "@/app/Components/AuditSteps/AuditSteps";
import { UploadDropzone } from "@/app/Components/UploadDropzone/UploadDropzone";
import { useTranslations } from "next-intl";
import styles from "./AuditUploadPage.module.scss";
import { stepIcons, trustItems } from "./auditUploadTypes";

type AuditUploadLandingProps = {
	onFileSelect: (file: File) => void;
};

export function AuditUploadLanding({ onFileSelect }: AuditUploadLandingProps) {
	const t = useTranslations("AuditUpload");
	const steps = stepIcons.map((icon, index) => ({
		body: t(`steps.${index}.body`),
		icon,
		title: t(`steps.${index}.title`),
	}));

	return (
		<section className={styles.shell} aria-labelledby="audit-upload-title">
			<div className={styles.panel}>
				<p className={styles.eyebrow}>{t("eyebrow")}</p>
				<h1 id="audit-upload-title">{t("title")}</h1>
				<p className={styles.copy}>{t("copy")}</p>

				<UploadDropzone
					className={styles.dropzone}
					buttonLabel={t("dropzone.button")}
					formats={t("dropzone.formats")}
					onFileSelect={onFileSelect}
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
	);
}
