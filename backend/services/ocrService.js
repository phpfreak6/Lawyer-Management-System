const fs = require('fs');
const Tesseract = require('tesseract.js');

/**
 * OCR Service for extracting text from documents
 * This enables search functionality on uploaded documents
 */

class OCRService {
  /**
   * Extract text from a document file
   * @param {string} filePath - Path to the document file
   * @returns {Promise<string>} Extracted text from the document
   */
  async extractText(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Use Tesseract.js for OCR (works with images, PDFs)
      const { data: { text } } = await Tesseract.recognize(
        filePath,
        'eng', // Language: English (can add 'hin' for Hindi)
        { logger: m => console.log(m) }
      );

      return text;
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract text from a PDF file
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromPDF(filePath) {
    try {
      // For PDF files, you might want to convert pages to images first
      // Using pdf-parse or similar library
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      // Fallback to OCR if PDF parsing fails
      return this.extractText(filePath);
    }
  }

  /**
   * Search documents by extracted text
   * @param {string} searchText - Text to search for
   * @param {number} tenantId - Tenant ID for data isolation
   * @returns {Promise<Array>} Matching documents
   */
  async searchDocuments(searchText, tenantId) {
    try {
      // This would query documents where extracted_text column contains the search text
      const pool = require('../config/database');
      const [documents] = await pool.execute(
        `SELECT cd.*, c.case_number, c.subject as case_subject 
         FROM case_documents cd
         JOIN cases c ON cd.case_id = c.id
         WHERE c.tenant_id = ? 
         AND cd.extracted_text LIKE ?
         ORDER BY cd.created_at DESC`,
        [tenantId, `%${searchText}%`]
      );

      return documents;
    } catch (error) {
      console.error('Document search error:', error);
      throw error;
    }
  }
}

module.exports = new OCRService();

