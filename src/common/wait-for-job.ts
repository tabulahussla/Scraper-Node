export default function waitForJob(job) {
	return new Promise((resolve, reject) => {
		job.on("succeeded", result => resolve(result));
		job.on("failed", err => reject(err));
	});
}
