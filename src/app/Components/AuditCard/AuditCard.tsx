import { Badge } from "@/app/Atoms/Badge/Badge";
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

				<Badge className={styles.dropOff} icon="bolt" iconClassName={styles.dropOffIcon} iconSize="small" tone="dark">
					{t("dropOff")}
				</Badge>

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

				<div className={styles.goalPill}>
					<Icon name="target" size="small" />
					<strong>{t("goal")}</strong>
				</div>

				<div className={styles.fix}>
					<span>
						<Icon name="bolt" size="small" />
					</span>
					<div>
						<strong>{t("fixTitle")}</strong>
						<p>{t("fixDetail")}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
