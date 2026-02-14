import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';    
import { getAuth } from './lib/auth';
import userRouter from './routes/userRouters';
import projectRouter from './routes/projectRoutes';
import testRouter from './routes/testRoutes';
import { stripeWebhook } from './controllers/stripeWebhook';

// Log any crashes instead of silently exiting
process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[server] Uncaught exception:', err);
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;
const corsOptions ={
    origin: process.env.TRUSTED_ORIGINS?.split(',').map(origin => origin.trim()) || [],
    credentials:true,          
      //access-control-allow-credentials:true
}

app.use(cors(corsOptions));
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

let authHandlerPromise: Promise<(req: Request, res: Response) => unknown> | null = null;
const getAuthHandler = async () => {
    if (!authHandlerPromise) {
        authHandlerPromise = (async () => {
            const auth = await getAuth();
            const { toNodeHandler } = await import('better-auth/node');
            return toNodeHandler(auth);
        })();
    }

    return authHandlerPromise;
};

app.all('/api/auth/{*any}', async (req: Request, res: Response) => {
    const handler = await getAuthHandler();
    return handler(req, res);
});


app.use(express.json({ limit: '50mb' }));
app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.use('/user',userRouter);

app.use('/api/project', projectRouter);
app.use('/test', testRouter);

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

// Export for Vercel
export default app;