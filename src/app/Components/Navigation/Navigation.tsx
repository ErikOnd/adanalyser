"use client";

import { Button } from "@/app/Atoms/Button/Button";
import { Icon } from "@/app/Atoms/Icon/Icon";
import { Link } from "@/app/Atoms/Link/Link";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import styles from "./Navigation.module.scss";

const navItemKeys = ["how", "example", "faq"] as const;

const navItemHrefs: Record<(typeof navItemKeys)[number], string> = {
	how: "#how",
	example: "#example",
	faq: "#faq",
};

export function Navigation() {
	const t = useTranslations("Navigation");
	const locale = useLocale();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<nav className={styles.nav} aria-label={t("ariaLabel")}>
			<div className={styles.inner}>
				<a className={styles.brand} href={`/${locale}`} aria-label={t("brandAriaLabel")}>
					<span className={styles.mark}>
						<Icon name="arrow" size="medium" />
					</span>
					<span>{t("brand")}</span>
				</a>

				<div className={styles.links}>
					{navItemKeys.map((key) => (
						<Link href={navItemHrefs[key]} key={key}>
							{t(`links.${key}`)}
						</Link>
					))}
				</div>

				<div className={styles.actions}>
					<Link className={styles.signIn} href={`/${locale}/sign-in`} strong>
						{t("signIn")}
					</Link>
					<Button className={styles.cta} href={`/${locale}/audit`} icon="arrow" iconSize="small">
						{t("cta")}
					</Button>
				</div>

				<button
					aria-expanded={isMenuOpen}
					aria-label={t("ariaLabel")}
					className={clsx(styles.mobileToggle, isMenuOpen && styles.mobileToggleOpen)}
					type="button"
					onClick={() => setIsMenuOpen((open) => !open)}
				>
					<span />
				</button>
			</div>

			<div className={clsx(styles.mobilePanel, isMenuOpen && styles.mobilePanelOpen)} aria-hidden={!isMenuOpen}>
				<div className={styles.mobilePanelInner}>
					{navItemKeys.map((key) => (
						<Link href={navItemHrefs[key]} key={key} tabIndex={isMenuOpen ? undefined : -1}>
							{t(`links.${key}`)}
						</Link>
					))}
					<Link
						className={styles.mobileSignIn}
						href={`/${locale}/sign-in`}
						strong
						tabIndex={isMenuOpen ? undefined : -1}
					>
						{t("signIn")}
					</Link>
				</div>
			</div>
		</nav>
	);
}
