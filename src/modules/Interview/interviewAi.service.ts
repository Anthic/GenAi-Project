import Groq from "groq-sdk";
import { env } from "../../config/env";
import { Buffer } from "node:buffer";
import { type InterviewReportType } from "./interviewAi.zodValidation";
import { ApiError } from "../../middleware/error.middleware";
import puppeteer from "puppeteer";
import { Interview } from "./interview.model";

// Groq client initialize
export const groq = new Groq({ apiKey: env.api.groqKey });

// ─── Types ───────────────────────────────────────────────

interface GenerateReportParams {
  resume: string;
  selfDescription: string;
  jobDescription: string;
}

// ─── Controller 1: Interview Report Generate ─────────────

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

Return a pure JSON object (no markdown, no code block) with EXACTLY these fields:

{
  "jobDescription": ["string array of key role requirements"],
  "resumeText": ["string array of candidate background points"],
  "selfDescription": ["string array of candidate self-assessment points"],
  "matchScore": 75,
  "technicalQuestions": [
    { "question": "...", "answer": "...", "intention": "..." }
  ],
  "behaviouralQuestions": [
    { "question": "...", "answer": "...", "intention": "..." }
  ],
  "skillGap": [
    { "skill": "...", "severity": "low" }
  ],
  "preparationGap": [
    { "day": 1, "focus": "...", "tasks": ["...", "..."] }
  ]
}

