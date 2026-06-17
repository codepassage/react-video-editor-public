import Bull from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

// Redis connection URL
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
export const renderQueue = new Bull('render-queue', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const uploadQueue = new Bull('upload-queue', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Bull Board setup for monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

export const bullBoard = createBullBoard({
  queues: [
    new BullAdapter(renderQueue),
    new BullAdapter(uploadQueue)
  ],
  serverAdapter
});

export const bullBoardRouter = serverAdapter.getRouter();

// Queue event logging
renderQueue.on('completed', (job) => {
  console.log(`Render job ${job.id} completed`);
});

renderQueue.on('failed', (job, err) => {
  console.error(`Render job ${job.id} failed:`, err);
});

uploadQueue.on('completed', (job) => {
  console.log(`Upload job ${job.id} completed`);
});

uploadQueue.on('failed', (job, err) => {
  console.error(`Upload job ${job.id} failed:`, err);
});