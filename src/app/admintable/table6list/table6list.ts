import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractGroup, AbstractZoneRow, AdminReportPage, zoneCollector } from '../shared/admin-report';
import { AbstractTable } from '../shared/abstract-table/abstract-table';
import { ReportActions } from '../shared/report-actions/report-actions';

// Form8 — "வேட்புமனு திரும்பப் பெறுதல் ... பெயர் விவரங்கள்" admin page.
// Same 3 groups as the user-side formt6list page (contesting / unopposed /
// cannot conduct), across every district for the admin.
interface Names { society: string; sc: string; women: string; general: string; }

interface TableRow {
  district_name: string;
  zone_name: string;
  contesting: Names | null;
  unopposed: Names | null;
  less: Names | null;
  stopped: { society: string; reason: string } | null;
  rowSpan?: number;
  serial?: number;
}

@Component({
  selector: 'app-table6list',
  standalone: true,
  imports: [CommonModule, ReportActions, AbstractTable],
  templateUrl: './table6list.html',
  styleUrls: ['../shared/admin-report.css']
})
export class Table6List extends AdminReportPage {

  tableRows: TableRow[] = [];
  abstractRows: AbstractZoneRow[] = [];

  readonly title = 'போட்டியின்றி தேர்ந்தெடுக்கப்பட்ட வேட்பாளர் பெயர் மற்றும் விவரம்';

  readonly abstractGroups: AbstractGroup[] = [
    { label: 'போட்டியிடும் வேட்பாளர் இறுதி பட்டியலின்படி தேர்தலில் போட்டியிடும் சங்கங்கள் மற்றும் வேட்பாளர்கள் பெயர்', subs: ['சங்கங்கள்', 'ப.இ./ப.கு', 'மகளிர்', 'பொது'] },
    { label: 'போட்டியிடும் இறுதி வேட்பாளர்கள் எண்ணிக்கையும் மற்றும் நிர்வாகக் குழு உறுப்பினர்கள் எண்ணிக்கையும் சமமாக இருந்து தேர்தலில் போட்டியின்றி தேர்ந்தெடுக்கப்பட்ட சங்கங்களின் பெயர்', subs: ['சங்கங்கள்', 'ப.இ./ப.கு', 'மகளிர்', 'பொது'] },
    { label: 'போட்டியிடும் இறுதி வேட்பாளர்கள் எண்ணிக்கையும் மற்றும் நிர்வாகக் குழு உறுப்பினர்கள் எண்ணிக்கையை விட குறைவாக இருந்து தேர்தலில் நடத்த இயலாத சங்கங்கள் பெயர்', subs: ['சங்கங்கள்', 'ப.இ./ப.கு', 'மகளிர்', 'பொது'] }
  ];

  load(): void {
    this.userService.loadForm6Filtered(this.deptId, this.distId).subscribe({
      next: (res: any) => this.prepare(res?.success ? (res.data?.data || []) : []),
      error: err => { console.error(err); this.prepare([]); }
    });
  }

  private prepare(forms: any[]): void {

    this.department_name = forms[0]?.department_name || '';

    const rows: TableRow[] = [];
    // [contesting: soc, sc, w, g][unopposed: soc, sc, w, g][less: soc, sc, w, g]
    const zones = zoneCollector(12);

    forms.forEach((form: any, formIndex: number) => {

      const start = rows.length;

      (form.societies || []).forEach((s: any) => {

        // A society stopped in Form6 appears in none of the 3 groups
        const isStopped = s.election_action === 'STOP';
        const status = isStopped ? '' : s.election_status;

        const scList: string[] = s.final_scst_names || [];
        const wList: string[] = s.final_women_names || [];
        const gList: string[] = s.final_general_names || [];

        const names: Names = {
          society: s.society_name || '-',
          sc: scList.join(', ') || '-',
          women: wList.join(', ') || '-',
          general: gList.join(', ') || '-'
        };

        rows.push({
          district_name: form.district_name || '-',
          zone_name: form.zone_name || '-',
          contesting: status === 'QUALIFIED' ? names : null,
          unopposed: status === 'UNOPPOSED' ? names : null,
          less: status === 'UNQUALIFIED' ? names : null,
          stopped: isStopped ? { society: s.society_name || '-', reason: s.remark || '-' } : null
        });

        const offset = status === 'QUALIFIED' ? 0 : status === 'UNOPPOSED' ? 4 : status === 'UNQUALIFIED' ? 8 : -1;
        if (offset >= 0) {
          const v = zones.get(form.district_name, form.zone_name);
          v[offset] += 1;
          v[offset + 1] += scList.length;
          v[offset + 2] += wList.length;
          v[offset + 3] += gList.length;
        }
      });

      if (rows.length > start) {
        rows[start].rowSpan = rows.length - start;
        rows[start].serial = formIndex + 1;
      }
    });

    this.tableRows = rows;
    this.abstractRows = zones.list();
  }

  downloadPdf(): void {
    if (this.viewMode === 'abstract') {
      this.savePdf(this.userService.getForm8ListAbstractPdf(this.deptId, this.distId), 'Form8_Abstract_Report.pdf');
    } else {
      this.savePdf(this.userService.getForm6ListPdf(this.deptId, this.distId), 'Form8_Report.pdf');
    }
  }
}
