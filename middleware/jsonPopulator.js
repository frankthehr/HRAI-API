// Package Imports
import fs  from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Data Imports
import studydata from '../data/studydata.json' assert { type: "json" };
import portaldata from '../data/portaldata.json' assert { type: "json" };
import educationdata from '../data/educationdata.json' assert { type: "json"};
import competenciesdata from '../data/competenciesdata.json' assert { type: "json"};

// Method Imports
import { compSwitch, educationSwitch, studySwitch } from '../methods/switch.js';
import { capitalizeWords } from '../methods/format.js';
import { hasTruthyValue } from '../methods/utilities.js';

const populateJSON = async function(req, res, next) {
  try {

    // const json = req.completionJSON;
    const completionJSON = req.completionJSON;

    // Set up JSON with completion data
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

    // Add logo object to JSON
    json.logo = {};

    // Get working directory
    const __dirname = path.resolve(path.dirname(''));

    // Create image path
    const imagePath = path.join(__dirname, 'public', 'images', 'hrcompanylogo.png');
    const imageBuffer = fs.readFileSync(imagePath);

    // Convert the Buffer to a Base64-encoded data URL
    const imageSrc = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    json.logo.src = imageSrc;

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

    // Inititate compentencies property as part of JSON object
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

export default populateJSON;