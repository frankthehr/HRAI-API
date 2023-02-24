require("dotenv").config();
const cors = require("cors");
const express = require("express");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.post("/ask", async (req, res) => {

  // Get prompt from request
  let prompt = req.body.prompt;

  try {
    if (prompt === null) {
      throw new Error("Uh oh, no prompt was provided");
    }

    prompt = `Write a 500 word job description for a ${prompt}`;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 700,
      temperature: 0
    });

    const completion = response.data.choices[0].text;

    // Return the result
    return res.status(200).json({
      success: true,
      prompt,
      completion,
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => console.log(`Server is running on port ${port}`));