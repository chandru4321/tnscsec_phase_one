import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminReportPage } from '../shared/admin-report';
import { ReportActions } from '../shared/report-actions/report-actions';
import { AbstractTable } from '../shared/abstract-table/abstract-table';
import { AbstractResult, abstract13 } from '../shared/abstract12to16';

// Form13 — societies whose election did not complete, admin page. Rows come
// from the backend's /form8/incomplete/list, the same rows its PDF uses.
interface IncompleteRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  stage_form: string;   // (5a) form where it stopped
  stage_text: string;   // (5b) election stage
  marks: string[];
}

@Component({
  selector: 'app-table8incomplete',
  standalone: true,
  imports: [CommonModule, ReportActions, AbstractTable],
  templateUrl: './table8incomplete.html',
  styleUrls: ['../shared/admin-report.css', '../../form8incomplete/form8incomplete.css']
})
export class Table8Incomplete extends AdminReportPage {

  abstract: AbstractResult = { groups: [], zones: [] };

  tableRows: IncompleteRow[] = [];

  readonly title = 'தேர்தல் முடிவடையாத சங்கங்கள் விபரம்';

  // Columns 6–11 (same order as the backend's INCOMPLETE_COLUMNS)
  readonly reasonColumns = [
    'சட்ட ஒழுங்கு',
    'இயற்கை பேரிடர்',
    'நீதிமன்ற தடையாணை',
    'ஆணையத்தால் தேர்தல் ரத்து',
    'சிற்றெண் குறைவு',
    'இதர காரணங்கள்'
  ];

  load(): void {
    this.userService.getForm8IncompleteList(this.deptId, this.distId).subscribe({
      next: (res: any) => {
        const data = res?.success ? res.data : null;
        this.department_name = data?.departmentName && data.departmentName !== '-' ? data.departmentName : '';
        this.tableRows = data?.rows || [];
    // District / zone-wise abstract — same rules as the abstract PDF
    this.abstract = abstract13(this.tableRows);
      },
      error: err => { console.error(err); this.tableRows = []; }
    });
  }

  downloadPdf(): void {
    if (this.viewMode === 'abstract') {
      this.savePdf(this.userService.getIncompleteAbstractPdf(this.deptId, this.distId), 'Form13_Abstract_Report.pdf');
    } else {
      this.savePdf(this.userService.getForm8IncompletePdf(this.deptId, this.distId), 'Form13_Report.pdf');
    }
  }
}
