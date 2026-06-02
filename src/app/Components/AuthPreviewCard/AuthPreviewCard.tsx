import { Icon } from "@/app/Atoms/Icon/Icon";
import styles from "./AuthPreviewCard.module.scss";

type AuthPreviewCardProps = {
	gain: string;
	items: string[];
	scoreLabel: string;
	video: string;
};

export function AuthPreviewCard({ gain, items, scoreLabel, video }: AuthPreviewCardProps) {
	return (
		<aside className={styles.card} aria-label={scoreLabel}>
			<div className={styles.topline}>
				<span className={styles.file}>
					<Icon name="film" size="small" />
					{video}
				</span>
				<span className={styles.gain}>
					<Icon name="wave" size="small" />
					{gain}
				</span>
			</div>

			<div className={styles.body}>
				<div className={styles.score} aria-hidden="true">
					<span>92</span>
					<small>FYP-ready</small>
				</div>

				<ul className={styles.items}>
					{items.map((item) => (
						<li key={item}>
							<span className={styles.dot} />
							{item}
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}
