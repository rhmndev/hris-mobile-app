import { httpClient } from '../https';
import type { Payslip } from './types';

export class PayslipService {
  async getCurrentPayslip(month: number, year: number): Promise<Payslip> {
    try {
      const response: any = await httpClient.get(
        `/employee/payslips/${month}/${year}`
      );
      // Backend returns { message, data }, httpClient already parses JSON
      return response.data;
    } catch (error) {
      console.error('Error fetching current payslip:', error);
      throw error;
    }
  }

  async getLatestPayslip(): Promise<Payslip> {
    try {
      const response: any = await httpClient.get(
        `/employee/payslips/latest`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching latest payslip:', error);
      throw error;
    }
  }

  async getPayslipHistory(months: number = 12): Promise<Payslip[]> {
    try {
      const response: any = await httpClient.get(
        `/employee/payslips/history?months=${months}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payslip history:', error);
      throw error;
    }
  }

  async getPayslipDetail(payrollId: number): Promise<Payslip> {
    try {
      const response: any = await httpClient.get(
        `/employee/payslips/${payrollId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payslip detail:', error);
      throw error;
    }
  }

  async downloadPayslipPDF(payslip: Payslip): Promise<void> {
    try {
      const response: any = await httpClient.get(
        `/employee/payslips/${payslip.id}/download`
      );
      
      // Use pdfGenerator to create PDF on client side
      const { generatePayslipPDF } = await import('../../utils/pdfGenerator');
      generatePayslipPDF(response.data, response.employee, response.designation);
    } catch (error) {
      console.error('Error downloading payslip PDF:', error);
      throw error;
    }
  }

  async sharePayslip(payrollId: number, email?: string): Promise<void> {
    try {
      const payload: any = {};
      if (email) {
        payload.email = email;
      }

      await httpClient.post(
        `/employee/payslips/${payrollId}/share`,
        payload
      );
    } catch (error) {
      console.error('Error sharing payslip:', error);
      throw error;
    }
  }
}
