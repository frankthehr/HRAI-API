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
import { capitalizeWords } from '../methods/format.js';
import { hasTruthyValue } from '../methods/utilities.js';
import { compSwitch, educationSwitch, studySwitch } from '../methods/switch.js';

const populateJSON = async function(req, res, next) {
  try {

    // const json = req.completionJSON;
    const completionJSON = req.completionJSON;

    // Set up JSON object
    const json = {
      completion: {
        ...completionJSON
      },
      details: {
        years: req.body.years,
        email: req.body.email,
        title: capitalizeWords(req.body.title),
        location: capitalizeWords(req.body.location),
        study: studySwitch(Number(req.body.study), studydata),
        education: educationSwitch(Number(req.body.education), educationdata)
      },
      company: {
        ...portaldata.company
      },
      employee: {
        ...portaldata.employee
      },
      competencies: {},
      date: format(new Date(), 'PPP'),
      logo: {}
    };

    // Get competencies from request
    const { competencies } = req.body;
    const compVariables = {};

    // Loop through competencies add create object with names and values
    for (const compName in competencies) {
      compVariables[compName] = Number(competencies[compName].value);
    }

    // Show compentencies or not depending on if any are truthy
    json.showCompetencies = hasTruthyValue(compVariables);

    // For each competency, add it to JSON object with name, list of attributes for selected level and whether to render or not
    for (const compName in compVariables) {
      const level = compVariables[compName];
      const correctComps = compSwitch(level, competenciesdata[compName])
      json.competencies[compName] = {
        name: competenciesdata[compName].name,
        list: correctComps,
        render: level ? true : false
      };
    }

    // Get working directory
    const __dirname = path.resolve(path.dirname(''));

    // Create image path
    const imagePath = path.join(__dirname, 'public', 'images', 'hrcompanylogo.png');
    const imageBuffer = fs.readFileSync(imagePath);

    // Convert the Buffer to a Base64-encoded data URL
    const imageSrc = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    json.logo.src = imageSrc;

    // Store JSON in request
    req.json = json;

    next();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
}

export default populateJSON;