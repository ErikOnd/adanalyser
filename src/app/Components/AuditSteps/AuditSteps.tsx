import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import styles from "./AuditSteps.module.scss";

type Step = {
	body: string;
	icon: IconName;
	title: string;
};

type AuditStepsProps = {
	heading: string;
	steps: Step[];
};

export function AuditSteps({ heading, steps }: AuditStepsProps) {
	return (
		<aside className={styles.card}>
			<h2>{heading}</h2>
			<ol className={styles.steps}>
				{steps.map((step) => (
					<li key={step.title}>
						<span className={styles.iconWrap}>
							<Icon name={step.icon} size="small" />
						</span>
						<span>
							<strong>{step.title}</strong>
							<small>{step.body}</small>
						</span>
					</li>
				))}
			</ol>
		</aside>
	);
}
