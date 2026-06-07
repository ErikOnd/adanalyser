import { Badge } from "@/app/Atoms/Badge/Badge";
import { Button } from "@/app/Atoms/Button/Button";
import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import { AuditCard } from "@/app/Components/AuditCard/AuditCard";
import { useLocale, useTranslations } from "next-intl";
import styles from "./Hero.module.scss";

type TrustKey = "noCard" | "fastAudit" | "formats";

const trustItems: { key: TrustKey; icon: IconName }[] = [
	{ key: "noCard", icon: "check" },
	{ key: "fastAudit", icon: "clock" },
	{ key: "formats", icon: "film" },
];

export function Hero() {
	const t = useTranslations("Hero");
	const locale = useLocale();

	return (
		<section className={styles.hero} id="audit">
			<div className={styles.copy}>
				<Badge className={styles.eyebrow} icon="spark">
					{t("eyebrow")}
				</Badge>

				<h1 className={styles.headline}>
					{t("headlineLine1")}
					<br />
					{t("headlineLine2")}
					<br />
					<span className={styles.highlight}>{t("headlineHighlight")}</span>
				</h1>

				<p className={styles.subcopy}>{t("subcopy")}</p>

				<div className={styles.ctas}>
					<Button href={`/${locale}/audit`} icon="upload" iconSize="medium" size="lg">
						{t("ctaPrimary")}
					</Button>
					<Button href="#example" size="lg" variant="secondary">
						{t("ctaSecondary")}
					</Button>
				</div>

				<ul className={styles.trustList}>
					{trustItems.map((item) => (
						<li key={item.key}>
							<Icon className={styles.trustIcon} name={item.icon} size="small" />
							{t(`trust.${item.key}`)}
						</li>
					))}
				</ul>
			</div>

			<AuditCard />
		</section>
	);
}
