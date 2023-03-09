const title = 'Frontend Developer';
const location = 'Dublin, Ireland';
const email = 'careers@apple.com';
const years = '3';


const basicPrompt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience and add employer's contact details as ${email}. Return it in JSON format with the following with the following headings as keys: "job_title", "location", "job_overview", "requirements", "years_of_experience", "contact_details". Return the requirements as an array of requirements`;

const longPormpt = `Write a 500 word job description for a ${title} in ${location} with ${years} years of experience and add employer's contact details as ${email}. Return it in JSON format with the following with the following headings as keys: "job_title", "location", "job_overview", "requirements", "years_of_experience", "contact_details". Make the overview very long. Return the requirements as an array of strings with at least 8 requirements`;