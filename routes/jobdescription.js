import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import hbs from 'handlebars';
import express  from 'express';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { Configuration, OpenAIApi } from "openai";
import data from '../data/testdata.json' assert { type: "json" };
import jobdata from '../data/jobdata.json' assert { type: "json" };
import portaldata from '../data/portaldata.json' assert { type: "json" };

dotenv.config();

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Defined bulletpoint unicode codepoint
const bulletpoint = '\u2022';

// Removes all characters before the first '{' and then returns the string
const removeLeading = (string) => {
  while (string.length > 0 && string[0] !== '{') {
    string = string.substring(1);
  }
  return string;
}

// Removes all characters after the last '}' and then returns the string
const removeTrailing = (string) => {
  let len = string.length;
  while (len > 0 && string[len - 1] !== '}') {
    string = string.substring(0, len - 1);
    len = string.length;
  }
  return string;
}

// Prepends string with bulletpoint character
const prependBulletpoint = (string) => {
  const formattedString = `${bulletpoint} ${string}`
  return formattedString;
}

// Compiles passed data into passed template
const compilePDf = async function(templateType, data) {
  const filePath = path.join(process.cwd(), 'templates', `${templateType}.hbs`);
  const html = await fs.readFile(filePath, 'utf-8');
  return hbs.compile(html)(data);
}

const getDescription = async function(req, res, next) {
  try {

    // Get prompt variables from request
    let title = req.body.title;
    let years = req.body.years;
    let location = req.body.location;
    let email = req.body.email;
    let actionComp = req.body.actionComp;

    // Create prompt with request variables
    let prompt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience and add employer's contact details as ${email}. Return it in JSON format with the following with the following headings as keys: "job_title", "location", "job_overview", "requirements", "years_of_experience", "contact_details". Make the overview very long. Return the requirements as an array of strings with at least 8 requirements.`;

    // Throw error if prompt is null
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

    // Assign completion from response to variable
    const completion = response.data.choices[0].text;

    // Remove all newline characters from completion
    const completionCleaned = completion.replace(/[\n\r]/g, '');

    // Remove all characters before the JSON object
    const parsedLeadingCompletion = removeLeading(completionCleaned);

    // Remove all characters after the JSON object
    const parsedCompletion = removeTrailing(parsedLeadingCompletion);

    console.log(parsedCompletion);

    // Convert completion from string representation of JSON to actual JSON
    const completionJSON = JSON.parse(parsedCompletion);

    console.log(completionJSON);

    // Adding portal data to JSON object
    completionJSON.company = {};
    completionJSON.employee = {};
    completionJSON.company.name = portaldata.company.name;
    completionJSON.company.trading = portaldata.company.trading;
    completionJSON.employee.first_name = portaldata.employee.first_name;
    completionJSON.employee.last_name = portaldata.employee.last_name;

    // Create formatted date string
    const formattedDate = format(new Date(), 'PPP');

    // Add date object to JSON
    completionJSON.date = formattedDate;

    // Prepend bulletpoints to requirements
    completionJSON.requirements = completionJSON.requirements.map(prependBulletpoint);

    // Store variables in request
    req.prompt = prompt;
    req.completion = completion;
    req.completionJSON = completionJSON;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

const createPDF = async function(req, res, next) {
  try {

    // Get JSON object
    const jsondata = req.completionJSON;

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

    console.log('Done');
    await browser.close();

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

    // Store PDF as variable
    const pdf = req.pdf;

    // Set response header and content type
    res.header('Content-type', 'application/pdf');
    res.contentType("application/pdf");

    // Send PDF data as response
    res.send(pdf);
  })

export default router;


