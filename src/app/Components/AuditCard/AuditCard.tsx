import { Badge } from "@/app/Atoms/Badge/Badge";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import type { CSSProperties } from "react";
import styles from "./AuditCard.module.scss";

type ScoreRow = {
	icon: IconName;
	label: string;
	score: number;
	tone: "danger" | "warning";
};

const scoreRows: ScoreRow[] = [
	{ label: "Hook", score: 48, tone: "danger", icon: "bolt" },
	{ label: "Retention", score: 64, tone: "warning", icon: "wave" },
	{ label: "CTA", score: 41, tone: "danger", icon: "target" },
];

export function AuditCard() {
	return (
		<div className={styles.visual} aria-label="Example ad audit score card">
			<div className={styles.card}>
				<div className={styles.header}>
					<div className={styles.fileName}>
						<Icon name="film" size="small" />
						ugc-ad-v3.mp4
					</div>
					<div className={styles.status}>
						<span />
						analyzed
					</div>
				</div>

				<Badge className={styles.dropOff} icon="bolt" iconClassName={styles.dropOffIcon} iconSize="small" tone="dark">
					Drop-off 0:03
				</Badge>

				<div className={styles.summary}>
					<div className={styles.gauge} aria-label="Overall score 61 out of 100">
						<span>61</span>
						<small>/ 100</small>
					</div>

					<div className={styles.verdict}>
						<p>Overall</p>
						<strong>Needs work</strong>
						<span>Goal: conversions · 92%</span>
						<b>+8s after fixes</b>
					</div>
				</div>

				<div className={styles.divider} />

				<div className={styles.scoreList}>
					{scoreRows.map((row) => (
						<div
							className={clsx(styles.scoreRow, row.tone === "warning" && styles.warning)}
							key={row.label}
							style={{ "--score-width": `${row.score}%` } as CSSProperties}
						>
							<div className={styles.scoreMeta}>
								<span className={styles.scoreIcon}>
									<Icon name={row.icon} size="small" />
								</span>
								<strong>{row.label}</strong>
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
						<strong>Weak hook · 0:00–0:03</strong>
						<p>Cut to the product in-hand at 0:01</p>
					</div>
					<b>+19%</b>
				</div>

				<Badge className={styles.soundTag} icon="check" tone="success">
					Trending sound
				</Badge>
			</div>
		</div>
	);
}
