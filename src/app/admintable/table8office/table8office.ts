import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminReportPage } from '../shared/admin-report';
import { ReportActions } from '../shared/report-actions/report-actions';
import { AbstractTable } from '../shared/abstract-table/abstract-table';
import { AbstractResult, abstract16 } from '../shared/abstract12to16';

// Form16 — elected members, president, vice-president, admin page. Rows
// come from the backend's /form8/office/list, the same rows its PDF uses.
type Category = 'sc_st' | 'women' | 'general';

interface Person { form5_member_id: number | null; member_name: string; aadhar_no: string | null; }

interface OfficeRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  counts: { sc_st: number; women: number; general: number; total: number };
  members: Record<Category, Person[]>;
  president: { category: Category; person: Person } | null;
  vicePresident: { category: Category; person: Person } | null;
}

@Component({
  selector: 'app-table8office',
  standalone: true,
  imports: [CommonModule, ReportActions, AbstractTable],
  templateUrl: './table8office.html',
  styleUrls: ['../shared/admin-report.css', '../../form8office/form8office.css']
})
export class Table8Office extends AdminReportPage {

  abstract: AbstractResult = { groups: [], zones: [] };

  tableRows: OfficeRow[] = [];
  readonly today = new Date();

  readonly title = 'தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள், தலைவர், துணைத்தலைவர் விவரம்';

  readonly categories: Category[] = ['sc_st', 'women', 'general'];
  readonly categoryLabels = ['ப.இ/பகு', 'மகளிர்', 'பொது'];

  load(): void {
    this.userService.getForm8OfficeList(this.deptId, this.distId).subscribe({
      next: (res: any) => {
        const data = res?.success ? res.data : null;
        this.department_name = data?.departmentName && data.departmentName !== '-' ? data.departmentName : '';
        this.tableRows = data?.rows || [];
    // District / zone-wise abstract — same rules as the abstract PDF
    this.abstract = abstract16(this.tableRows);
      },
      error: err => { console.error(err); this.tableRows = []; }
    });
  }

  // People of one category in an office column (president / vice-president)
  office(o: OfficeRow['president'], c: Category): Person[] {
    return o && o.category === c ? [o.person] : [];
  }

  // Full Aadhaar number (this official report needs it), grouped in fours
  aadhar(value: string | null): string {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? digits.replace(/(\d{4})(?=\d)/g, '$1 ') : '-';
  }

  downloadPdf(): void {
    if (this.viewMode === 'abstract') {
      this.savePdf(this.userService.getOfficeAbstractPdf(this.deptId, this.distId), 'Form16_Abstract_Report.pdf');
    } else {
      this.savePdf(this.userService.getForm8OfficePdf(this.deptId, this.distId), 'Form16_Report.pdf');
    }
  }
}
