import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// One row per candidate-index... no — one row per society (district/zone
// merge across every society row belonging to that form, via rowSpan; an
// unfiltered "All districts" admin view can contain several forms, so
// district/zone are per-row, not a single value for the whole table).
interface TableRow {
  district_name: string;
  zone_name: string;

  // Total committee members to be elected (Form4 seats)
  seat_sc: number;
  seat_women: number;
  seat_general: number;
  seat_total: number;

  count_society_name: string;
  count_sc: number | string;
  count_women: number | string;
  count_general: number | string;
  count_total: number | string;

  w_society_name: string;
  w_sc: number | string;
  w_women: number | string;
  w_general: number | string;
  w_total: number | string;

  // Final qualified count = qualified − withdrawn
  fin_society_name: string;
  fin_sc: number | string;
  fin_women: number | string;
  fin_general: number | string;
  fin_total: number | string;

  eq_society_name: string;
  eq_sc: number | string;
  eq_women: number | string;
  eq_general: number | string;
  eq_total: number | string;

  less_society_name: string;
  less_sc: number | string;
  less_women: number | string;
  less_general: number | string;
  less_total: number | string;

  declared_society_name: string;
  declared_sc: number | string;
  declared_women: number | string;
  declared_general: number | string;
  declared_total: number | string;

  final_society_name: string;
  final_sc: number | string;
  final_women: number | string;
  final_general: number | string;
  final_total: number | string;

  stopped_society_name: string;
  stop_reason_display: string;

  rowSpan?: number;
  serial?: number;
}

// One count group of the abstract: number of societies plus the candidate
// counts (ப.இ./ப.கு, மகளிர், பொது, மொத்தம்) summed over those societies.
interface AbstractBucket {
  soc: number;
  sc: number;
  women: number;
  general: number;
  total: number;
}

// District/zone-wise summary — same column groups (4 to 12) as the Full
// List, with each group's societies counted and candidate counts summed.
interface AbstractRow {
  district_name: string;
  zone_name: string;
  zone_count: number;
  seats: AbstractBucket;     // 4  committee seats (Form4) — soc unused
  count: AbstractBucket;     // 5  qualified nominations
  w: AbstractBucket;         // 6  withdrawn
  fin: AbstractBucket;       // 7  final qualified count (5 − 6)
  eq: AbstractBucket;        // 8  unopposed (equal)
  less: AbstractBucket;      // 9  no election (less)
  declared: AbstractBucket;  // 10 declared elected unopposed
  final: AbstractBucket;     // 11 polling required
  stopped: number;           // 12 stopped societies
}

const emptyBucket = (): AbstractBucket => ({ soc: 0, sc: 0, women: 0, general: 0, total: 0 });

const emptyAbstractRow = (district_name = '', zone_name = '', zone_count = 0): AbstractRow => ({
  district_name,
  zone_name,
  zone_count,
  seats: emptyBucket(),
  count: emptyBucket(),
  w: emptyBucket(),
  fin: emptyBucket(),
  eq: emptyBucket(),
  less: emptyBucket(),
  declared: emptyBucket(),
  final: emptyBucket(),
  stopped: 0
});

const addToBucket = (b: AbstractBucket, sc: number, women: number, general: number, total: number, countSociety = true): void => {
  if (countSociety) b.soc += 1;
  b.sc += sc;
  b.women += women;
  b.general += general;
  b.total += total;
};

const BUCKET_KEYS = ['count', 'w', 'fin', 'eq', 'less', 'declared', 'final'] as const;

@Component({
  selector: 'app-table6',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './table6.html',
  styleUrls: ['./table6.css']
})
export class Table6 implements OnInit {

  department_name = '';
  tableRows: TableRow[] = [];
  abstractRows: AbstractRow[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  grandTotal: AbstractRow = emptyAbstractRow();

  // Abstract groups 5–11, each shown as சங்கங்கள் / ப.இ./ப.கு / மகளிர் / பொது / மொத்தம்
  readonly fiveColumnGroups = ['count', 'w', 'fin', 'eq', 'less', 'declared', 'final'] as const;

  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDistricts();
    this.loadForm6();
  }

