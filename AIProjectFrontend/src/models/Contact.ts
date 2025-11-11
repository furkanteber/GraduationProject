import mongoose, { Schema, Document, models } from "mongoose";

export interface IFormData extends Document{
    name:string;
    email:string;
    subject:string;
    message:string;
    createdAt:Date;
}

const FormDataSchema = new Schema<IFormData>(
    {
    name: {type: String, required:true },
    email: {type: String, required:true},
    subject: {type: String, required:true},
    message : {type: String, required:true}
   },
   {
    timestamps: true 
   } 
);

export default models.FormData || mongoose.model<IFormData>("Contact", FormDataSchema);