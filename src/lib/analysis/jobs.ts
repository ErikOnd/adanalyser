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

const globalForJobs = globalThis as unknown as {
	adanalyserJobs?: Map<string, JobStatus>;
};

export const jobs = globalForJobs.adanalyserJobs ?? new Map<string, JobStatus>();

if (!globalForJobs.adanalyserJobs) {
	globalForJobs.adanalyserJobs = jobs;
}

export function updateJob(
	jobId: string,
	stage: string,
	progress: number,
	error?: string,
	details?: Omit<JobStatus, "stage" | "progress" | "error">,
) {
	jobs.set(jobId, { stage, progress, error, ...details });
}
