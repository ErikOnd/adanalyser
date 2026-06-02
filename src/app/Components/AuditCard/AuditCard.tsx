import { Badge } from "@/app/Atoms/Badge/Badge";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import styles from "./AuditCard.module.scss";

type ScoreKey = "hook" | "retention" | "cta";

type ScoreRow = {
	key: ScoreKey;
	icon: IconName;
	score: number;
	tone: "danger" | "warning";
};

const scoreRows: ScoreRow[] = [
	{ key: "hook", score: 48, tone: "danger", icon: "bolt" },
	{ key: "retention", score: 64, tone: "warning", icon: "wave" },
	{ key: "cta", score: 41, tone: "danger", icon: "target" },
];

export function AuditCard() {
	const t = useTranslations("AuditCard");

	return (
		<div className={styles.visual} aria-label={t("ariaLabel")}>
			<div className={styles.card}>
				<div className={styles.header}>
					<div className={styles.fileName}>
						<Icon name="film" size="small" />
						ugc-ad-v3.mp4
					</div>
					<div className={styles.status}>
						<span />
						{t("status")}
					</div>
				</div>

				<Badge className={styles.dropOff} icon="bolt" iconClassName={styles.dropOffIcon} iconSize="small" tone="dark">
					{t("dropOff")}
				</Badge>

				<div className={styles.summary}>
					<div className={styles.gauge} aria-label={t("gaugeAriaLabel")}>
						<span>61</span>
						<small>/ 100</small>
					</div>

					<div className={styles.verdict}>
						<p>{t("overall")}</p>
						<strong>{t("verdict")}</strong>
						<span>{t("goal")}</span>
						<b>{t("projection")}</b>
					</div>
				</div>

				<div className={styles.divider} />

				<div className={styles.scoreList}>
					{scoreRows.map((row) => (
						<div
							className={clsx(styles.scoreRow, row.tone === "warning" && styles.warning)}
							key={row.key}
							style={{ "--score-width": `${row.score}%` } as CSSProperties}
						>
							<div className={styles.scoreMeta}>
								<span className={styles.scoreIcon}>
									<Icon name={row.icon} size="small" />
								</span>
								<strong>{t(`rows.${row.key}`)}</strong>
								<b>{row.score}</b>
							</div>
							<div className={styles.bar}>
								<span />
							</div>
						</div>
					))}
				</div>

				<div className={styles.fix}>
					<span>
						<Icon name="bolt" size="small" />
					</span>
					<div>
						<strong>{t("fixTitle")}</strong>
						<p>{t("fixDetail")}</p>
					</div>
					<b>{t("fixDelta")}</b>
				</div>

				<Badge className={styles.soundTag} icon="check" tone="success">
					{t("trendingSound")}
				</Badge>
			</div>
		</div>
	);
}
