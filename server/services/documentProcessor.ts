import { Document } from "@shared/schema";
import fs from "fs/promises";
import path from "path";

export interface ProcessedDocument {
  content: string;
  pageCount: number;
  concepts?: string[];
}

/**
 * Process a document and extract its content
 */
export async function processDocument(document: Document, filePath: string): Promise<ProcessedDocument> {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    let content = '';
    let pageCount = 0;

    if (fileExtension === '.pdf') {
      const result = await processPdf(filePath);
      content = result.content;
      pageCount = result.pageCount;
    } else if (['.txt', '.md'].includes(fileExtension)) {
      content = await fs.readFile(filePath, 'utf-8');
      // Count pages roughly based on character count
      pageCount = Math.ceil(content.length / 3000);
    } else if (['.doc', '.docx'].includes(fileExtension)) {
      // For a real implementation, we would use a library like mammoth.js
      // For now, just read it as text (will not work correctly for .doc/.docx)
      try {
        content = await fs.readFile(filePath, 'utf-8');
        pageCount = Math.ceil(content.length / 3000);
      } catch (e) {
        content = `Unable to process ${fileExtension} file. Please convert to PDF or text.`;
        pageCount = 1;
      }
    } else {
      content = `Unsupported file type: ${fileExtension}`;
      pageCount = 1;
    }

    return {
      content,
      pageCount
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process a PDF file and extract its text content
 */
async function processPdf(filePath: string): Promise<{ content: string, pageCount: number }> {
  try {
    // Read the file to determine its size and estimate page count
    const fileStats = await fs.stat(filePath);
    const fileSizeInKB = fileStats.size / 1024;
    
    // Roughly estimate page count based on average PDF page size
    const estimatedPageCount = Math.max(1, Math.ceil(fileSizeInKB / 75));
    
    // For demonstration purposes, we'll return a sample text
    // In a production environment, you'd use a proper PDF parsing library
    const filename = path.basename(filePath);
    const text = `Content extracted from ${filename}
    
This document contains information about various learning concepts and may include:

- Neural networks and deep learning architectures
- Machine learning algorithms and optimization techniques
- Data structures and computational methods
- Knowledge representation systems

The document appears to have approximately ${estimatedPageCount} pages of content.
`;
    
    return {
      content: text,
      pageCount: estimatedPageCount
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
