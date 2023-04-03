// Function to get required level of competency
const compSwitch = (level, comp) => {
  switch (level) {
    case 1:
      return comp.one;
    case 2:
      return comp.two;
    case 3:
      return comp.three;
    case 4:
      return comp.four;
    case 5:
      return comp.five;
    default:
      return undefined;
  }
}

// Function to get required education
const educationSwitch = (level, edu) => {
  switch (level) {
    case 1:
      return edu.one;
    case 2:
      return edu.two;
    case 3:
      return edu.three;
    case 4:
      return edu.four;
    default:
      return edu.none;
  }
}

// Function to get required field of study
const studySwitch = (level, studies) => {
  switch (level) {
    case 1:
      return studies.one;
    case 2:
      return studies.two;
    case 3:
      return studies.three;
    case 4:
      return studies.four;
    default:
      return undefined;
  }
}

export { compSwitch, educationSwitch, studySwitch }