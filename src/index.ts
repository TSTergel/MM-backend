import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import openai, { OpenAI } from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const { Configuration, OpenAIApi } = require('openai');

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Gestionnaire d'erreurs
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Définit les variables locales, en fournissant uniquement l'erreur en développement
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Rendu de la page d'erreur
    res.status(err.status || 500);
    res.render('error');
});

app.post('/api/subjectlinegenerator', async (req: Request, res: Response) => {
  try {
    const prompt = req.body.sentence;

    console.log("prompt:");
    console.log(prompt);

    if (typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt must be a string' });
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: `You are a marketing assistant expert in crafting email subject lines optimized for deliverability and engagement. Your task is to generate a list of 10 catchy email subject lines based on the provided context. The subject lines must adhere to the following guidelines:
- The subject should be well-formed, neither too short nor too long (ideally between 40 and 60 characters).
- It must be grammatically correct, with the first letter capitalized and proper punctuation.
- It can include emojis, but no more than one per subject line.
- The subject line should not contain spam trigger words (e.g., "free," "urgent," "make money," etc.).
- Avoid excessive use of capital letters or exclamation points.
- Use natural and engaging language that matches the tone of the context.
- Do not include misleading or exaggerated information.
- The subject lines should be personalized and relevant to the target audience.
- Avoid ambiguous or vague phrases.
- Provide only the JSON array of subject lines in your response, without any additional text nor markdown, only raw array.`
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt as string
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
        response_format: {
          "type": "text"
        },
      });

    console.log("result:");
    console.log(completion.choices[0]);

    const generatedData = { data: JSON.parse(completion.choices[0].message.content as string) };
    
    res.status(200).json(generatedData);
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const server = app.listen(8080, () => {
    console.log(`Server running on port http://localhost:8080`);
  });

export default app;
