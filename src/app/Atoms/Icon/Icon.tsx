import clsx from "clsx";
import type { CSSProperties } from "react";
import styles from "./Icon.module.scss";
import activityIcon from "./icons/activity.svg";
import arrowRightIcon from "./icons/arrow-right.svg";
import badgeCardIcon from "./icons/badge-card.svg";
import captionsIcon from "./icons/captions.svg";
import checkIcon from "./icons/check.svg";
import chevronDownIcon from "./icons/chevron-down.svg";
import chevronLeftIcon from "./icons/chevron-left.svg";
import chevronUpIcon from "./icons/chevron-up.svg";
import clockIcon from "./icons/clock.svg";
import eyeIcon from "./icons/eye.svg";
import filmIcon from "./icons/film.svg";
import focusIcon from "./icons/focus.svg";
import globeIcon from "./icons/globe.svg";
import goalIcon from "./icons/goal.svg";
import instagramOneColorIcon from "./icons/instagram-one-color.svg";
import layersIcon from "./icons/layers.svg";
import lockIcon from "./icons/lock.svg";
import mailIcon from "./icons/mail.svg";
import quoteIcon from "./icons/quote.svg";
import refreshCwIcon from "./icons/refresh-cw.svg";
import rocketIcon from "./icons/rocket.svg";
import share2Icon from "./icons/share-2.svg";
import shieldCheckIcon from "./icons/shield-check.svg";
import sparklesIcon from "./icons/sparkles.svg";
import storeIcon from "./icons/store.svg";
import tiktokOneColorIcon from "./icons/tiktok-one-color.svg";
import tiktokIcon from "./icons/tiktok.svg";
import uploadIcon from "./icons/upload.svg";
import userIcon from "./icons/user.svg";
import wandSparklesIcon from "./icons/wand-sparkles.svg";
import xIcon from "./icons/x.svg";
import youtubeOneColorIcon from "./icons/youtube-one-color.svg";
import zapIcon from "./icons/zap.svg";

export type IconName =
	| "arrow"
	| "badgeCard"
	| "upload"
	| "captions"
	| "spark"
	| "check"
	| "chevronDown"
	| "chevronLeft"
	| "chevronUp"
	| "clock"
	| "eye"
	| "film"
	| "focus"
	| "globe"
	| "instagramOneColor"
	| "layers"
	| "lock"
	| "mail"
	| "quote"
	| "refreshCw"
	| "rocket"
	| "share"
	| "shieldCheck"
	| "store"
	| "target"
	| "tiktok"
	| "tiktokOneColor"
	| "user"
	| "wandSparkles"
	| "wave"
	| "x"
	| "youtubeOneColor"
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
	badgeCard: badgeCardIcon,
	bolt: zapIcon,
	captions: captionsIcon,
	check: checkIcon,
	chevronDown: chevronDownIcon,
	chevronLeft: chevronLeftIcon,
	chevronUp: chevronUpIcon,
	clock: clockIcon,
	eye: eyeIcon,
	film: filmIcon,
	focus: focusIcon,
	globe: globeIcon,
	instagramOneColor: instagramOneColorIcon,
	layers: layersIcon,
	lock: lockIcon,
	mail: mailIcon,
	quote: quoteIcon,
	refreshCw: refreshCwIcon,
	rocket: rocketIcon,
	share: share2Icon,
	shieldCheck: shieldCheckIcon,
	spark: sparklesIcon,
	store: storeIcon,
	target: goalIcon,
	tiktok: tiktokIcon,
	tiktokOneColor: tiktokOneColorIcon,
	upload: uploadIcon,
	user: userIcon,
	wandSparkles: wandSparklesIcon,
	wave: activityIcon,
	x: xIcon,
	youtubeOneColor: youtubeOneColorIcon,
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
