import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Stop reason codes (same as Form5B / Form7) → Tamil label
const STOP_REASONS: Record<string, string> = {
  legal_order: 'சட்ட ஒழுங்கு',
  natural_disaster: 'இயற்கை பேரிடர்',
  court_injunction: 'நீதிமன்ற தடையாணை',
  election_cancelled_by_commission: 'ஆணையத்தால் தேர்தல் ரத்து',
  insufficient_candidates: 'சிற்றெண் குறைவு',
  other: 'இதர காரணங்கள்'
};

const stopReasonLabel = (soc: any): string => {
  const label = STOP_REASONS[soc.stop_reason] || soc.stop_reason || '-';
  return soc.stop_reason === 'other' && soc.stop_other_reason_text
    ? `${label} - ${soc.stop_other_reason_text}` : label;
};

interface TableRow {
  district_name: string;
  zone_name: string;

  // Society name lands in exactly one of these two, depending on whether
  // the society gave its own member list or the officer drafted it himself.
  member_society_name: string | null;
  non_member_society_name: string | null;

  member_count: number;
  non_member_count: number;

  ass_memlist: number | null;   // draft voter list count
  ero_claim: string;            // 'ஆம்' | 'இல்லை' | '-'
  jcount: number;               // removed (நீக்கப்பட்ட)
  rcount: number;               // added (சேர்க்கப்பட்ட)
  total: number | null;         // final voter list count

  // Election stopped at Form3 — name + reason
  stopped_society_name: string;
  stop_reason_display: string;

  rowSpan?: number;
  districtSerial?: number;
}

// One row per district with everything summed across all its circles —
// no per-society names, counts only. zone_count is how many distinct
// circles were rolled into this district's totals.
interface AbstractRow {
  district_name: string;
  zone_name: string;
  zone_count: number;
  societyCount: number;
  memberSocCount: number;
  memberSocMembers: number;      // draft-list members of the societies that gave a list
  nonMemberSocCount: number;
  nonMemberSocMembers: number;   // draft-list members of the societies that did not
  assMemlistTotal: number;
  rcountSocCount: number;        // societies with at least one member added
  rcountTotal: number;
  jcountSocCount: number;        // societies with at least one member removed
  jcountTotal: number;
  finalVotersTotal: number;
  stoppedCount: number;
}

@Component({
  selector: 'app-formt3',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './table3.html',
  styleUrls: ['./table3.css']
})
export class Table3 implements OnInit {

