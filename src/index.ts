import { env } from '@/config/env';

import { startServer } from './server';

startServer(env.PORT);
