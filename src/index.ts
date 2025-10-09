import { env } from '@/lib/config/env';

import { startServer } from './server';

startServer(env.PORT);
