import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import companyRoutes from './routes/company.routes';
import jobRoutes from './routes/job.routes';
import seekerRoutes from './routes/seeker.routes';
import skillRoutes from './routes/skill.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/seeker', seekerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
