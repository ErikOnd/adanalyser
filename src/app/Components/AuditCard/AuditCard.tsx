import { Icon } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import styles from "./AuditCard.module.scss";

const READINESS_TIERS = ["needs-work", "almost-there", "ready-to-publish"] as const;
const ACTIVE_TIER: (typeof READINESS_TIERS)[number] = "almost-there";

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
					<div className={clsx(styles.statusBadge, styles.statusAlmost)}>
						<span />
						{t(`tiers.${ACTIVE_TIER}`)}
					</div>
				</div>

				<div className={styles.biggestProblem}>
					<span className={styles.sectionLabel}>{t("biggestProblemLabel")}</span>
					<p className={styles.biggestProblemText}>{t("biggestProblem")}</p>
				</div>

				<div className={styles.goalRow}>
					<div className={styles.goalPill}>
						<Icon name="target" size="small" />
						<strong>{t("goalName")}</strong>
					</div>
					<div className={styles.confidencePill}>
						<span />
						{t("confidence")}
					</div>
				</div>

				<div className={styles.readiness}>
					<span className={styles.readinessKicker}>{t("readinessLabel")}</span>
					<strong className={styles.readinessTier}>{t(`tiers.${ACTIVE_TIER}`)}</strong>
					<div className={styles.readinessTrack}>
						{READINESS_TIERS.map((tier) => (
							<div
								key={tier}
								className={clsx(
									styles.readinessSegment,
									tier === ACTIVE_TIER && styles.readinessSegmentActive,
								)}
							>
								<span />
								<small>{t(`tiers.${tier}`)}</small>
							</div>
						))}
					</div>
				</div>

				<div className={styles.fix}>
					<div className={styles.fixMeta}>
						<span className={styles.fixTimestamp}>
							<Icon name="clock" size="small" />
							{t("fixTimestamp")}
						</span>
						<span className={styles.fixImpact}>{t("fixImpact")}</span>
					</div>
					<div className={styles.fixBody}>
						<span className={styles.fixIconWrap}>
							<Icon name="bolt" size="small" />
						</span>
						<div>
							<strong>{t("fixTitle")}</strong>
							<p>{t("fixDetail")}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
