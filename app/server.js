import express from 'express';
import bodyParser from 'body-parser';
import db from './models/index.js';
import config from './config/config.js';
import routes from './routes/index.js';
import { logger } from './common/logger.js';
import { assignRequestId } from './common/logger.js';

const app = express();
app.use(bodyParser.json());
app.use(assignRequestId);
const PORT = config.port || 3000;

// route registry
app.use('/api/v1', routes);

// error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err}`);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: `Internal Server Error` });
});

// sync models 
db.sequelize.sync({ alter: false }).then(() => {
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}).catch(err => {
  logger.error(`DB sync failed: ${err}`);
});

export default app;