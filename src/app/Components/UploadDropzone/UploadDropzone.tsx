"use client";

import { Icon } from "@/app/Atoms/Icon/Icon";
import clsx from "clsx";
import { DragEvent, useId, useRef, useState } from "react";
import styles from "./UploadDropzone.module.scss";

type UploadDropzoneProps = {
	buttonLabel: string;
	className?: string;
	formats: string;
	onFileSelect?: (file: File) => void;
	title: string;
};

export function UploadDropzone({ buttonLabel, className, formats, onFileSelect, title }: UploadDropzoneProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const openFilePicker = () => {
		inputRef.current?.click();
	};

	const selectFile = (file?: File) => {
		if (file) {
			onFileSelect?.(file);
		}
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
		setIsDragging(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
			setIsDragging(false);
		}
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		selectFile(event.dataTransfer.files[0]);
	};

	return (
		<div
			className={clsx(styles.dropzone, isDragging && styles.isDragging, className)}
			role="button"
			tabIndex={0}
			onClick={openFilePicker}
			onDragOver={handleDragOver}
			onDragEnter={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					openFilePicker();
				}
			}}
		>
			<input
				id={inputId}
				ref={inputRef}
				className={styles.fileInput}
				type="file"
				accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
				aria-label={title}
				onChange={(event) => {
					selectFile(event.currentTarget.files?.[0]);
				}}
			/>
			<div className={styles.uploadIcon}>
				<Icon name="upload" size="large" />
			</div>
			<p className={styles.title}>{title}</p>
			<p className={styles.formats}>{formats}</p>
			<label
				className={styles.browse}
				htmlFor={inputId}
				onClick={(event) => {
					event.stopPropagation();
				}}
			>
				{buttonLabel}
			</label>
		</div>
	);
}
