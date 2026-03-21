import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { PDFParse } from "pdf-parse";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { ApiError } from "../../middleware/error.middleware";
import {
  generateInterviewReport,
  generateResumePdf,
  generatePdfFromHtml,
  saveInterviewReport,
  getMyInterviewReports,
  getInterviewReportById,
} from "./interviewAi.service";

//  Helper

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text.trim();
}

// Controller 1: Interview Report Generate
const generateReport = asyncHandler(async (req: Request, res: Response) => {
  // 1. File check
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Resume PDF file is required");
  }

  // 2. Body validation
  const { selfDescription, jobDescription } = req.body as {
    selfDescription?: string;
    jobDescription?: string;
  };

  if (!selfDescription?.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "selfDescription is required");
  }
  if (!jobDescription?.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "jobDescription is required");
  }

  // 3. PDF → plain text
  const resumeText = await extractTextFromPdf(req.file.buffer);

  if (!resumeText) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Could not extract text from the uploaded PDF. Please upload a valid, text-based PDF.",
    );
  }

  // 4. Service call
  const report = await generateInterviewReport({
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: jobDescription.trim(),
  });

  const userId = req.user?.userId || req.user?.id || req.user?._id;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const savedReport = await saveInterviewReport(userId, report);

  // 5. Response
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Interview report generated successfully",
    data: savedReport,
  });
});

// Controller 2: Resume PDF Download
const downloadResumePdf = asyncHandler(async (req: Request, res: Response) => {
  // 1. File check
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Resume PDF file is required");
  }

  // 2. Body validation
  const { selfDescription, jobDescription } = req.body as {
    selfDescription?: string;
    jobDescription?: string;
  };

  if (!selfDescription?.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "selfDescription is required");
  }
  if (!jobDescription?.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "jobDescription is required");
  }

  // 3. PDF → plain text
  const resumeText = await extractTextFromPdf(req.file.buffer);

  if (!resumeText) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Could not extract text from the uploaded PDF. Please upload a valid, text-based PDF.",
    );
  }

  // 4. Service call — returns Buffer
  const pdfBuffer = await generateResumePdf({
    resume: resumeText,
    selfDescription: selfDescription.trim(),
    jobDescription: jobDescription.trim(),
  });

  // 5. Stream PDF response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="ai-generated-resume.pdf"',
  );
  res.setHeader("Content-Length", pdfBuffer.length);
  res.status(StatusCodes.OK).end(pdfBuffer);
});

// ─── Controller 3: HTML → PDF (internal/optional)
const convertHtmlToPdf = asyncHandler(async (req: Request, res: Response) => {
  // 1. Body validation
  const { html } = req.body as { html?: string };

  if (!html?.trim()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "html field is required in request body",
    );
  }

  // 2. Service call — returns Buffer
  const pdfBuffer = await generatePdfFromHtml(html);

  // 3. Stream PDF response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="converted.pdf"');
  res.setHeader("Content-Length", pdfBuffer.length);
  res.status(StatusCodes.OK).end(pdfBuffer);
});

// ─── Controller 4: Get All My Reports ──────────────────────
const getMyReports = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId || req.user?.id || req.user?._id;
  if (!userId)
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");

  const reports = await getMyInterviewReports(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Reports fetched successfully",
    data: reports,
  });
});

// ─── Controller 5: Get Single Report by ID ─────────────────
const getReportById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id || req.user?._id;
  if (!userId)
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");

  const report = await getInterviewReportById(id as string, userId);
  if (!report) throw new ApiError(StatusCodes.NOT_FOUND, "Report not found");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Report fetched successfully",
    data: report,
  });
});

// ─── Export ─────────────────────────────────────────────────
export const InterviewController = {
  generateReport,
  downloadResumePdf,
  convertHtmlToPdf,
  getMyReports,
  getReportById,
};
