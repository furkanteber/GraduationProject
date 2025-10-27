// src/models/FormData.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface IFormData extends Document {
  name: string;
  email: string;
  job: string;
  skills: string[];
  targetArea:string;
  targetPozision:string;
  companyType:string;
  educationLevel:string;
  section:string;
  experienceTime:string;
  department:string;
  summary: string;
  createdAt: Date;
}

const FormDataSchema = new Schema<IFormData>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    job: { type: String, required: false },
    skills: { type: [String], default: [] },
    targetArea:{ type: String, required: false },
    targetPozision:{ type: String, required: false },
    companyType:{ type: String, required: false },
    educationLevel:{ type: String, required: true },
    section:{ type: String, required: true },
    experienceTime:{ type: String, required: false },
    department:{ type: String, required: false },
    summary: { type: String, required: false },
  },
  { timestamps: true }
);

export default models.FormData || mongoose.model<IFormData>("FormData", FormDataSchema);
