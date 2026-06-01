import { Icon, type IconName, type IconSize } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./Badge.module.scss";

type BadgeProps = {
	children: ReactNode;
	className?: string;
	icon?: IconName;
	iconClassName?: string;
	iconSize?: IconSize;
	tone?: "volt" | "dark" | "success";
};

export function Badge({ children, className, icon, iconClassName, iconSize = "small", tone = "volt" }: BadgeProps) {
	return (
		<span className={clsx(styles.badge, styles[tone], className)}>
			{icon ? <Icon className={iconClassName} name={icon} size={iconSize} /> : null}
			{children}
		</span>
	);
}
