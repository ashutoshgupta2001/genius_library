import Queue from 'bull';
import config from '../config/config.js';

const workQueue = new Queue('libraryQueue', {
  redis: { port: config.redis.port, host: config.redis.host }
});

export default workQueue;
