// Create Prompt
// const createPrompt = (title, location, years, email) => {
//   let prompt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience and add employer's contact details as ${email}. Return it in JSON format with the following with the following headings as keys: "job_title", "location", "job_overview", "requirements", "years_of_experience", "contact_details". Make the overview very long. Return the requirements as an array of strings with at least 8 requirements. Each requirement should be 1 sentence.`;
//   return prompt;
// }

const createPrompt = (title, location, years, email) => {
  let prompt = `Please write  job description in valid JSON format for the position of a ${title} in ${location} with ${years} years of experience. The JSON object should have the following keys: "job_title", "location", "job_overview", "requirements" and "years_of_experience".The job overview should be detailed and lengthy. The "requirements" key should contain an array of at least 8 strings, with each requirement being detailed and long. Ensure that the keys are enclosed in double quotes and that the JSON format is strictly followed.`;
  return prompt;
}


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
  const formattedString = `\u2022 ${string}`
  return formattedString;
}

// Capitalises the first letter of every word in a string
function capitalizeWords(str) {
  return str.replace(/\b\w/g, function (l) {
    return l.toUpperCase();
  });
}

export { createPrompt, removeLeading, removeTrailing, prependBulletpoint, capitalizeWords }
