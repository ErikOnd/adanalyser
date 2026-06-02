import { Button } from "@/app/Atoms/Button/Button";
import { Icon } from "@/app/Atoms/Icon/Icon";
import googleIcon from "@/app/Atoms/Icon/icons/google.svg";
import tiktokIcon from "@/app/Atoms/Icon/icons/tiktok.svg";
import { InputField } from "@/app/Atoms/InputField/InputField";
import { Link } from "@/app/Atoms/Link/Link";
import { AuthPreviewCard } from "@/app/Components/AuthPreviewCard/AuthPreviewCard";
import { LanguageSwitcher } from "@/app/Components/LanguageSwitcher/LanguageSwitcher";
import { useTranslations } from "next-intl";
import Image from "next/image";
import styles from "./SignInPage.module.scss";

type SignInPageProps = {
	locale: string;
};

export function SignInPage({ locale }: SignInPageProps) {
	const t = useTranslations("SignIn");

	return (
		<main className={styles.page}>
			<div className={styles.shell}>
				<section className={styles.brandPanel} aria-label={t("introAriaLabel")}>
					<a className={styles.brand} href={`/${locale}`} aria-label={t("brandAriaLabel")}>
						<span className={styles.mark}>
							<Icon name="arrow" size="medium" />
						</span>
						<span dangerouslySetInnerHTML={{ __html: t.raw("brandHtml") }} />
					</a>

					<div className={styles.intro}>
						<p className={styles.eyebrow}>{t("eyebrow")}</p>
						<h1>{t("introTitle")}</h1>
						<p>{t("introCopy")}</p>
					</div>

					<AuthPreviewCard
						gain={t("preview.gain")}
						items={[t("preview.items.0"), t("preview.items.1"), t("preview.items.2")]}
						scoreLabel={t("preview.scoreLabel")}
						video={t("preview.video")}
					/>

					<p className={styles.socialProof}>
						<Icon name="spark" size="small" />
						<span dangerouslySetInnerHTML={{ __html: t.raw("socialProof") }} />
					</p>
				</section>

				<section className={styles.formPanel} aria-label={t("formAriaLabel")}>
					<LanguageSwitcher className={styles.language} currentLocale={locale} />

					<div className={styles.formShell}>
						<a className={styles.mobileBrand} href={`/${locale}`} aria-label={t("brandAriaLabel")}>
							<span className={styles.mark}>
								<Icon name="arrow" size="medium" />
							</span>
							<span dangerouslySetInnerHTML={{ __html: t.raw("brandHtml") }} />
						</a>

						<div className={styles.heading}>
							<h2>{t("title")}</h2>
							<p>{t("subtitle")}</p>
						</div>

						<div className={styles.oauth}>
							<Button
								type="button"
								variant="secondary"
								size="lg"
								fullWidth
								leadingMedia={<Image src={googleIcon} alt="" fill sizes="1rem" />}
							>
								{t("google")}
							</Button>
							<Button
								type="button"
								variant="secondary"
								size="lg"
								fullWidth
								leadingMedia={<Image src={tiktokIcon} alt="" fill sizes="1rem" />}
							>
								{t("tiktok")}
							</Button>
						</div>

						<div className={styles.divider}>
							<span>{t("divider")}</span>
						</div>

						<form className={styles.form}>
							<InputField label={t("email")} leadingIcon="mail" type="email" placeholder={t("emailPlaceholder")} />

							<InputField
								label={t("password")}
								leadingIcon="lock"
								trailingIcon="eye"
								type="password"
								placeholder={t("passwordPlaceholder")}
							/>

							<div className={styles.options}>
								<label className={styles.remember}>
									<input type="checkbox" defaultChecked />
									<span>
										<span className={styles.rememberIcon} />
									</span>
									{t("remember")}
								</label>
								<Link href="#forgot">{t("forgot")}</Link>
							</div>

							<Button className={styles.submit} href="#signin" icon="arrow" size="lg" fullWidth>
								{t("submit")}
							</Button>
						</form>

						<p className={styles.signup}>
							{t("new")} <Link href="#signup">{t("create")}</Link>
						</p>

						<p className={styles.legal}>
							<Icon name="shieldCheck" size="small" />
							{t("legal")}
						</p>
					</div>
				</section>
			</div>
		</main>
	);
}
