import { Icon, type IconName, type IconSize } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost" | "pulse" | "option" | "optionSelected";

type BaseButtonProps = {
	children: ReactNode;
	className?: string;
	fullWidth?: boolean;
	icon?: IconName;
	iconSize?: IconSize;
	leadingMedia?: ReactNode;
	size?: ButtonSize;
	variant?: ButtonVariant;
};

type LinkButtonProps = BaseButtonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
	href: string;
	type?: undefined;
};

type NativeButtonProps = BaseButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
	href?: undefined;
};

type ButtonProps = LinkButtonProps | NativeButtonProps;

function renderButtonContent(
	children: ReactNode,
	icon: IconName | undefined,
	iconSize: IconSize,
	leadingMedia: ReactNode,
) {
	return (
		<>
			{leadingMedia ? <span className={styles.media}>{leadingMedia}</span> : null}
			{children}
			{icon ? <Icon name={icon} size={iconSize} /> : null}
		</>
	);
}

export function Button(props: ButtonProps) {
	const {
		children,
		className,
		fullWidth = false,
		icon,
		iconSize = "medium",
		leadingMedia,
		size = "md",
		variant = "primary",
		...rest
	} = props;

	const classNames = clsx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className);
	const content = renderButtonContent(children, icon, iconSize, leadingMedia);

	if ("href" in props && props.href) {
		const anchorProps = rest as Omit<LinkButtonProps, keyof BaseButtonProps | "href">;

		return (
			<a className={classNames} href={props.href} {...anchorProps}>
				{content}
			</a>
		);
	}

	const { type = "button", ...buttonProps } = rest as Omit<NativeButtonProps, keyof BaseButtonProps>;

	return (
		<button className={classNames} type={type} {...buttonProps}>
			{content}
		</button>
	);
}
