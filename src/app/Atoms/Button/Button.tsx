import { Icon, type IconName, type IconSize } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
	children: ReactNode;
	icon?: IconName;
	iconSize?: IconSize;
	size?: "md" | "lg";
	variant?: "primary" | "secondary";
};

export function Button({
	children,
	className,
	icon,
	iconSize = "medium",
	size = "md",
	variant = "primary",
	...props
}: ButtonProps) {
	return (
		<a className={clsx(styles.button, styles[variant], styles[size], className)} {...props}>
			{children}
			{icon ? <Icon name={icon} size={iconSize} /> : null}
		</a>
	);
}
