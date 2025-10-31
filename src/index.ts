import { env } from '@/lib/config';
import { registerAllListeners } from '@/lib/events/register-listeners';
import { startServer } from '@/server';

registerAllListeners();
startServer(env.PORT);
