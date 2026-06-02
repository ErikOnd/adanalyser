import { Icon } from "@/app/Atoms/Icon/Icon";
import { routing } from "@/i18n/routing";
import clsx from "clsx";
import styles from "./LanguageSwitcher.module.scss";

const languageNames: Record<string, string> = {
	de: "Deutsch",
	en: "English",
	es: "Español",
	fr: "Français",
	pt: "Português",
};

type LanguageSwitcherProps = {
	className?: string;
	currentLocale: string;
};

export function LanguageSwitcher({ className, currentLocale }: LanguageSwitcherProps) {
	const currentCode = currentLocale.toUpperCase();

	return (
		<details className={clsx(styles.switcher, className)}>
			<summary className={styles.trigger} aria-label="Change language">
				<Icon name="globe" size="small" />
				<span>{currentCode}</span>
				<span className={styles.closedIcon}>
					<Icon name="chevronDown" size="small" />
				</span>
				<span className={styles.openIcon}>
					<Icon name="chevronUp" size="small" />
				</span>
			</summary>

			<ul className={styles.menu}>
				{routing.locales.map((locale) => {
					const isCurrent = locale === currentLocale;

					return (
						<li key={locale}>
							<a className={styles.option} href={`/${locale}/sign-in`} aria-current={isCurrent ? "page" : undefined}>
								<span className={styles.code}>{locale.toUpperCase()}</span>
								<span>{languageNames[locale]}</span>
								{isCurrent ? <Icon className={styles.check} name="check" size="small" /> : null}
							</a>
						</li>
					);
				})}
			</ul>
		</details>
	);
}
