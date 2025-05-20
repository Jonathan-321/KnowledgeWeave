import { Request } from "express";
import { File } from "multer";

// Extend Express Request to include file property from Multer
export interface MulterRequest extends Request {
  file: File;
}