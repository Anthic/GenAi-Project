import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/file.middleware";
import { InterviewController } from "./interviewAi.controller";

const interviewRoute = Router();

// POST /api/v1/interview/report
// Body (multipart/form-data): resume (file), selfDescription, jobDescription
interviewRoute.post(
  "/report",
  requireAuth,
  upload.single("resume"),
  InterviewController.generateReport,
);

// POST /api/v1/interview/resume-pdf
// Body (multipart/form-data): resume (file), selfDescription, jobDescription
// Response: PDF file download
interviewRoute.post(
  "/resume-pdf",
  requireAuth,
  upload.single("resume"),
  InterviewController.downloadResumePdf,
);

// POST /api/v1/interview/html-to-pdf
// Body (application/json): { html: string }
// Response: PDF file download
interviewRoute.post(
  "/html-to-pdf",
  requireAuth,
  InterviewController.convertHtmlToPdf,
);

// GET /api/v1/interview/my-reports
// Response: Array of Interview reports for the logged-in user
interviewRoute.get(
  "/my-reports",
  requireAuth,
  InterviewController.getMyReports,
);

// GET /api/v1/interview/report/:id
// Response: Single Interview report by its ID
interviewRoute.get(
  "/report/:id",
  requireAuth,
  InterviewController.getReportById,
);

export const InterviewRoutes = interviewRoute;