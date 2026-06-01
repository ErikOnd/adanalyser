import clsx from "clsx";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Link.module.scss";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	children: ReactNode;
	strong?: boolean;
};

export function Link({ children, className, strong = false, ...props }: LinkProps) {
	return (
		<a className={clsx(styles.link, strong && styles.strong, className)} {...props}>
			{children}
		</a>
	);
}
