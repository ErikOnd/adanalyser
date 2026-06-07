import { Icon } from "@/app/Atoms/Icon/Icon";
import { useTranslations } from "next-intl";
import styles from "./QuestionBanner.module.scss";

export function QuestionBanner() {
	const t = useTranslations("QuestionBanner");

	return (
		<section className={styles.banner} aria-label={t("ariaLabel")}>
			<Icon className={styles.icon} name="focus" size="medium" />
			<p>
				<span>{t("prefix")}</span>{" "}
				<strong>
					&ldquo;{t("questionLine1")} {t("questionLine2")}&rdquo;
				</strong>
			</p>
		</section>
	);
}
