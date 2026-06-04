import { Icon } from "@/app/Atoms/Icon/Icon";
import styles from "./AuditUploadPage.module.scss";

type AuditHeaderProps = {
	backLabel: string;
	brandAriaLabel: string;
	brandHtml: string;
	locale: string;
};

export function AuditHeader({ backLabel, brandAriaLabel, brandHtml, locale }: AuditHeaderProps) {
	return (
		<header className={styles.auditHeader}>
			<div className={styles.headerInner}>
				<a className={styles.brand} href={`/${locale}`} aria-label={brandAriaLabel}>
					<span className={styles.mark}>
						<Icon name="arrow" size="medium" />
					</span>
					<span dangerouslySetInnerHTML={{ __html: brandHtml }} />
				</a>
				<a className={styles.backLink} href={`/${locale}`}>
					<Icon name="chevronLeft" size="small" />
					{backLabel}
				</a>
			</div>
		</header>
	);
}
