import { BackgroundController } from './controllers/background.controller';
import { initAnalytics } from '../shared/services/analytics';

const bootstrap = async () => {
  initAnalytics('background');
  await BackgroundController.instance().run();
};

bootstrap().catch((error) => {
  console.error('[Background] Fatal error during bootstrap', error);
});
