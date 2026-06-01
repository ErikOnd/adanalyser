import { Badge } from "@/app/Atoms/Badge/Badge";
import { Button } from "@/app/Atoms/Button/Button";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import { AuditCard } from "@/app/Components/AuditCard/AuditCard";
import styles from "./Hero.module.scss";

type TrustItem = {
	icon: IconName;
	label: string;
};

const trustItems: TrustItem[] = [
	{ label: "No card required", icon: "check" },
	{ label: "Full audit in ~90s", icon: "clock" },
	{ label: "MP4 / MOV, up to 3 min", icon: "film" },
];

export function Hero() {
	return (
		<section className={styles.hero} id="audit">
			<div className={styles.copy}>
				<Badge className={styles.eyebrow} icon="spark">
					AI ad auditor for TikTok & Reels
				</Badge>

				<h1 className={styles.headline}>
					Know why
					<br />
					your video
					<br />
					<span className={styles.line}>
						will <span className={styles.highlight}>pop or flop</span>
					</span>
					<br />
					<span className={styles.line}>— before you post</span>
					<br />
					it.
				</h1>

				<p className={styles.subcopy}>
					Upload a TikTok ad, Reel, or UGC clip and get an AI audit that finds your weak hook, dead air, unclear CTA,
					and missing trust signals — with the exact fix for each, scored before you publish.
				</p>

				<div className={styles.ctas}>
					<Button href="#upload" icon="upload" iconSize="medium" size="lg">
						Audit your first video free
					</Button>
					<Button href="#example" size="lg" variant="secondary">
						See an example audit
					</Button>
				</div>

				<ul className={styles.trustList}>
					{trustItems.map((item) => (
						<li key={item.label}>
							<Icon className={styles.trustIcon} name={item.icon} size="small" />
							{item.label}
						</li>
					))}
				</ul>
			</div>

			<AuditCard />
		</section>
	);
}
