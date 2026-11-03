import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import { saveAs } from 'file-saver';

interface TableRow {
  district_name: string;
  zone_name: string;

  // Group 3 — filed societies & candidates (always shown)
  society_name: string;
  dec_sc: number;
  dec_women: number;
  dec_general: number;
  dec_total: number;

  // Group 4 — rejected during scrutiny (every society, 0s included)
  rejected_society_name: string;
  rej_sc: number;
  rej_women: number;
  rej_general: number;
  rej_total: number;

  // Group 5 — qualified nominations remaining (only when > 0)
  qualified_society_name: string;
  rem_sc: number;
  rem_women: number;
  rem_general: number;
  rem_total: number;

  // Group 6/7 — whole election stopped (only for stopped societies)
  stopped_society_name: string;
  stop_dec_sc: number | string;
  stop_dec_women: number | string;
  stop_dec_general: number | string;
  stop_dec_total: number | string;
  stop_reason_display: string;


  rowSpan?: number;
}

@Component({
  selector: 'app-formt5b',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formt5b.html',
  styleUrls: ['./formt5b.css']
})
export class Formt5b implements OnInit {

  tableRows: TableRow[] = [];
  department_name = '';

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_candidates', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  constructor(private userService: UserService) { }

  private resolveStopReason(soc: any): string {

    if (!soc.stop_reason) return '-';

    const opt = this.reasonOptions.find(r => r.value === soc.stop_reason);
    const label = opt?.label || soc.stop_reason;

    return soc.stop_reason === 'other' && soc.stop_other_reason_text
      ? `${label} - ${soc.stop_other_reason_text}`
      : label;
  }

  ngOnInit(): void {
    this.loadForm5B();
  }

  loadForm5B(): void {
    this.userService.getForm5blisttable().subscribe({
      next: (res) => {

        console.log("FORM5B RESPONSE:", res);

        const apiData = res?.data?.data;

        if (res?.success && apiData?.length > 0) {

          this.prepareRows(apiData);

        } else {
          this.tableRows = [];
        }

      },
      error: err => console.error(err)
    });
  }

  private buildRow(item: any, soc: any, isStopped: boolean): TableRow {

    const declared = soc.declared || {};
    const remaining = soc.remaining_after_stop || {};

    const stoppedCandidates = soc.stopped_candidates || [];
    const rejSc = stoppedCandidates.filter((c: any) => c.category_type === 'sc_st').length;
    const rejWomen = stoppedCandidates.filter((c: any) => c.category_type === 'women').length;
    const rejGeneral = stoppedCandidates.filter((c: any) => c.category_type === 'general').length;
    const rejTotal = rejSc + rejWomen + rejGeneral;

    const remSc = isStopped ? 0 : (remaining.sc_st || 0);
    const remWomen = isStopped ? 0 : (remaining.women || 0);
    const remGeneral = isStopped ? 0 : (remaining.general || 0);
    const remTotal = remSc + remWomen + remGeneral;

    return {
      district_name: item.district_name || '',
      zone_name: item.zone_name || '',

      society_name: soc.society_name || '-',
      dec_sc: declared.sc_st || 0,
      dec_women: declared.women || 0,
      dec_general: declared.general || 0,
      dec_total: declared.total || 0,

      // Every society is listed here, even with 0 rejections in all categories
      rejected_society_name: soc.society_name || '-',
      rej_sc: rejSc,
      rej_women: rejWomen,
      rej_general: rejGeneral,
      rej_total: rejTotal,

      qualified_society_name: remTotal > 0 ? (soc.society_name || '-') : '-',
      rem_sc: remSc,
      rem_women: remWomen,
      rem_general: remGeneral,
      rem_total: remTotal,

      stopped_society_name: isStopped ? (soc.society_name || '-') : '-',
      stop_dec_sc: isStopped ? (declared.sc_st || 0) : '-',
      stop_dec_women: isStopped ? (declared.women || 0) : '-',
      stop_dec_general: isStopped ? (declared.general || 0) : '-',
      stop_dec_total: isStopped ? (declared.total || 0) : '-',
      stop_reason_display: isStopped ? this.resolveStopReason(soc) : '-'
    };
  }

  private prepareRows(data: any[]): void {

    const rows: TableRow[] = [];

    data.forEach(item => {

      this.department_name = item.department_name || '';

      // District/zone merge across every society row belonging to this
      // item — it's one value per district/zone item, not per society.
      const active = item.active_societies || [];
      const stopped = item.stopped_societies || [];
      const totalRows = active.length + stopped.length;

      const activeRows = active.map((soc: any) => this.buildRow(item, soc, false));
      const stoppedRows = stopped.map((soc: any) => this.buildRow(item, soc, true));

      let isFirstRow = true;

      [...activeRows, ...stoppedRows].forEach((row: TableRow) => {
        row.rowSpan = isFirstRow ? totalRows : undefined;
        isFirstRow = false;
        rows.push(row);
      });

    });

    this.tableRows = rows;

    console.log('TABLE ROWS:', this.tableRows);
  }

  downloadPdf(): void {

    const departmentId = 2;

    this.userService.getForm5bPdf(departmentId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form5B_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }
}
