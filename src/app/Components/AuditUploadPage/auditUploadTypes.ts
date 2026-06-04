import type { IconName } from "@/app/Atoms/Icon/Icon";
import type { ReadinessTier } from "@/lib/analysis/types";

export const READINESS_ORDER: ReadinessTier[] = ["needs-work", "almost-there", "ready-to-publish"];

export const DESTINATION_OPTIONS = [
	{ icon: "user", key: "linkInBio", value: "Link in bio" },
	{ icon: "arrow", key: "landingPage", value: "Landing page" },
	{ icon: "store", key: "profileShop", value: "Profile / shop" },
	{ icon: "quote", key: "dmComment", value: "DM or comment" },
	{ icon: "x", key: "nowhere", value: "Nowhere yet" },
] as const satisfies ReadonlyArray<{ icon: IconName; key: string; value: string }>;

export const GOAL_OPTIONS = [
	{ icon: "store", key: "sales", value: "Sales" },
	{ icon: "user", key: "followers", value: "Followers" },
	{ icon: "eye", key: "awareness", value: "Awareness" },
	{ icon: "arrow", key: "traffic", value: "Traffic" },
] as const satisfies ReadonlyArray<{ icon: IconName; key: string; value: string }>;

export type DestinationOption = (typeof DESTINATION_OPTIONS)[number]["key"];
export type GoalOption = (typeof GOAL_OPTIONS)[number]["key"];

export type TrustKey = "noCard" | "private" | "turnaround";

export const trustItems: { key: TrustKey; icon: IconName }[] = [
	{ key: "noCard", icon: "check" },
	{ key: "private", icon: "shieldCheck" },
	{ key: "turnaround", icon: "clock" },
];

export const stepIcons: IconName[] = ["upload", "target", "clock"];

export type JobStatus = {
	stage: string;
	progress: number;
	error?: string;
	steps?: JobStep[];
};

export type JobStep = {
	id: "media" | "transcript" | "visuals" | "audit";
	label: string;
	source: string;
	status: "pending" | "active" | "complete" | "error";
};

export const fallbackJobSteps: JobStep[] = [
	{ id: "media", label: "Preparing video", source: "Secure upload", status: "pending" },
	{ id: "transcript", label: "Transcribing audio", source: "Audio AI", status: "pending" },
	{ id: "visuals", label: "Understanding visuals", source: "Visual AI", status: "pending" },
	{ id: "audit", label: "Scoring & writing fixes", source: "Creative AI", status: "pending" },
];

export type TranslationValues = Record<string, string | number>;
export type TranslationFunction = (key: string, values?: TranslationValues) => string;
