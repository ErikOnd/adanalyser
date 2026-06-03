export type JobStatus = {
	stage: string;
	progress: number;
	error?: string;
};

const globalForJobs = globalThis as unknown as {
	adanalyserJobs?: Map<string, JobStatus>;
};

export const jobs = globalForJobs.adanalyserJobs ?? new Map<string, JobStatus>();

if (!globalForJobs.adanalyserJobs) {
	globalForJobs.adanalyserJobs = jobs;
}

export function updateJob(jobId: string, stage: string, progress: number, error?: string) {
	jobs.set(jobId, { stage, progress, error });
}
