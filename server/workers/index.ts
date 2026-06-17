import { renderQueue, uploadQueue } from '../queue';
import { processRenderJob } from './renderWorker';
import { processUploadJob } from './uploadWorker';

// Start render queue processor
renderQueue.process(2, async (job) => {
  console.log(`Processing render job ${job.id}`);
  return await processRenderJob(job);
});

// Start upload queue processor
uploadQueue.process(1, async (job) => {
  console.log(`Processing upload job ${job.id}`);
  return await processUploadJob(job);
});

console.log('Workers started:');
console.log('- Render worker: processing up to 2 concurrent jobs');
console.log('- Upload worker: processing 1 job at a time');