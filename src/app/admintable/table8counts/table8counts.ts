import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminReportPage } from '../shared/admin-report';
import { ReportActions } from '../shared/report-actions/report-actions';
import { AbstractTable } from '../shared/abstract-table/abstract-table';
import { AbstractResult, abstract12 } from '../shared/abstract12to16';

// Form12 — elected committee member counts, admin page. Same rows as the
// Form11 names page (/form8/name/list), counted per category.
type Names = { sc_st: string[]; women: string[]; general: string[] };

interface Counts { sc: number; women: number; general: number; total: number; }

interface CountRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  seats: Counts;                // committee seats (Form4)
  unopposed: Counts | null;
  aboveHalfQuorum: Counts | null;
  winners: Counts | null;
  overall: Counts;
  rowSpan?: number;
  serial?: number;
}

const toCounts = (n: Names | null): Counts | null => {
  if (!n) return null;
  const sc = n.sc_st.length, women = n.women.length, general = n.general.length;
  return { sc, women, general, total: sc + women + general };
};

const addCounts = (a: Counts, b: Counts | null): Counts =>
  b ? { sc: a.sc + b.sc, women: a.women + b.women, general: a.general + b.general, total: a.total + b.total } : a;

const ZERO: Counts = { sc: 0, women: 0, general: 0, total: 0 };

@Component({
  selector: 'app-table8counts',
  standalone: true,
  imports: [CommonModule, ReportActions, AbstractTable],
  templateUrl: './table8counts.html',
  styleUrls: ['../shared/admin-report.css', '../../form8counts/form8counts.css']
})
export class Table8Counts extends AdminReportPage {

  abstract: AbstractResult = { groups: [], zones: [] };

  tableRows: CountRow[] = [];

  // Column totals for the மொத்தம் row: [seats, unopposed, quorum, polling, overall]
  totals: Counts[] = [ZERO, ZERO, ZERO, ZERO, ZERO];

  readonly title = 'தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள் எண்ணிக்கை விபரம்';

  load(): void {
    this.userService.getForm11List(this.deptId, this.distId).subscribe({
      next: (res: any) => this.prepare(res?.success ? res.data : null),
      error: err => { console.error(err); this.prepare(null); }
    });
  }

  private prepare(data: any): void {

    this.department_name = data?.departmentName && data.departmentName !== '-' ? data.departmentName : '';

    // Form 12 counts elected members only — societies stopped at polling /
    // counting (shown on Form 11) are left out
    const rows: CountRow[] = (data?.rows || []).filter((r: any) => !r.stopped).map((r: any) => {
      const unopposed = toCounts(r.unopposed);
      const aboveHalfQuorum = toCounts(r.aboveHalfQuorum);
      const winners = toCounts(r.winners);
      return {
        district_name: r.district_name,
        zone_name: r.zone_name,
        society_name: r.society_name,
        seats: {
          sc: r.seats?.sc_st || 0,
          women: r.seats?.women || 0,
          general: r.seats?.general || 0,
          total: r.seats?.total || 0
        },
        unopposed,
        aboveHalfQuorum,
        winners,
        overall: addCounts(addCounts(addCounts(ZERO, unopposed), aboveHalfQuorum), winners)
      };
    });

    // Serial + merged district/zone cells per district/zone group
    let serial = 0;
    rows.forEach((r, i) => {
      const prev = rows[i - 1];
      if (!prev || prev.district_name !== r.district_name || prev.zone_name !== r.zone_name) {
        let span = 1;
        while (rows[i + span] && rows[i + span].district_name === r.district_name && rows[i + span].zone_name === r.zone_name) span++;
        r.rowSpan = span;
        r.serial = ++serial;
      }
    });

    this.totals = [
      rows.reduce((t, r) => addCounts(t, r.seats), ZERO),
      rows.reduce((t, r) => addCounts(t, r.unopposed), ZERO),
      rows.reduce((t, r) => addCounts(t, r.aboveHalfQuorum), ZERO),
      rows.reduce((t, r) => addCounts(t, r.winners), ZERO),
      rows.reduce((t, r) => addCounts(t, r.overall), ZERO)
    ];

    this.tableRows = rows;
    // District / zone-wise abstract — same rules as the abstract PDF
    this.abstract = abstract12(data?.rows || []);
  }

  // Cells for a group: '-' when the society is not in that group
  cells(c: Counts | null): (number | string)[] {
    return c ? [c.sc, c.women, c.general, c.total] : ['-', '-', '-', '-'];
  }

  downloadPdf(): void {
    if (this.viewMode === 'abstract') {
      this.savePdf(this.userService.getCountAbstractPdf(this.deptId, this.distId), 'Form12_Abstract_Report.pdf');
    } else {
      this.savePdf(this.userService.getForm8CountPdf(this.deptId, this.distId), 'Form12_Report.pdf');
    }
  }
}
