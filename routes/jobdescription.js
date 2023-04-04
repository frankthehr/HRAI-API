import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import hbs from 'handlebars';
import express  from 'express';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { Configuration, OpenAIApi } from "openai";
import studydata from '../data/studydata.json' assert { type: "json" };
import portaldata from '../data/portaldata.json' assert { type: "json" };
import educationdata from '../data/educationdata.json' assert { type: "json"};
import competenciesdata from '../data/competenciesdata.json' assert { type: "json"};
import { compSwitch, educationSwitch, studySwitch } from '../methods/switch.js';
import { createPrompt, removeLeading, removeTrailing, prependBulletpoint, capitalizeWords } from '../methods/format.js';
import { hasTruthyValue } from '../methods/utilities.js';

dotenv.config();

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Compiles passed data into passed template
const compilePDf = async function(templateType, data) {
  const filePath = path.join(process.cwd(), 'templates', `${templateType}.hbs`);
  const html = await fs.readFile(filePath, 'utf-8');
  return hbs.compile(html)(data);
}

const callAPI = async function(req, res, next) {
  try {

    // Get prompt variables from request
    let title = req.body.title;
    let years = req.body.years;
    let email = req.body.email;
    let location = req.body.location;

    // Create prompt with request variables
    const prompt = createPrompt(title, location, years, email);

    // Call OpenAi Completion API
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 700,
      temperature: 1
    });

    // Assign completion from response to variable
    const completion = response.data.choices[0].text;

    // Store completion and prompt in request
    req.prompt = prompt;
    req.completion = completion;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

const jsonifyCompletion = async function(req, res, next) {
  try {

    // Get completion
    const completion = req.completion;

    // Remove all newline characters from completion
    const completionCleaned = completion.replace(/[\n\r]/g, '');

    // Remove all characters before the JSON object
    const parsedLeadingCompletion = removeLeading(completionCleaned);

    // Remove all characters after the JSON object
    let parsedCompletion = removeTrailing(parsedLeadingCompletion);

    parsedCompletion = parsedCompletion.replace(/(\w+)\s*:/g, '"$1":');

    console.log(parsedCompletion);

    // Convert completion from string representation of JSON to actual JSON
    const completionJSON = JSON.parse(parsedCompletion);

    // Store completion JSON in request
    req.completionJSON = completionJSON;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

const populateJSON = async function(req, res, next) {
  try {

    // const json = req.completionJSON;
    const completionJSON = req.completionJSON;


    const json = {};
    json.completion = {};
    json.completion.job_overview = completionJSON.job_overview;
    json.completion.requirements = completionJSON.requirements;
    json.completion.contact_details = completionJSON.contact_details;

    // Get prompt variables from request
    let years = req.body.years;
    let email = req.body.email;
    let title = capitalizeWords(req.body.title);
    let location = capitalizeWords(req.body.location);
    let study = Number(req.body.study);
    let education = Number(req.body.education);
    let actionComp = Number(req.body.competencies.actionComp.value);
    let composureComp = Number(req.body.competencies.composureComp.value);
    let convictionComp = Number(req.body.competencies.convictionComp.value);
    let creativityComp = Number(req.body.competencies.creativityComp.value);
    let ambiguityComp = Number(req.body.competencies.ambiguityComp.value);
    let integrityComp = Number(req.body.competencies.integrityComp.value);
    let intellectualComp = Number(req.body.competencies.intellectualComp.value);
    let confidenceComp = Number(req.body.competencies.confidenceComp.value);
    let developmentComp = Number(req.body.competencies.developmentComp.value);
    let decisionComp = Number(req.body.competencies.decisionComp.value);
    let resultsComp = Number(req.body.competencies.resultsComp.value);
    let systemsComp = Number(req.body.competencies.systemsComp.value);
    let performanceComp = Number(req.body.competencies.performanceComp.value);
    let coordinatingComp = Number(req.body.competencies.coordinatingComp.value);
    let solvingComp = Number(req.body.competencies.solvingComp.value);
    let customerComp = Number(req.body.competencies.customerComp.value);
    let representingComp = Number(req.body.competencies.representingComp.value);

    // Adding request data to JSON object
    json.details = {};
    json.details.title = title;
    json.details.years = years;
    json.details.email = email;
    json.details.location = location;
    json.details.education = educationSwitch(education, educationdata);
    json.details.study = studySwitch(study, studydata);

    // Adding portal data to JSON object
    json.company = {};
    json.employee = {};
    json.company.name = portaldata.company.name;
    json.company.trading = portaldata.company.trading;
    json.employee.first_name = portaldata.employee.first_name;
    json.employee.last_name = portaldata.employee.last_name;

    // Add compentencies data to JSON
    const compVariables = {
      actionComp: actionComp,
      composureComp: composureComp,
      convictionComp: convictionComp,
      creativityComp: creativityComp,
      ambiguityComp: ambiguityComp,
      integrityComp: integrityComp,
      intellectualComp: intellectualComp,
      confidenceComp: confidenceComp,
      developmentComp: developmentComp,
      decisionComp: decisionComp,
      resultsComp: resultsComp,
      systemsComp: systemsComp,
      performanceComp: performanceComp,
      coordinatingComp: coordinatingComp,
      solvingComp: solvingComp,
      customerComp: customerComp,
      representingComp: representingComp
    }

    // Assign showCompetencies property true if any competencies are entered, false otherwise
    json.showCompetencies = hasTruthyValue(compVariables) ? true : false;

    json.competencies = {}

    // For each competency, add it to JSON object with name, list of attributes for selected level and whether to render or not
    for (const compName in compVariables) {
      const level = compVariables[compName];
      const correctComps = compSwitch(level, competenciesdata[compName])
      json.competencies[compName] = {};
      json.competencies[compName].name = competenciesdata[compName].name;
      json.competencies[compName].list = correctComps;
      json.competencies[compName].render = level ? true : false;
    }

    // Create formatted date string
    const formattedDate = format(new Date(), 'PPP');

    // Add date object to JSON
    json.date = formattedDate;

    // Store JSON in request
    req.json = json;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

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
  .post([callAPI, jsonifyCompletion, populateJSON, createPDF], function(req, res) {
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


