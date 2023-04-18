import cors from 'cors';
import express from 'express';
import jobDescription from './routes/jobdescription.js';

const app = express();
app.use(cors());
app.use(express.json());

// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
}

const port = process.env.PORT || 5000;

app.use('/jobdescription', jobDescription);

app.use(errorHandler);

app.listen(port, () => console.log(`Server is running on port ${port}`));