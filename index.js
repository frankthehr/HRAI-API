import cors from 'cors';
import express from 'express';
import jobDescription from './routes/jobdescription.js';
import jobDescriptionFR from './routes/jobdescriptionfr.js';

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.use('/jobdescription', jobDescription);

app.use('/jobdescriptionfr', jobDescriptionFR);

app.listen(port, () => console.log(`Server is running on port ${port}`));