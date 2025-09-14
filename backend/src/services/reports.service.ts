import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Define the reports directory
const REPORTS_DIR = path.join(process.cwd(), 'data', 'reports');

// Ensure reports directory exists
const ensureReportsDir = async () => {
  try {
    await fs.access(REPORTS_DIR);
  } catch {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    logger.info('Created reports directory');
  }
};

export interface SavedReport {
  id: string;
  company: string;
  purpose?: string;
  report: any;
  research: any;
  metadata: {
    company: string;
    attendeesCount: number;
    sourcesCount: number;
    generatedAt: string;
  };
  promptUsed: string;
  savedAt: string;
}

export interface ReportSummary {
  id: string;
  company: string;
  purpose?: string;
  generatedAt: string;
  savedAt: string;
  attendeesCount: number;
  sourcesCount: number;
}

class ReportsService {
  
  async saveReport(reportData: Omit<SavedReport, 'id' | 'savedAt'>): Promise<string> {
    await ensureReportsDir();
    
    const reportId = uuidv4();
    const savedAt = new Date().toISOString();
    
    const savedReport: SavedReport = {
      id: reportId,
      ...reportData,
      savedAt,
    };
    
    const fileName = `${reportId}.json`;
    const filePath = path.join(REPORTS_DIR, fileName);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(savedReport, null, 2));
      logger.info(`Report saved successfully: ${reportId} for company: ${reportData.company}`);
      return reportId;
    } catch (error) {
      logger.error('Error saving report:', error);
      throw new Error('Failed to save report');
    }
  }

  async getReport(reportId: string): Promise<SavedReport | null> {
    const filePath = path.join(REPORTS_DIR, `${reportId}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent) as SavedReport;
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return null; // File not found
      }
      logger.error('Error reading report:', error);
      throw new Error('Failed to read report');
    }
  }

  async listReports(): Promise<ReportSummary[]> {
    await ensureReportsDir();
    
    try {
      const files = await fs.readdir(REPORTS_DIR);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const reports: ReportSummary[] = [];
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(REPORTS_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const report = JSON.parse(fileContent) as SavedReport;
          
          reports.push({
            id: report.id,
            company: report.company,
            purpose: report.purpose,
            generatedAt: report.metadata.generatedAt,
            savedAt: report.savedAt,
            attendeesCount: report.metadata.attendeesCount,
            sourcesCount: report.metadata.sourcesCount,
          });
        } catch (error) {
          logger.warn(`Error reading report file ${file}:`, error);
          // Skip corrupted files
        }
      }
      
      // Sort by generated date (newest first)
      return reports.sort((a, b) => 
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
    } catch (error) {
      logger.error('Error listing reports:', error);
      throw new Error('Failed to list reports');
    }
  }

  async deleteReport(reportId: string): Promise<boolean> {
    const filePath = path.join(REPORTS_DIR, `${reportId}.json`);
    
    try {
      await fs.unlink(filePath);
      logger.info(`Report deleted: ${reportId}`);
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return false; // File not found
      }
      logger.error('Error deleting report:', error);
      throw new Error('Failed to delete report');
    }
  }

  async searchReports(companyQuery: string): Promise<ReportSummary[]> {
    const allReports = await this.listReports();
    
    if (!companyQuery) {
      return allReports;
    }
    
    const query = companyQuery.toLowerCase();
    return allReports.filter(report => 
      report.company.toLowerCase().includes(query) ||
      report.purpose?.toLowerCase().includes(query)
    );
  }
}

export default new ReportsService();
