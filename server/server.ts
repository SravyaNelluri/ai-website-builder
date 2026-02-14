import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';    
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
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
app.all('/api/auth/{*any}', toNodeHandler(auth));


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