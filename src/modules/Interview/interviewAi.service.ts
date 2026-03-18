/* eslint-disable no-undef */
import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";
import { Buffer } from "node:buffer";
import {
  interviewReportSchema,
  resumeHtmlSchema,
  type InterviewReportType,
} from "./interviewAi.zodValidation";
import z from "zod";
import { ApiError } from "../../middleware/error.middleware";
import puppeteer from "puppeteer";

export const ai = new GoogleGenAI({ apiKey: env.api.API_KEY });

interface GenerateReportParams {
  resume: string;
  selfDescription: string;
  jobDescription: string;
}

export async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}: GenerateReportParams): Promise<InterviewReportType> {
  const prompt = `
You are an expert technical interviewer. Analyze the candidate's profile and generate a structured interview report.

---
CANDIDATE PROFILE

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

---
OUTPUT INSTRUCTIONS

Return a JSON object with these exact fields:

- jobDescription: string — a concise summary of the role's key requirements
- resumeText: string — a concise summary of the candidate's background
- selfDescription: string — a concise summary of the candidate's self-assessment
- matchScore: integer (0–100) — how well the candidate fits the role
- technicalQuestions: array of { question, answer, intention } — at least 3 questions testing hard skills
- behaviouralQuestions: array of { question, answer, intention } — at least 3 questions testing soft skills
- skillGaps: array of { skill, severity: "low"|"medium"|"high" } — gaps between candidate and role requirements
- preparationPlan: array of { day, focus, tasks[] } — a day-by-day preparation roadmap to close the gaps
`.trim();

  const res = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: z.toJSONSchema(interviewReportSchema),
    },
  });

  if (!res.text) {
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(res.text) as InterviewReportType;
}

export async function generatePdfFromHtml(
  htmlContent: string,
): Promise<Buffer> {
  if (!htmlContent.trim()) {
    throw new ApiError(400, "htmlContent cannot be empty"); // ✅ 400 Bad Request
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfUint8Array = await page.pdf({
      // ✅ সঠিক variable name
      format: "A4",
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

    return Buffer.from(pdfUint8Array);
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Failed to generate PDF");
  } finally {
    await browser.close();
  }
}

// generateResumePdf part

interface GenerateResumePdfParams {
  resume: string;
  selfDescription: string;
  jobDescription: string;
}

export async function generateResumePdf({
  resume,
  selfDescription,
  jobDescription,
}: GenerateResumePdfParams): Promise<Buffer> {
  const prompt =
    `You are an expert resume writer. Generate a professional resume for the candidate below.

---
CANDIDATE PROFILE

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

---
INSTRUCTIONS

- Tailor the resume specifically for the given job description
- Highlight relevant skills and experience
- Write naturally — must not sound AI-generated
- Keep it 1-2 pages when converted to PDF
- Simple, professional design — subtle colors or font styles are fine
- ATS-friendly: clean HTML, no tables for layout, semantic tags
- Return a JSON object with a single field "html" containing the full HTML
`.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: z.toJSONSchema(resumeHtmlSchema),
    },
  });
  if (!response.text) {
    throw new ApiError(500, "Empty response from Gemini");
  }
  let jsonContent: { html: string };
  try {
    jsonContent = JSON.parse(response.text);
  } catch {
    throw new ApiError(500, "Invalid JSON response from Gemini");
  }

  if (!jsonContent.html?.trim()) {
    throw new ApiError(500, "Gemini returned empty HTML");
  }
  return generatePdfFromHtml(jsonContent.html);
}
