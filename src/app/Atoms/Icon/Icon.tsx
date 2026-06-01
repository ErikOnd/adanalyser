import clsx from "clsx";
import type { CSSProperties } from "react";
import styles from "./Icon.module.scss";
import activityIcon from "./icons/activity.svg";
import arrowRightIcon from "./icons/arrow-right.svg";
import checkIcon from "./icons/check.svg";
import clockIcon from "./icons/clock.svg";
import filmIcon from "./icons/film.svg";
import goalIcon from "./icons/goal.svg";
import sparklesIcon from "./icons/sparkles.svg";
import uploadIcon from "./icons/upload.svg";
import zapIcon from "./icons/zap.svg";

export type IconName =
	| "arrow"
	| "upload"
	| "spark"
	| "check"
	| "clock"
	| "film"
	| "target"
	| "wave"
	| "bolt";

export type IconSize = "small" | "medium" | "large";

type SvgImport = {
	src: string;
};

type IconProps = {
	className?: string;
	name: IconName;
	size?: IconSize;
};

const icons = {
	arrow: arrowRightIcon,
	bolt: zapIcon,
	check: checkIcon,
	clock: clockIcon,
	film: filmIcon,
	spark: sparklesIcon,
	target: goalIcon,
	upload: uploadIcon,
	wave: activityIcon,
} satisfies Record<IconName, string | SvgImport>;

function getIconUrl(icon: string | SvgImport) {
	return typeof icon === "string" ? icon : icon.src;
}

export function Icon({ className, name, size = "medium" }: IconProps) {
	const iconUrl = getIconUrl(icons[name]);

	return (
		<span
			aria-hidden="true"
			className={clsx(styles.icon, styles[size], className)}
			style={{ "--icon-url": `url(${iconUrl})` } as CSSProperties}
		/>
	);
}
