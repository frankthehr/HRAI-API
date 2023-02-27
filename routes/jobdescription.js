import dotenv from 'dotenv';
import express  from 'express';
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getDescription = async function(req, res, next) {
  try {

    // Get prompt from request
    let prompt = req.body.prompt;

    if (prompt === null) {
      throw new Error("Uh oh, no prompt was provided");
    }

    prompt = `Write a 500 word job description for a ${prompt}`;

    // Call OpenAi Completion API
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 700,
      temperature: 1
    });

    const completion = response.data.choices[0].text;

    req.prompt = prompt;
    req.completion = completion;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

router
  .route('/')
  .post([getDescription], function(req, res) {
    console.log('Job Description Generated');
    const data = {
      prompt: req.prompt,
      completion: req.completion
    }
    res.send(data);
  })

export default router;
