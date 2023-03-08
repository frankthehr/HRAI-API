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

const removeLeading = (string) => {
  console.log(string);
  while (string.length > 0 && string[0] !== '{') {
    string = string.substring(1);
  }
  console.log(string);
  return string;
}

const openai = new OpenAIApi(configuration);

const getDescription = async function(req, res, next) {
  try {

    // Get prompt from request
    // let prompt = req.body.prompt;
    let title = req.body.title;
    let years = req.body.years;
    let location = req.body.location;
    let email = req.body.email;

    // let prompt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience with the following headings:
    // Job Title,
    // Location,
    // Job Overview,
    // Requirements,
    // Years of Experience,
    // Contact Details
    // The contact email is ${email}`;

    // let prompt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience and add employer's contact details as ${email}. Return it in JSON format with the following with the following headings as keys: "job_title", "location", "job_overview", "requirements", "years_of_experience", "contact_details"`;

    let prompt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience and add employer's contact details as ${email}. Return it in JSON format with the following with the following headings as keys: "job_title", "location", "job_overview", "requirements", "years_of_experience", "contact_details". Return the requirements as an array`;

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

    let backticks = `${completion}`;

    let parsed = backticks.replace(/[\n\r]/g, '');

    let replaced = completion.replace(/[\n\r]/g, '');

    console.log(replaced);

    let parsedReplaced = removeLeading(replaced);

    let replacedJSON = JSON.parse(parsedReplaced);

    console.log(replacedJSON);

    console.log(typeof replacedJSON);

    req.prompt = prompt;
    req.completion = completion;
    req.parsed = parsed;
    req.replaced = replaced;
    req.replacedJSON = replacedJSON;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

const createPDF = async function(req, res, next) {
  try {

    const jsondata = req.replacedJSON;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const content = await compilePDf('testtemplate', jsondata);

    await page.setContent(content);

    // await page.pdf({
    //   path: 'mypdf.pdf',
    //   format: 'A4',
    //   printBackground: true
    // })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    })

    req.pdf = pdf;

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
    // const data = {
    //   prompt: req.prompt,
    //   completion: req.completion,
    //   parsed: req.parsed,
    //   replaced: req.replaced,
    //   jsonData: req.replacedJSON
    // }
    // res.send(data);

    const pdf = req.pdf;
    res.header('Content-type', 'application/pdf');
    res.contentType("application/pdf");
    // res.download(pdf);
    res.send(pdf);
  })

export default router;


