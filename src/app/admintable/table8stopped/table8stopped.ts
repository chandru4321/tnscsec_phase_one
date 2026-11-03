import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractGroup, AbstractZoneRow, AdminReportPage, zoneCollector } from '../shared/admin-report';
import { AbstractTable } from '../shared/abstract-table/abstract-table';
import { ReportActions } from '../shared/report-actions/report-actions';

// Form12 — stopped societies, admin page. Rows come from the backend's
// /form8/stopped/list (Form1, Form4, Form5b, Form6 and Form7 combined),
// the same rows its PDFs use.
interface StoppedRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  stage: string;
  reason: string;
}

@Component({
  selector: 'app-table8stopped',
  standalone: true,
  imports: [CommonModule, ReportActions, AbstractTable],
  templateUrl: './table8stopped.html',
  styleUrls: ['../shared/admin-report.css']
})
export class Table8Stopped extends AdminReportPage {

  tableRows: StoppedRow[] = [];
  abstractRows: AbstractZoneRow[] = [];

  readonly title = 'தேர்தல் நிறுத்தப்பட்ட சங்கங்களின் விவரம்';

  readonly abstractGroups: AbstractGroup[] = [
    { label: 'தேர்தல் நிறுத்தப்பட்ட சங்கங்களின் எண்ணிக்கை' }
  ];

  load(): void {
    this.userService.getForm12List(this.deptId, this.distId).subscribe({
      next: (res: any) => this.prepare(res?.success ? res.data : null),
      error: err => { console.error(err); this.prepare(null); }
    });
  }

  private prepare(data: any): void {

    this.department_name = data?.departmentName && data.departmentName !== '-' ? data.departmentName : '';
    this.tableRows = data?.rows || [];

    const zones = zoneCollector(1);
    this.tableRows.forEach(r => zones.get(r.district_name, r.zone_name)[0] += 1);
    this.abstractRows = zones.list();
  }

  downloadPdf(): void {
    if (this.viewMode === 'abstract') {
      this.savePdf(this.userService.getForm12AbstractPdf(this.deptId, this.distId), 'Form12_Abstract_Report.pdf');
    } else {
      this.savePdf(this.userService.getForm8StoppedPdf(this.deptId, this.distId), 'Form12_Report.pdf');
    }
  }
}