Rules:
- matchScore must be integer 0-100
- severity must be exactly "low", "medium", or "high"
- At least 3 technicalQuestions and 3 behaviouralQuestions
- Return ONLY the JSON object, nothing else
`.trim();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are an expert technical interviewer. Always respond with valid JSON only, no markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new ApiError(500, "Empty response from Groq");
  }

  try {
    return JSON.parse(content) as InterviewReportType;
  } catch {
    throw new ApiError(500, "Invalid JSON response from Groq");
  }
}

// ─── PDF Generator (Puppeteer — unchanged) ───────────────

export async function generatePdfFromHtml(
  htmlContent: string,
): Promise<Buffer> {
  if (!htmlContent.trim()) {
    throw new ApiError(400, "htmlContent cannot be empty");
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfUint8Array = await page.pdf({
      format: "A4",
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
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

// ─── Resume PDF Generator ─────────────────────────────────

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

You are a senior resume writer, ATS optimization expert, and frontend engineer.

Your task is to generate a highly optimized, ATS-friendly, single-page resume that visually matches the provided reference design.

========================
 CORE OBJECTIVE
========================
- Recreate the resume layout and styling to closely match the reference image.
- Ensure the resume is EXACTLY 1 PAGE (no overflow).
- Prioritize clarity, density, and professional formatting.

========================
 DESIGN REQUIREMENTS (VERY IMPORTANT)
========================
- Single-column layout ONLY
- Clean, minimal, professional design
- Section headings in uppercase (e.g., PROFESSIONAL SUMMARY)
- Subtle separators (thin lines or spacing)
- Bold name at top, larger than all text
- Use consistent alignment and spacing like the reference
- No icons, no graphics, no colors beyond black/gray tones
- Maintain a compact, dense layout

========================
 STRUCTURE (FOLLOW EXACTLY)
========================

1. FULL NAME
- Display at the very top in large, bold typography (very prominent).
- Use a modern font (e.g., Inter, Poppins).
- Align left.

2. CONTACT INFORMATION
- Include: Email, Phone, Location, LinkedIn
- This section must be visible on EVERY PAGE (sticky header or repeated in multi-page layout).
- Layout:
   - Left side: Email, Phone, Location,LinkedIn 
    
- Keep spacing balanced and clean.

3. PROFESSIONAL SUMMARY
- 2–3 lines maximum
- Concise and impactful
- Place below contact section

4. WORK EXPERIENCE
- Format:
   Job Title | Company | Dates (single line)
- Below each role:
   - 2–4 bullet points
   - Each bullet must be short, impact-driven, and action-oriented


5. PROJECTS
- Format:
   Project Name | Tech Stack | Dates (single line)

- Layout:
   LEFT:
   - Project Name | Tech Stack | Dates

   RIGHT:
   - Optional clickable project link (Live URL / GitHub)

- Below each project:
   - 2–4 bullet points
   - Each bullet must be:
       - Short
       - Impact-driven
       - Action-oriented

- Example bullets:
   - Built a scalable MERN application handling 1,000+ users
   - Implemented authentication and role-based access control
   - Optimized API performance reducing response time by 30%

- IMPORTANT:
   - Project links MUST appear on RIGHT SIDE aligned
   - Links must be clickable (<a> tag, target=\"_blank\")
   - Data should be dynamic (user can pass project-wise links)
   - If no link → right side stays empty

6. EDUCATION
- Degree | Institution | Year
- Keep minimal and clean

7. SKILLS
- Display as:
   - Comma-separated OR grouped categories (Frontend, Backend, Tools, etc.)
- Optional: Use tags/pills UI

8. CERTIFICATIONS
- List only if available
- Clean bullet or minimal list

========================
 ATS + HTML RULES (STRICT)
========================
- Use ONLY semantic HTML:
  <h1>, <h2>, <p>, <ul>, <li>, <section>, <div>
- NO tables
- NO flex/grid overuse (keep simple)
- NO external libraries
- Keep structure flat and readable for ATS parsers

========================
 DENSITY & CONTENT EXPANSION (CRITICAL)
========================
- The resume MUST fit exactly on 1 page, but it MUST BE DENSELY PACKED from top to bottom.
- Expand heavily on professional experience, skills, and achievements to ensure the page is completely filled with high-value text. Do not leave the page half-empty.
- Write 4-6 highly detailed, impactful bullet points per role constraint to make sure the page is completely full.
- Invent rich, realistic, professional details (metrics, impact, specific tech stacks) if the original candidate description is too short.
- Elaborate deeply on how their skills match the job description.

========================
 SPACE OPTIMIZATION
========================
- Font sizes:
  - Body: 10pt
  - Headings: 14pt
- Line-height: 1.2–1.3
- Margin-bottom: ~4px–6px
- Tight spacing between sections
- Completely fill the page but STRICTLY avoid spilling into page 2.

========================
 CSS REQUIREMENTS
========================
- Include all CSS inside a <style> tag in the <head>.
- Use minimal styling: font-family Arial/Helvetica, color #000.
- Ensure no overflow beyond A4/Letter dimensions.

========================
 OUTPUT FORMAT (STRICT)
========================
Return ONLY a JSON object like this:

{
  "html": "<!DOCTYPE html> ... full HTML here ..."
}

- No explanations
- No markdown
- No extra text

========================
 FINAL GOAL
========================
The output should:
- Look visually VERY CLOSE to the reference resume
- Be ATS-friendly
- Be extremely compact
- Fit perfectly on ONE page when printed
Return ONLY: { "html": "<full html here>" }`.trim();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are an expert resume writer. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new ApiError(500, "Empty response from Groq");
  }

  let parsed: { html: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ApiError(500, "Invalid JSON response from Groq");
  }

  if (!parsed.html?.trim()) {
    throw new ApiError(500, "Groq returned empty HTML");
  }

  return generatePdfFromHtml(parsed.html);
}

// ─── Database Services ────────────────────────────────────

export async function saveInterviewReport(
  userId: string,
  reportData: InterviewReportType,
) {
  return await Interview.create({ userId, ...reportData });
}

export async function getMyInterviewReports(userId: string) {
  return await Interview.find({ userId }).sort({ createdAt: -1 });
}

export async function getInterviewReportById(reportId: string, userId: string) {
  return await Interview.findOne({ _id: reportId, userId });
}