  tableRows: TableRow[] = [];
  originalRows: TableRow[] = [];
  abstractRows: AbstractRow[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  grandTotal: AbstractRow = {
    district_name: '',
    zone_name: '',
    zone_count: 0,
    societyCount: 0,
    memberSocCount: 0,
    memberSocMembers: 0,
    nonMemberSocCount: 0,
    nonMemberSocMembers: 0,
    assMemlistTotal: 0,
    rcountSocCount: 0,
    rcountTotal: 0,
    jcountSocCount: 0,
    jcountTotal: 0,
    finalVotersTotal: 0,
    stoppedCount: 0
  };

  department_name = '';

  /* FILTER VALUES */
  selectedDepartment: string = '';
  selectedDistrict: string = '';

  /* MASTER LISTS */
  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {

    this.loadForm3();
    this.loadDepartments();
    this.loadDistricts();

  }

  /* =========================
     LOAD MASTER DATA
  ========================= */

  loadDepartments(): void {

    this.userService.getdepartment().subscribe((res: any) => {

      if (res?.success && Array.isArray(res.data)) {

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

      if (res?.success && Array.isArray(res.data)) {

        this.districtList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({
            id: d.id,
            name: d.name.trim()
          }));

      }

    });

  }

  /* =========================
     LOAD TABLE
  ========================= */

  loadForm3(): void {

    this.userService.loadForm3Table().subscribe({

      next: (res: any) => {

        const apiData = res?.data?.data;

        if (res?.success && Array.isArray(apiData) && apiData.length > 0) {

          this.department_name = apiData[0].department_name;

          this.prepareRows(apiData);

          this.originalRows = [...this.tableRows];

        } else {

          this.tableRows = [];

        }

      }

    });

  }

  /* =========================
     TRANSFORM DATA
  ========================= */

  private prepareRows(data: any[]): void {

    const rows: TableRow[] = [];

    let districtSerial = 0;

    data.forEach(item => {

      districtSerial += 1;

      const societies = item.societies || [];

      const span = societies.length;
      const memberCount = societies.filter((s: any) => s.is_member_list === true).length;

      societies.forEach((soc: any, index: number) => {

        const isMember = soc.is_member_list === true;

        rows.push({

          district_name: item.district_name,
          zone_name: item.zone_name,

          member_society_name: isMember ? soc.society_name : null,
          non_member_society_name: isMember ? null : soc.society_name,

          member_count: memberCount,
          non_member_count: span - memberCount,

          ass_memlist: soc.ass_memlist ?? null,

          ero_claim:
            soc.ero_claim === 1 ? 'ஆம்'
              : soc.ero_claim === 0 ? 'இல்லை'
                : '-',

          jcount: soc.jcount ?? 0,
          rcount: soc.rcount ?? 0,

          total: soc.total ?? null,

          stopped_society_name: soc.is_stopped ? soc.society_name : '-',
          stop_reason_display: soc.is_stopped ? stopReasonLabel(soc) : '-',

          rowSpan: index === 0 ? span : undefined,
          districtSerial: index === 0 ? districtSerial : undefined

        });

      });

    });

    this.tableRows = rows;

    this.buildAbstractRows();

  }

  /* =========================
     ABSTRACT (DISTRICT/ZONE-WISE SUMMARY)
  ========================= */
  private buildAbstractRows(): void {

    const groups = new Map<string, AbstractRow>();

    this.tableRows.forEach(r => {

      const key = `${r.district_name}||${r.zone_name}`;

      if (!groups.has(key)) {
        groups.set(key, {
          district_name: r.district_name,
          zone_name: r.zone_name,
          zone_count: 1,
          societyCount: 0,
          memberSocCount: 0,
          memberSocMembers: 0,
          nonMemberSocCount: 0,
          nonMemberSocMembers: 0,
          assMemlistTotal: 0,
          rcountSocCount: 0,
          rcountTotal: 0,
          jcountSocCount: 0,
          jcountTotal: 0,
          finalVotersTotal: 0,
          stoppedCount: 0
        });
      }

      const g = groups.get(key)!;

      g.societyCount += 1;
      if (r.member_society_name) {
        g.memberSocCount += 1;
        g.memberSocMembers += r.ass_memlist ?? 0;
      }
      if (r.non_member_society_name) {
        g.nonMemberSocCount += 1;
        g.nonMemberSocMembers += r.ass_memlist ?? 0;
      }

      g.assMemlistTotal += r.ass_memlist ?? 0;
      if ((r.rcount ?? 0) > 0) g.rcountSocCount += 1;
      g.rcountTotal += r.rcount ?? 0;
      if ((r.jcount ?? 0) > 0) g.jcountSocCount += 1;
      g.jcountTotal += r.jcount ?? 0;
      g.finalVotersTotal += r.total ?? 0;
      if (r.stopped_society_name !== '-') g.stoppedCount += 1;

    });

    this.abstractRows = Array.from(groups.values());

    this.computeGrandTotal();
  }

  // Sum of every district's abstract totals — reflects whatever
  // Department/District filter produced the current tableRows.
  private computeGrandTotal(): void {

    const totals: AbstractRow = {
      district_name: '',
      zone_name: '',
      zone_count: 0,
      societyCount: 0,
      memberSocCount: 0,
      memberSocMembers: 0,
      nonMemberSocCount: 0,
      nonMemberSocMembers: 0,
      assMemlistTotal: 0,
      rcountSocCount: 0,
      rcountTotal: 0,
      jcountSocCount: 0,
      jcountTotal: 0,
      finalVotersTotal: 0,
      stoppedCount: 0
    };

    this.abstractRows.forEach(g => {
      totals.zone_count += g.zone_count;
      totals.societyCount += g.societyCount;
      totals.memberSocCount += g.memberSocCount;
      totals.memberSocMembers += g.memberSocMembers;
      totals.nonMemberSocCount += g.nonMemberSocCount;
      totals.nonMemberSocMembers += g.nonMemberSocMembers;
      totals.assMemlistTotal += g.assMemlistTotal;
      totals.rcountSocCount += g.rcountSocCount;
      totals.rcountTotal += g.rcountTotal;
      totals.jcountSocCount += g.jcountSocCount;
      totals.jcountTotal += g.jcountTotal;
      totals.finalVotersTotal += g.finalVotersTotal;
      totals.stoppedCount += g.stoppedCount;
    });

    this.grandTotal = totals;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }

  /* =========================
     APPLY FILTER
  ========================= */

  applyFilter(): void {

    const deptId = this.departmentList
      .find(d => d.name === this.selectedDepartment)?.id;

    const distId = this.districtList
      .find(d => d.name === this.selectedDistrict)?.id;

    this.userService.loadForm3Filtered(deptId, distId)
      .subscribe((res: any) => {

        const apiData = res?.data?.data;

        if (Array.isArray(apiData) && apiData.length > 0) {

          this.prepareRows(apiData);
          this.originalRows = [...this.tableRows];

        } else {

          this.tableRows = [];
          this.originalRows = [];
          this.abstractRows = [];
          this.computeGrandTotal();

        }

      });

  }

  /* =========================
     CLEAR FILTER
  ========================= */

  clearFilter(): void {

    this.selectedDepartment = '';
    this.selectedDistrict = '';

    this.loadForm3();

  }

  /* =========================
     EXPORT EXCEL
  ========================= */

  //   exportToExcel(): void {

  //     const table = document.getElementById('reportTable');
  //     if (!table) return;

  //     const worksheet = XLSX.utils.table_to_sheet(table);

  //     const workbook = {
  //       Sheets: { Report: worksheet },
  //       SheetNames: ['Report']
  //     };

  //     const buffer = XLSX.write(workbook, {
  //       bookType: 'xlsx',
  //       type: 'array'
  //     });

  //     saveAs(new Blob([buffer]), 'Form3_Report.xlsx');

  //   }

  // }


  downloadPdf(): void {

    const departmentId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const districtId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    if (this.viewMode === 'abstract') {

      this.userService.getForm3AbstractPdf(departmentId, districtId).subscribe(
        (res: Blob) => {
          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form3_Abstract_Report.pdf'
          );
        },
        error => {
          console.error('Abstract PDF download error:', error);
        }
      );
      return;
    }

    this.userService.getForm3Pdf(departmentId, districtId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form3_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );

  }
}