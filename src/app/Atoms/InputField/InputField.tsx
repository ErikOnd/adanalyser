"use client";

import { Icon, type IconName } from "@/app/Atoms/Icon/Icon";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import styles from "./InputField.module.scss";

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
	label: string;
	leadingIcon?: IconName;
	trailingIcon?: IconName;
};

export function InputField({ label, leadingIcon, trailingIcon, type, ...inputProps }: InputFieldProps) {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const hasPasswordToggle = type === "password" && trailingIcon === "eye";
	const inputType = hasPasswordToggle && isPasswordVisible ? "text" : type;

	return (
		<label className={styles.field}>
			<span className={styles.label}>{label}</span>
			<span className={styles.control}>
				{leadingIcon ? <Icon name={leadingIcon} size="small" /> : null}
				<input className={styles.input} type={inputType} {...inputProps} />
				{hasPasswordToggle
					? (
						<button
							aria-label={isPasswordVisible ? "Hide password" : "Show password"}
							aria-pressed={isPasswordVisible}
							className={styles.toggle}
							type="button"
							onClick={() => setIsPasswordVisible((current) => !current)}
						>
							<Icon className={styles.trailingIcon} name="eye" size="small" />
						</button>
					)
					: trailingIcon
					? <Icon className={styles.trailingIcon} name={trailingIcon} size="small" />
					: null}
			</span>
		</label>
	);
}
