// Package Imports
import path from 'path';
import dotenv from 'dotenv';
import hbs from 'handlebars';
import express  from 'express';
import puppeteer from 'puppeteer';
import { promises as fsPromises } from 'fs';
import { Configuration, OpenAIApi } from "openai";

// Middleware
import populateJSON from '../middleware/jsonPopulator.js';

// Method Imports
import { createPrompt, removeLeading, removeTrailing } from '../methods/format.js';

dotenv.config();

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Compiles passed data into passed template
const compilePDf = async function(templateType, data) {
  const filePath = path.join(process.cwd(), 'templates', `${templateType}.hbs`);
  const html = await fsPromises.readFile(filePath, 'utf-8');
  return hbs.compile(html)(data);
}

const callAPI = async function (req, res, next) {
  try {
    // Get prompt variables from request
    let title = req.body.title;
    let years = req.body.years;
    let email = req.body.email;
    let location = req.body.location;

    // Create prompt with request variables
    const prompt = createPrompt(title, location, years, email);

    let response;
    let completion;
    let retries = 3;
    let validCompletion = false;

    while (!validCompletion && retries > 0) {
      try {
        // Call OpenAi Completion API
        response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt,
          max_tokens: 700,
          temperature: 1,
        });

        // Assign completion from response to variable
        completion = response.data.choices[0].text;

        // Try to parse the completion as JSON
        let completionCleaned = completion.replace(/[\n\r]/g, "");
        completionCleaned = removeLeading(completionCleaned);
        completionCleaned = removeTrailing(completionCleaned);
        completionCleaned = completionCleaned.replace(/(\w+)\s*:/g, '"$1":');
        const completionJSON = JSON.parse(completionCleaned);

        // Store completion JSON in request
        req.completionJSON = completionJSON;

        // Set valid completion to true to prevent loop
        validCompletion = true;

      } catch (error) {
        console.log("Invalid completion format, retrying...");
        retries--;
      }
    }

    if (!validCompletion) {
      throw new Error("Failed to get valid completion after retries");
    }

    // Store completion and prompt in request
    req.prompt = prompt;
    req.completion = completion;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const createPDF = async function(req, res, next) {
  try {

    // Get JSON object
    const jsondata = req.json;

    // Create puppeteer and page instances
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Create PDF content from template and JSON object
    const content = await compilePDf('testtemplate', jsondata);

    // Add content to page
    await page.setContent(content);

    // Format page and store it as variable
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
      printBackground: true
    })

    // Store PDF in request (as data)
    req.pdf = pdf;

    await browser.close();

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

router
  .route('/')
  .post([callAPI, populateJSON, createPDF], function(req, res) {
    console.log('Job Description Generated');

    // Store PDF as variable
    const pdf = req.pdf;

    // Set response header and content type
    res.header('Content-type', 'application/pdf');
    res.contentType("application/pdf");

    // Send PDF data as response
    res.send(pdf);
  })

export default router;