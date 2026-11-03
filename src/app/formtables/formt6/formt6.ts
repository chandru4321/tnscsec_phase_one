import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import { saveAs } from 'file-saver';

interface TableRow {
  district_name: string;
  zone_name: string;

  // Group: total committee members to be elected (Form4 seats)
  seat_sc: number;
  seat_women: number;
  seat_general: number;
  seat_total: number;

  // Group: qualified nominations count (before withdrawal)
  count_society_name: string;
  count_sc: number | string;
  count_women: number | string;
  count_general: number | string;
  count_total: number | string;

  // Group: withdrawn (only when > 0)
  w_society_name: string;
  w_sc: number | string;
  w_women: number | string;
  w_general: number | string;
  w_total: number | string;

  // Group: final qualified count = qualified − withdrawn
  fin_society_name: string;
  fin_sc: number | string;
  fin_women: number | string;
  fin_general: number | string;
  fin_total: number | string;

  // Group: UNOPPOSED (equal — no contest)
  eq_society_name: string;
  eq_sc: number | string;
  eq_women: number | string;
  eq_general: number | string;
  eq_total: number | string;

  // Group: UNQUALIFIED (less than required)
  less_society_name: string;
  less_sc: number | string;
  less_women: number | string;
  less_general: number | string;
  less_total: number | string;

  // Group: declared elected unopposed — UNOPPOSED societies, PLUS an
  // UNQUALIFIED society whose final candidate count is still >= 50% of the
  // required (rural) committee seats (partial committee declared unopposed
  // rather than going to a contested Form9 election).
  declared_society_name: string;
  declared_sc: number | string;
  declared_women: number | string;
  declared_general: number | string;
  declared_total: number | string;

  // Group: QUALIFIED — goes to polling
  final_society_name: string;
  final_sc: number | string;
  final_women: number | string;
  final_general: number | string;
  final_total: number | string;

  // Group: election stopped — name + reason. A society with
  // election_action "STOP" carries its free-text remark here, telling it
  // apart from an ordinary UNQUALIFIED (naturally short of candidates).
  stopped_society_name: string;
  stop_reason_display: string;

  rowSpan?: number;
}

@Component({
  selector: 'app-formt6',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formt6.html',
  styleUrls: ['./formt6.css']
})
export class Formt6 implements OnInit {

  department_name = '';
  tableRows: TableRow[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadForm6();
  }