  private prepareRows(apiData: any): void {

    const forms = apiData.data || [];

    const rows: TableRow[] = [];
    const abstractGroups = new Map<string, AbstractRow>();

    forms.forEach((item: any, formIndex: number) => {

      const district = item.district_name || '-';
      const zone = item.zone_name || '-';
      const societies = item.societies || [];

      const groupStartIndex = rows.length;

      societies.forEach((soc: any) => {

        const isQualified = soc.election_status === 'QUALIFIED';
        const isUnopposed = soc.election_status === 'UNOPPOSED';
        const isUnqualified = soc.election_status === 'UNQUALIFIED';

        // Partial-committee rule: an UNQUALIFIED society still counts as
        // "declared elected unopposed" if its final candidates cover at
        // least half of the required (rural) committee seats.
        const requiredTotal = soc.rural_total || 0;
        const meetsPartialThreshold =
          requiredTotal > 0 && (soc.final_total || 0) >= requiredTotal * 0.5;

        const isDeclaredUnopposed =
          isUnopposed || (isUnqualified && meetsPartialThreshold);

        // A society stopped entirely within Form6 belongs ONLY in the
        // "தேர்தல் நிறுத்தப்பட்ட சங்கங்கள்" group. The backend also sets
        // its election_status to UNQUALIFIED, so without this guard it
        // would ALSO show up (with 0s) under the unqualified group — this
        // keeps every other group blank for a stopped row.
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
          // subtracted separately in the next column group), so this must
          // add back wSc/wWomen/wGeneral — final_*_names already excludes
          // withdrawn candidates.
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

          rowSpan: undefined
        });

        // Abstract: add this society to the same groups it fills in the
        // Full List row above, so each abstract cell is the sum of that
        // Full List column for the district/zone.
        const abstractKey = `${district}||${zone}`;
        if (!abstractGroups.has(abstractKey)) {
          abstractGroups.set(abstractKey, emptyAbstractRow(district, zone, 1));
        }
        const ag = abstractGroups.get(abstractKey)!;

        const decSc = soc.final_scst_names?.length || 0;
        const decWomen = soc.final_women_names?.length || 0;
        const decGeneral = soc.final_general_names?.length || 0;

        // Committee seats count for every society, stopped ones included
        addToBucket(ag.seats, soc.rural_sc_st || 0, soc.rural_women || 0,
          soc.rural_general || 0, soc.rural_total || 0);

        if (isStopped) {
          ag.stopped += 1;
        } else {
          const fSc = soc.final_sc_st || 0;
          const fWomen = soc.final_women || 0;
          const fGeneral = soc.final_general || 0;
          const fTotal = soc.final_total || 0;

          if (isQualified) addToBucket(ag.final, fSc, fWomen, fGeneral, fTotal);

          addToBucket(ag.count, decSc + wSc, decWomen + wWomen, decGeneral + wGeneral,
            decSc + decWomen + decGeneral + wTotal);

          addToBucket(ag.w, wSc, wWomen, wGeneral, wTotal, wTotal > 0);

          addToBucket(ag.fin, decSc, decWomen, decGeneral, decSc + decWomen + decGeneral);

          if (isUnopposed) addToBucket(ag.eq, fSc, fWomen, fGeneral, fTotal);
          if (isUnqualified) addToBucket(ag.less, fSc, fWomen, fGeneral, fTotal);
          if (isDeclaredUnopposed) addToBucket(ag.declared, fSc, fWomen, fGeneral, fTotal);
        }

      });

      if (rows.length > groupStartIndex) {
        rows[groupStartIndex].rowSpan = rows.length - groupStartIndex;
        // வ.எண் numbers each district/zone GROUP (1, 2, 3, ...), not every
        // flattened society row — otherwise the second group would start
        // at however many society rows the first group had, not "2".
        rows[groupStartIndex].serial = formIndex + 1;
      }

    });

    this.tableRows = rows;

    this.abstractRows = Array.from(abstractGroups.values());

    this.computeGrandTotal();

  }

  private computeGrandTotal(): void {

    const totals = emptyAbstractRow();

    this.abstractRows.forEach(a => {
      totals.zone_count += a.zone_count;
      totals.stopped += a.stopped;
      totals.seats.sc += a.seats.sc;
      totals.seats.women += a.seats.women;
      totals.seats.general += a.seats.general;
      totals.seats.total += a.seats.total;
      BUCKET_KEYS.forEach(k => {
        totals[k].soc += a[k].soc;
        totals[k].sc += a[k].sc;
        totals[k].women += a[k].women;
        totals[k].general += a[k].general;
        totals[k].total += a[k].total;
      });
    });

    this.grandTotal = totals;

  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }

  loadDepartments(): void {

    this.userService.getdepartment().subscribe((res: any) => {

      if (res?.success) {

        this.departmentList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({
            id: d.id,
            name: d.name.trim()
          }));

      }

    });

  }

  loadDistricts(): void {

    this.userService.getdistrict().subscribe((res: any) => {

      if (res?.success) {

        this.districtList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({
            id: d.id,
            name: d.name.trim()
          }));

      }

    });

  }

  applyFilter(): void {

    const deptId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const distId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    this.userService.loadForm6Filtered(deptId, distId)
      .subscribe({

        next: (res: any) => {

          const apiData = res?.data;

          if (!res?.success || !apiData) {
            this.tableRows = [];
            this.abstractRows = [];
            this.computeGrandTotal();
            return;
          }

          this.department_name = apiData.department_name || '';

          this.prepareRows(apiData);

        },

        error: err => console.error(err)

      });

  }

  loadForm6(): void {

    this.userService.getForm6Table().subscribe({

      next: (res: any) => {

        if (!res.success) {
          this.tableRows = [];
          this.abstractRows = [];
          this.computeGrandTotal();
          return;
        }

        this.department_name = res.data?.data?.[0]?.department_name || '';

        this.prepareRows(res.data);

      }

    });

  }

  downloadPdf(): void {

    const deptId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const distId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    if (this.viewMode === 'abstract') {
      this.userService.getForm6AbstractPdf(deptId, distId).subscribe({
        next: (res: Blob) => {
          saveAs(new Blob([res], { type: 'application/pdf' }), 'Form6_Abstract_Report.pdf');
        },
        error: err => console.error('Abstract PDF download error:', err)
      });
      return;
    }

    this.userService.getForm6Pdf(deptId, distId)
      .subscribe({

        next: (res: Blob) => {

          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form6_Report.pdf'
          );

        },

        error: err => console.error(err)

      });

  }
}
