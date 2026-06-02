"use client";

import { Icon } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import { useRef } from "react";
import styles from "./UploadDropzone.module.scss";

type UploadDropzoneProps = {
	buttonLabel: string;
	className?: string;
	formats: string;
	onFileSelect?: (file: File) => void;
	title: string;
};

export function UploadDropzone({ buttonLabel, className, formats, onFileSelect, title }: UploadDropzoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const openFilePicker = () => {
		inputRef.current?.click();
	};

	return (
		<div
			className={clsx(styles.dropzone, className)}
			role="button"
			tabIndex={0}
			onClick={openFilePicker}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					openFilePicker();
				}
			}}
		>
			<input
				ref={inputRef}
				className={styles.fileInput}
				type="file"
				accept="video/mp4,video/quicktime,.mp4,.mov"
				aria-label={title}
				onChange={(event) => {
					const file = event.currentTarget.files?.[0];

					if (file) {
						onFileSelect?.(file);
					}
				}}
			/>
			<div className={styles.uploadIcon}>
				<Icon name="upload" size="large" />
			</div>
			<p className={styles.title}>{title}</p>
			<p className={styles.formats}>{formats}</p>
			<span className={styles.browse}>{buttonLabel}</span>
		</div>
	);
}
