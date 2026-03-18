import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/file.middleware";



const interviewRoute = Router()



interviewRoute.post("/", requireAuth ,upload.single("resume") )