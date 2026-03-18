import { z } from "zod";
/* ---------- Sub Schemas ---------- */

const questionSchema = z.object({
  question: z
    .string()
    .describe("The specific interview question to ask the candidate."),
  answer: z
    .string()
    .describe("The ideal or expected answer for this question."),
  intention: z
    .string()
    .describe(
      "The underlying intention or what this question is trying to assess.",
    ),
});

const skillGapSchema = z.object({
  skill: z
    .string()
    .describe(
      "The specific skill that the candidate is missing or needs to improve.",
    ),
  severity: z
    .enum(["low", "medium", "high"])
    .describe("The severity level of this skill gap."),
});

const preparationGapSchema = z.object({
  day: z
    .number()
    .describe("The day number in the preparation plan (e.g., 1, 2, 3)."),
  focus: z
    .string()
    .describe("The main focus topic for this specific day of preparation."),
  tasks: z
    .array(z.string())
    .describe(
      "A list of specific tasks or activities to complete on this day.",
    ),
});

/* ---------- Main Report Schema ---------- */

export const interviewReportSchema = z.object({
  jobDescription: z
    .array(z.string())
    .describe("List of key points extracted from the job description."),
  resumeText: z
    .array(z.string())
    .describe("List of key points extracted from the candidate's resume."),
  selfDescription: z
    .array(z.string())
    .describe("List of key points describing the candidate's self-assessment."),

  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description.",
    ),

  technicalQuestions: z
    .array(questionSchema)
    .describe(
      "A list of technical questions to test the candidate's hard skills.",
    ),
  behaviouralQuestions: z
    .array(questionSchema)
    .describe(
      "A list of behavioural questions to test the candidate's soft skills and fit.",
    ),

  skillGap: z
    .array(skillGapSchema)
    .describe(
      "A list of identified gaps between the candidate's current skills and the job requirements.",
    ),
  preparationGap: z
    .array(preparationGapSchema)
    .describe(
      "A structured, day-by-day preparation plan to help the candidate overcome skill gaps.",
    ),
});

export const resumeHtmlSchema = z.object({
  html: z
    .string()
    .describe(
      "Well-formatted HTML resume, ATS-friendly, 1-2 pages when printed",
    ),
});
export type InterviewReportType = z.infer<typeof interviewReportSchema>;
