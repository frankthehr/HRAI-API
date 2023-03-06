import dotenv from 'dotenv';
import express  from 'express';
import { jsPDF } from "jspdf";
import { Configuration, OpenAIApi } from "openai";

import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import hbs from 'handlebars';
import path from 'path';
import data from '../data/testdata.json' assert { type: "json" };
import jobdata from '../data/jobdata.json' assert { type: "json" };

const compilePDf = async function(templateType, data) {
  const filePath = path.join(process.cwd(), 'templates', `${templateType}.hbs`);
  const html = await fs.readFile(filePath, 'utf-8');
  return hbs.compile(html)(data);
}

dotenv.config();

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getDescription = async function(req, res, next) {
  try {

    // Get prompt from request
    // let prompt = req.body.prompt;
    let title = req.body.title;
    let years = req.body.years;
    let location = req.body.location;
    let email = req.body.email;

    let prompt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience with the following headings:
    Job Title,
    Location,
    Job Overview,
    Requirements,
    Years of Experience,
    Contact Details
    The contact email is ${email}`;

    if (prompt === null) {
      throw new Error("Uh oh, no prompt was provided");
    }

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

const createPDF = async function(req, res, next) {
  try {

    const completion = req.completion;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log(jobdata)

    const content = await compilePDf('testtemplate', jobdata);

    // const content = '<h1>Hello</h1>';

    await page.setContent(content);
    // await page.emulateMedia('screen');
    await page.pdf({
      path: 'mypdf.pdf',
      format: 'A4',
      printBackground: true
    })

    console.log('Done');
    await browser.close();
    // process.exit();

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

router
  .route('/')
  .post([getDescription, createPDF], function(req, res) {
    console.log('Job Description Generated');
    const data = {
      prompt: req.prompt,
      completion: req.completion
    }
    res.send(data);
  })

export default router;



