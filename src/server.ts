import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { cors, passport, session } from '@/lib/middlewares';
// import router from '@/routes';


const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(session());
app.use(passport());
app.use(morgan('dev'));

// app.use(router);

export function startServer(port: string | number) {
	app.listen(port, (error) => {
		if (error) {
			console.error('Error while starting server', error);
			return;
		}
		console.log(`Server started on port ${port}`);
	});
}

export default app;
