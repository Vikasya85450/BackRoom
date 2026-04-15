import express from 'express';
import cors from 'cors';

import dotenv from "dotenv";
dotenv.config();
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import Dbconnect from './src/config/dbConnect.js';
import ErrorHandler, { errorMiddleware } from './src/utils/error.js';
import redis from './src/config/redis.js';
import userRouter from './src/routes/userRouter.js'
import roomRouter from './src/routes/roomRouter.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const swaggerPath = path.join(__dirname, 'swagger-output.json');
let swaggerDocument = {};
if (fs.existsSync(swaggerPath)) {
  swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));
  console.log('✅ Swagger file loaded');
} else {
  console.warn('⚠️ swagger-output.json not found, Swagger docs will be empty');
}


const app = express();

app.use(morgan('dev'));
app.use(
  cors({
    origin: true,   // Reflects the request origin
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

Dbconnect();

app.get('/', (req, res) => {
  res.status(200).json({ status: 'Success' });
});


app.get('/test-error', (req, res, next) => {
  next(new ErrorHandler('Forced test error', 418));
});
app.use('/api/user',userRouter)
app.use('/api/room',roomRouter)


app.use(errorMiddleware);


const Port = process.env.PORT || 3000;
app.listen(Port, () => {
  console.log(`🚀 Server Started: http://localhost:${Port}`);
});