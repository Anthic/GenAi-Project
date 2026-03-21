import mongoose, { Document, Schema } from "mongoose";

/* ---------- Sub Types ---------- */

interface IQuestion {
  question: string;
  answer: string;
  intention: string;
}

interface ISkillGap {
  skill: string;
  severity: "low" | "medium" | "high";
}

interface IPreparationGap {
  day: number;
  focus: string;
  tasks: string[];
}

/* ---------- Main Interface ---------- */

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;
  jobDescription: string[];
  resumeText: string[];
  selfDescription: string[];
  matchScore: number;

  technicalQuestions: IQuestion[];
  behaviouralQuestions: IQuestion[];
  skillGap: ISkillGap[];
  preparationGap: IPreparationGap[];
}

/* ---------- Sub Schemas ---------- */

const questionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    intention: { type: String, default: "" },
  },
  { _id: false },
);

const skillGapSchema = new Schema<ISkillGap>(
  {
    skill: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
  },
  { _id: false },
);

const preparationGapSchema = new Schema<IPreparationGap>(
  {
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    tasks: [{ type: String }],
  },
  { _id: false },
);

/* ---------- Main Schema ---------- */

const interviewSchema = new Schema<IInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    jobDescription: [{ type: String, required: true }],
    resumeText: [{ type: String, required: true }],
    selfDescription: [{ type: String, required: true }],

    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    technicalQuestions: [questionSchema],
    behaviouralQuestions: [questionSchema],

    skillGap: [skillGapSchema],
    preparationGap: [preparationGapSchema],
  },
  {
    timestamps: true,
  },
);

/* ---------- Model ---------- */

export const Interview = mongoose.model<IInterview>(
  "Interview",
  interviewSchema,
);
