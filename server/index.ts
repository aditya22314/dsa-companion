import { loadConfig, googleConfigured, aiConfigured } from './config';
import { createApp } from './app';

const config = loadConfig();
const app = createApp({ config });
app.listen(config.port, config.host, () => {
  console.log(`DSA Companion API on http://${config.host}:${config.port}`);
  console.log(`  Google Calendar: ${googleConfigured(config) ? 'configured' : 'not configured (local scheduling only)'}`);
  console.log(`  AI tutor:        ${aiConfigured(config) ? `configured (${config.ai.model})` : 'not configured (scripted mentor only)'}`);
});
