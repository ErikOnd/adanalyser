import clsx from "clsx";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Link.module.scss";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps | "className"> & NextLinkProps & {
	children: ReactNode;
	className?: string;
	strong?: boolean;
};

export function Link({ children, className, strong = false, ...props }: LinkProps) {
	return (
		<NextLink className={clsx(styles.link, strong && styles.strong, className)} {...props}>
			{children}
		</NextLink>
	);
}