  loadForm6(): void {
    this.userService.getForm6Table().subscribe({
      next: (res) => {

        console.log("FORM6 RESPONSE:", res);

        const apiData = res?.data?.data;

        if (!res?.success || !Array.isArray(apiData) || apiData.length === 0) {
          this.tableRows = [];
          return;
        }

        const main = apiData[0];

        this.department_name = main.department_name || '';

        const district = main.district_name || '';
        const zone = main.zone_name || '';

        const societies = main.societies || [];

        const rows: TableRow[] = [];

        const classified = societies.map((soc: any) => this.classify(soc));

        societies.forEach((soc: any, index: number) => {

          const { isQualified, isUnopposed, isUnqualified, isDeclaredUnopposed } = classified[index];

          // A society stopped entirely within Form6 belongs ONLY in the
          // "தேர்தல் நிறுத்தப்பட்ட சங்கங்கள்" group. The backend also sets
          // its election_status to UNQUALIFIED, so without this guard it
          // would ALSO show up (with 0s) under the unqualified group —
          // this keeps every other group blank for a stopped row.
          const isStopped = soc.election_action === 'STOP';

          const wSc = soc.withdrawn_counts?.sc_st || 0;
          const wWomen = soc.withdrawn_counts?.women || 0;
          const wGeneral = soc.withdrawn_counts?.general || 0;
          const wTotal = soc.withdrawn_counts?.total || 0;

          rows.push({
            district_name: district,
            zone_name: zone,

            // "மொத்த நிர்வாகக்குழு உறுப்பினர்களின் எண்ணிக்கை" — the
            // society's committee seats as entered in Form4
            seat_sc: soc.rural_sc_st || 0,
            seat_women: soc.rural_women || 0,
            seat_general: soc.rural_general || 0,
            seat_total: soc.rural_total || 0,

            // "தகுதிபெற்ற வேட்பு மனுக்கள் பட்டியல்படி..." = the valid-
            // nominations count BEFORE Form6 withdrawal (withdrawals are
            // subtracted separately in the next column group), so this
            // must add back wSc/wWomen/wGeneral — final_*_names already
            // excludes withdrawn candidates.
            count_society_name: isStopped ? '-' : (soc.society_name || '-'),
            count_sc: isStopped ? '-' : (soc.final_scst_names?.length || 0) + wSc,
            count_women: isStopped ? '-' : (soc.final_women_names?.length || 0) + wWomen,
            count_general: isStopped ? '-' : (soc.final_general_names?.length || 0) + wGeneral,
            count_total: isStopped ? '-' :
              (soc.final_scst_names?.length || 0) +
              (soc.final_women_names?.length || 0) +
              (soc.final_general_names?.length || 0) +
              wTotal,

            w_society_name: !isStopped ? (soc.society_name || '-') : '-',
            w_sc: isStopped ? '-' : wSc,
            w_women: isStopped ? '-' : wWomen,
            w_general: isStopped ? '-' : wGeneral,
            w_total: isStopped ? '-' : wTotal,

            // Column 4 − Column 5: the final candidate list (withdrawn
            // candidates are already excluded from final_*_names)
            fin_society_name: isStopped ? '-' : (soc.society_name || '-'),
            fin_sc: isStopped ? '-' : (soc.final_scst_names?.length || 0),
            fin_women: isStopped ? '-' : (soc.final_women_names?.length || 0),
            fin_general: isStopped ? '-' : (soc.final_general_names?.length || 0),
            fin_total: isStopped ? '-' :
              (soc.final_scst_names?.length || 0) +
              (soc.final_women_names?.length || 0) +
              (soc.final_general_names?.length || 0),

            eq_society_name: (!isStopped && isUnopposed) ? (soc.society_name || '-') : '-',
            eq_sc: (!isStopped && isUnopposed) ? (soc.final_sc_st || 0) : '-',
            eq_women: (!isStopped && isUnopposed) ? (soc.final_women || 0) : '-',
            eq_general: (!isStopped && isUnopposed) ? (soc.final_general || 0) : '-',
            eq_total: (!isStopped && isUnopposed) ? (soc.final_total || 0) : '-',

            less_society_name: (!isStopped && isUnqualified) ? (soc.society_name || '-') : '-',
            less_sc: (!isStopped && isUnqualified) ? (soc.final_sc_st || 0) : '-',
            less_women: (!isStopped && isUnqualified) ? (soc.final_women || 0) : '-',
            less_general: (!isStopped && isUnqualified) ? (soc.final_general || 0) : '-',
            less_total: (!isStopped && isUnqualified) ? (soc.final_total || 0) : '-',

            declared_society_name: (!isStopped && isDeclaredUnopposed) ? (soc.society_name || '-') : '-',
            declared_sc: (!isStopped && isDeclaredUnopposed) ? (soc.final_sc_st || 0) : '-',
            declared_women: (!isStopped && isDeclaredUnopposed) ? (soc.final_women || 0) : '-',
            declared_general: (!isStopped && isDeclaredUnopposed) ? (soc.final_general || 0) : '-',
            declared_total: (!isStopped && isDeclaredUnopposed) ? (soc.final_total || 0) : '-',

            final_society_name: (!isStopped && isQualified) ? (soc.society_name || '-') : '-',
            final_sc: (!isStopped && isQualified) ? (soc.final_sc_st || 0) : '-',
            final_women: (!isStopped && isQualified) ? (soc.final_women || 0) : '-',
            final_general: (!isStopped && isQualified) ? (soc.final_general || 0) : '-',
            final_total: (!isStopped && isQualified) ? (soc.final_total || 0) : '-',

            // A society stopped entirely within Form6 (as opposed to an
            // individual candidate withdrawal) carries election_action
            // "STOP" and a free-text remark — surface both here.
            stopped_society_name: isStopped ? (soc.society_name || '-') : '-',
            stop_reason_display: isStopped ? (soc.remark || '-') : '-',

            // Serial/district/zone merge into one cell spanning every
            // society row — the whole table is a single district/zone.
            rowSpan: index === 0 ? societies.length : undefined
          });

        });
        this.tableRows = rows;

      },
      error: err => console.error("FORM6 ERROR:", err)
    });
  }
  private classify(soc: any) {

    const isQualified = soc.election_status === 'QUALIFIED';
    const isUnopposed = soc.election_status === 'UNOPPOSED';
    const isUnqualified = soc.election_status === 'UNQUALIFIED';

    // Partial-committee rule: an UNQUALIFIED society still counts as
    // "declared elected unopposed" if its final candidates cover at
    // least half of the required (rural) committee seats. Mirrors
    // table6.ts (admin) exactly: this is NOT mutually exclusive with
    // isUnqualified above — such a society is meant to show in BOTH the
    // unqualified group and the declared-unopposed group.
    const requiredTotal = soc.rural_total || 0;
    const meetsPartialThreshold =
      requiredTotal > 0 && (soc.final_total || 0) >= requiredTotal * 0.5;

    const isDeclaredUnopposed =
      isUnopposed || (isUnqualified && meetsPartialThreshold);

    return { isQualified, isUnopposed, isUnqualified, isDeclaredUnopposed };
  }

  downloadPdf(): void {

    const departmentId = 2;

    this.userService.getForm6Pdf(departmentId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form6_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }
}
