export interface PayslipDetail {
  id: number;
  component_type: 'earning' | 'deduction';
  component_name: string;
  amount: number;
  description?: string;
}

export interface Payslip {
  id: number;
  month: number;
  year: number;
  basic_salary: number;
  total_earnings: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  pph21: number;
  bpjs_kesehatan: number;
  bpjs_ketenagakerjaan: number;
  jht: number;
  total_working_days: number;
  present_days: number;
  half_days: number;
  late_days: number;
  absent_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  holiday_days: number;
  sick_leave_days: number;
  personal_leave_days: number;
  status: 'draft' | 'calculated' | 'submitted' | 'checked' | 'approved' | 'paid' | 'rejected';
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  details?: PayslipDetail[];
}
