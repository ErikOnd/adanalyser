import { Button } from "@/app/Atoms/Button/Button";
import { Icon } from "@/app/Atoms/Icon/Icon";
import { Link } from "@/app/Atoms/Link/Link";
import styles from "./Navigation.module.scss";

const navItems = [
	{ href: "#how", label: "How it works" },
	{ href: "#example", label: "Example audit" },
	{ href: "#pricing", label: "Pricing" },
	{ href: "#faq", label: "FAQ" },
];

export function Navigation() {
	return (
		<nav className={styles.nav} aria-label="Main navigation">
			<div className={styles.inner}>
				<a className={styles.brand} href="#" aria-label="Adanalyser home">
					<span className={styles.mark}>
						<Icon name="arrow" size="medium" />
					</span>
					<span>Adanalyser</span>
				</a>

				<div className={styles.links}>
					{navItems.map((item) => (
						<Link href={item.href} key={item.href}>
							{item.label}
						</Link>
					))}
				</div>

				<div className={styles.actions}>
					<Link className={styles.signIn} href="#signin" strong>
						Sign in
					</Link>
					<Button className={styles.cta} href="#audit" icon="arrow" iconSize="small">
						Audit a video free
					</Button>
				</div>
			</div>
		</nav>
	);
}
