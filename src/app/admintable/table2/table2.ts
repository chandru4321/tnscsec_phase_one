import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

/* =========================
   INTERFACES
========================= */

interface Society {
  society_id: number;
  society_name: string;
  voter_list_prepared_count?: number | null;
}

interface Form2ApiRow {
  id: number;
  department_name: string;
  district_name: string;
  zone_name: string;

  masterzone_societies: Society[];
  selected_soc: Society[];
  non_selected_soc: Society[];

  selected_count: number;
  non_selected_count: number;
  remark: string;
}

interface TableRow {
  district_name: string;
  zone_name: string;

  f3_name: string | null;
  f5_name: string | null;
  f6_name: string | null;
  voter_list_prepared_count: number | null;

  selected_count?: number;
  non_selected_count?: number;
  remark?: string;
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
  requiredCount: number;
  preparedCount: number;
  preparedVoterTotal: number;
  notPreparedCount: number;
  notPreparedVoterTotal: number;
  // Officer-prepared societies are, by definition, the same set as
  // "not prepared by society" (non_selected_soc) — the officer prepares
  // the list whenever the society itself didn't.
  officerPreparedCount: number;
  officerPreparedVoterTotal: number;
}

/* =========================
   COMPONENT
========================= */

@Component({
  selector: 'app-table2',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './table2.html',
  styleUrls: ['./table2.css']
})
export class Table2 implements OnInit {

  department_name: string = '';
  tableRows: TableRow[] = [];
  originalRows: TableRow[] = [];
  abstractRows: AbstractRow[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  grandTotal: AbstractRow = {
    district_name: '',
    zone_name: '',
    zone_count: 0,
    requiredCount: 0,
    preparedCount: 0,
    preparedVoterTotal: 0,
    notPreparedCount: 0,
    notPreparedVoterTotal: 0,
    officerPreparedCount: 0,
    officerPreparedVoterTotal: 0
  };

  selectedDepartment: string = '';
  selectedDistrict: string = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {

    this.loadForm2Table();
    this.loadDepartments();
    this.loadDistricts();

  }

  /* =========================
     LOAD MASTER DATA
  ========================= */

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

  /* =========================
     LOAD TABLE
  ========================= */

  loadForm2Table(): void {

    this.userService.loadForm2Table(1, 50).subscribe((res: any) => {

      console.log("FULL RESPONSE", res);

      const apiData = res?.data?.data;   // ✅ Correct

      console.log("Rows received:", apiData?.length);

      if (Array.isArray(apiData) && apiData.length > 0) {

        this.department_name = apiData[0].department_name;

        this.prepareRows(apiData);

      }
      else {

        this.tableRows = [];

      }

    });

  }
  /* =========================
     TRANSFORM DATA
  ========================= */

  private prepareRows(data: Form2ApiRow[]): void {

    this.tableRows = [];

    let districtSerial = 0;

    data.forEach(row => {

      districtSerial += 1;

      // society_id -> whichever count was entered for it (selected or non-selected side)
      const countMap = new Map<number, number | null>();
      (row.selected_soc || []).forEach(s => countMap.set(s.society_id, s.voter_list_prepared_count ?? null));
      (row.non_selected_soc || []).forEach(s => countMap.set(s.society_id, s.voter_list_prepared_count ?? null));

      const f3List = row.masterzone_societies || [];
      const f5List = row.selected_soc || [];
      const f6List = row.non_selected_soc || [];

      const totalRows = f3List.length;

      f3List.forEach((society, index) => {

        const isSelected =
          f5List.some(s => s.society_id === society.society_id);

        const isNonSelected =
          f6List.some(s => s.society_id === society.society_id);

        this.tableRows.push({

          district_name: row.district_name,
          zone_name: row.zone_name,

          f3_name: society.society_name,
          f5_name: isSelected ? society.society_name : null,
          f6_name: isNonSelected ? society.society_name : null,
          voter_list_prepared_count: countMap.get(society.society_id) ?? null,

          selected_count: index === 0 ? row.selected_count : undefined,
          non_selected_count: index === 0 ? row.non_selected_count : undefined,
          remark: index === 0 ? row.remark : undefined,

          rowSpan: index === 0 ? totalRows : undefined,
          districtSerial: index === 0 ? districtSerial : undefined

        });

      });

    });

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
          requiredCount: 0,
          preparedCount: 0,
          preparedVoterTotal: 0,
          notPreparedCount: 0,
          notPreparedVoterTotal: 0,
          officerPreparedCount: 0,
          officerPreparedVoterTotal: 0
        });
      }

      const g = groups.get(key)!;

      // selected_count / non_selected_count are per form2 RECORD (repeated
      // on every row belonging to that one record), but a district+zone can
      // have several form2 records — e.g. different departments each filing
      // for the same district — so they must be summed across records, not
      // overwritten by whichever record's first row is seen last.
      if (r.rowSpan) {
        g.requiredCount += r.rowSpan;
        g.preparedCount += r.selected_count ?? 0;
        g.notPreparedCount += r.non_selected_count ?? 0;
        // Officer-prepared count mirrors not-prepared-by-society count.
        g.officerPreparedCount += r.non_selected_count ?? 0;
      }

      if (r.f5_name) {
        g.preparedVoterTotal += r.voter_list_prepared_count ?? 0;
      } else if (r.f6_name) {
        g.notPreparedVoterTotal += r.voter_list_prepared_count ?? 0;
        g.officerPreparedVoterTotal += r.voter_list_prepared_count ?? 0;
      }

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
      requiredCount: 0,
      preparedCount: 0,
      preparedVoterTotal: 0,
      notPreparedCount: 0,
      notPreparedVoterTotal: 0,
      officerPreparedCount: 0,
      officerPreparedVoterTotal: 0
    };

    this.abstractRows.forEach(g => {
      totals.zone_count += g.zone_count;
      totals.requiredCount += g.requiredCount;
      totals.preparedCount += g.preparedCount;
      totals.preparedVoterTotal += g.preparedVoterTotal;
      totals.notPreparedCount += g.notPreparedCount;
      totals.notPreparedVoterTotal += g.notPreparedVoterTotal;
      totals.officerPreparedCount += g.officerPreparedCount;
      totals.officerPreparedVoterTotal += g.officerPreparedVoterTotal;
    });

    this.grandTotal = totals;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }

  /* =========================
     FILTER
  ========================= */

  applyFilter(): void {

    const deptId = this.departmentList
      .find(d => d.name === this.selectedDepartment)?.id;

    const distId = this.districtList
      .find(d => d.name === this.selectedDistrict)?.id;

    this.userService.loadForm2Filtered(deptId, distId)
      .subscribe((res: any) => {

        const apiData = res?.data?.data;

        if (Array.isArray(apiData)) {

          this.prepareRows(apiData);
          this.originalRows = [...this.tableRows];

        }
        else {

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

    this.loadForm2Table();

  }

  /* =========================
     EXPORT
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

  //     saveAs(new Blob([buffer]), 'Form2_Report.xlsx');

  //   }

  // }

  downloadPdf(): void {

    if (this.viewMode === 'abstract') {

      const deptId = this.departmentList.find(d => d.name === this.selectedDepartment)?.id;
      const distId = this.districtList.find(d => d.name === this.selectedDistrict)?.id;

      this.userService.getForm2AbstractPdf(deptId, distId).subscribe(
        (res: Blob) => {
          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form2_Abstract_Report.pdf'
          );
        },
        error => {
          console.error('Abstract PDF download error:', error);
        }
      );
      return;
    }

    const departmentId = 2;

    this.userService.getForm2Pdf(departmentId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form2_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );

  }
}