import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { RouterModule } from "@angular/router";
import { FormsModule } from '@angular/forms';


/* =========================
   INTERFACES
========================= */

interface SelectedSociety {
  society_id: number;
  society_name: string;
  sc_st: number;
  women: number;
  general: number;
  tot_voters: number;
  reason?: string;
  other_reason_text?: string;
}

interface MasterzoneSociety {
  society_id: number;
  society_name: string;
}

interface Form1ApiRow {
  id: number;
  department_name: string;
  district_name: string;
  zone_name: string;
  masterzone_count: number;
  remark: string;
  selected_count: number;
  non_selected_count: number;
  selected_soc: SelectedSociety[];
  non_selected_soc: SelectedSociety[];
  masterzone_societies: MasterzoneSociety[];
}

interface TableRow {
  id: number;
  department_name: string;
  district_name: string;
  zone_name: string;
  masterzone_count: number;
  society_name: string;

  sc_st: number | null;
  women: number | null;
  general: number | null;
  tot_voters: number | null;

  isSelected: boolean;
  remark: string;
  reason: string;
  otherReasonText: string;

  rowSpan?: number;
  selected_count?: number;
  non_selected_count?: number;
  districtSerial?: number;

  group_non_selected_count: number;
}

// One row per district with everything summed across all its circles —
// no per-society names, counts only. zone_count is how many distinct
// circles were rolled into this district's totals.
interface AbstractRow {
  district_name: string;
  zone_name: string;
  zone_count: number;
  masterzone_count: number;
  selectedCount: number;
  scStTotal: number;
  womenTotal: number;
  generalTotal: number;
  totVotersTotal: number;
  nonSelectedCount: number;
  reasonAddressUnknown: number;
  reasonDefunct: number;
  reasonDissolution: number;
  reasonOther: number;
}

/* =========================
   COMPONENT
========================= */

@Component({
  selector: 'app-formt1',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './table1.html',
  styleUrls: ['./table1.css']
})
export class Table1 implements OnInit {

  tableRows: TableRow[] = [];
  originalRows: TableRow[] = [];   // ✅ Keep original data
  abstractRows: AbstractRow[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  department_name = '';

  // Grand total across every district currently shown (i.e. respects
  // whatever Department/District filter is applied) — sum of the
  // per-district abstract totals, shown as the last row of the full table.
  grandTotal: AbstractRow = {
    district_name: '',
    zone_name: '',
    zone_count: 0,
    masterzone_count: 0,
    selectedCount: 0,
    scStTotal: 0,
    womenTotal: 0,
    generalTotal: 0,
    totVotersTotal: 0,
    nonSelectedCount: 0,
    reasonAddressUnknown: 0,
    reasonDefunct: 0,
    reasonDissolution: 0,
    reasonOther: 0
  };

  // 🔽 Filter values
  // Selected values
  selectedDepartment: string = '';
  selectedDistrict: string = '';

  // Master lists
  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];
  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadform1Tables();
    this.loadDepartments();
    this.loadDistricts();
  }


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
     LOAD API DATA
  ========================= */

  loadform1Tables(): void {
    this.userService.getForm1Table(1, 50).subscribe((res: any) => {

      console.log('Network Pagination:', res?.data?.pagination);

      const apiData = res?.data?.data?.data || res?.data?.data;

      console.log('Total records received:', apiData?.length);

      if (Array.isArray(apiData)) {
        this.prepareRows(apiData);
        this.originalRows = [...this.tableRows];
      }
    });
  }
  private prepareRows(data: Form1ApiRow[]): void {

    this.tableRows = [];

    let districtSerial = 0;

    data.forEach((row: any) => {

      districtSerial += 1;

      // 🔹 Clean department & district names (important for filter match)
      const cleanDepartment = row.department_name
        ? row.department_name.replace(/\r?\n/g, ' ').trim()
        : '';

      const cleanDistrict = row.district_name
        ? row.district_name.trim()
        : '';

      const cleanZone = row.zone_name
        ? row.zone_name.trim()
        : '';

      // Combine selected + non-selected societies
      const allSocieties = [
        ...(row.selected_soc || []),
        ...(row.non_selected_soc || [])
      ];

      const selectedIds = new Set(
        (row.selected_soc || []).map((s: any) => s.society_id)
      );

      const totalRows = allSocieties.length;

      allSocieties.forEach((soc: any, index: number) => {

        const isSelected = selectedIds.has(soc.society_id);

        this.tableRows.push({
          id: row.id,
          department_name: cleanDepartment,   // ✅ cleaned
          district_name: cleanDistrict,       // ✅ cleaned
          zone_name: cleanZone,               // ✅ cleaned
          masterzone_count: row.selected_count + row.non_selected_count,
          society_name: soc.society_name,

          sc_st: isSelected ? soc.sc_st : null,
          women: isSelected ? soc.women : null,
          general: isSelected ? soc.general : null,
          tot_voters: isSelected ? soc.tot_voters : null,

          isSelected: isSelected,
          remark: row.remark,
          reason: isSelected ? '' : (soc.reason || ''),
          otherReasonText: isSelected ? '' : (soc.other_reason_text || ''),

          rowSpan: index === 0 ? totalRows : undefined,
          selected_count: index === 0 ? row.selected_count : undefined,
          non_selected_count: index === 0 ? row.non_selected_count : undefined,
          districtSerial: index === 0 ? districtSerial : undefined,

          group_non_selected_count: row.non_selected_count
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
          masterzone_count: 0,
          selectedCount: 0,
          scStTotal: 0,
          womenTotal: 0,
          generalTotal: 0,
          totVotersTotal: 0,
          nonSelectedCount: 0,
          reasonAddressUnknown: 0,
          reasonDefunct: 0,
          reasonDissolution: 0,
          reasonOther: 0
        });
      }

      const g = groups.get(key)!;

      // masterzone_count / non_selected_count are per form1 RECORD (repeated
      // on every row belonging to that one record), but a district+zone can
      // have several form1 records — e.g. different departments each filing
      // their own notice for the same district — so they must be summed
      // across records, not overwritten by whichever record's first row is
      // seen last.
      if (r.rowSpan) {
        g.masterzone_count += r.masterzone_count;
        g.nonSelectedCount += r.non_selected_count ?? 0;
      }

      if (r.isSelected) {
        g.selectedCount += 1;
        g.scStTotal += r.sc_st ?? 0;
        g.womenTotal += r.women ?? 0;
        g.generalTotal += r.general ?? 0;
        g.totVotersTotal += r.tot_voters ?? 0;
      } else {
        if (r.reason === 'address_unknown') g.reasonAddressUnknown += 1;
        else if (r.reason === 'defunct_societies') g.reasonDefunct += 1;
        else if (r.reason === 'dissolution_notice_issued') g.reasonDissolution += 1;
        else if (r.reason === 'other') g.reasonOther += 1;
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
      masterzone_count: 0,
      selectedCount: 0,
      scStTotal: 0,
      womenTotal: 0,
      generalTotal: 0,
      totVotersTotal: 0,
      nonSelectedCount: 0,
      reasonAddressUnknown: 0,
      reasonDefunct: 0,
      reasonDissolution: 0,
      reasonOther: 0
    };

    this.abstractRows.forEach(g => {
      totals.zone_count += g.zone_count;
      totals.masterzone_count += g.masterzone_count;
      totals.selectedCount += g.selectedCount;
      totals.scStTotal += g.scStTotal;
      totals.womenTotal += g.womenTotal;
      totals.generalTotal += g.generalTotal;
      totals.totVotersTotal += g.totVotersTotal;
      totals.nonSelectedCount += g.nonSelectedCount;
      totals.reasonAddressUnknown += g.reasonAddressUnknown;
      totals.reasonDefunct += g.reasonDefunct;
      totals.reasonDissolution += g.reasonDissolution;
      totals.reasonOther += g.reasonOther;
    });

    this.grandTotal = totals;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }

  // exportToExcel(): void {
  //   const table = document.getElementById('reportTable');

  //   if (!table) {
  //     console.error('Table not found');
  //     return;
  //   }

  //   const worksheet = XLSX.utils.table_to_sheet(table);
  //   const workbook = {
  //     Sheets: { Report: worksheet },
  //     SheetNames: ['Report']
  //   };

  //   const excelBuffer = XLSX.write(workbook, {
  //     bookType: 'xlsx',
  //     type: 'array'
  //   });

  //   const blob = new Blob([excelBuffer], {
  //     type: 'application/octet-stream'
  //   });

  //   saveAs(blob, 'Form1_Report.xlsx');
  // }


  downloadPdf(): void {

    const departmentId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const districtId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    if (this.viewMode === 'abstract') {

      this.userService.getForm1AbstractPdf(departmentId, districtId).subscribe(
        (res: Blob) => {
          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form1_Abstract_Report.pdf'
          );
        },
        error => {
          console.error('Abstract PDF download error:', error);
        }
      );
      return;
    }

    this.userService.getForm1Pdf(departmentId, districtId).subscribe(
      (res: Blob) => {
        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form1_Report.pdf'
        );
      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }

  /* =========================
     CREATE FILTER LISTS
  
  /* =========================
     FILTER FUNCTION
  ========================= */
  applyFilter(): void {

    const deptId = this.departmentList
      .find(d => d.name === this.selectedDepartment)?.id;

    const distId = this.districtList
      .find(d => d.name === this.selectedDistrict)?.id;

    console.log('Filter Params:', deptId, distId);

    this.userService.getForm1Filtered(deptId, distId).subscribe((res: any) => {

      console.log('Filtered Response:', res);

      const apiData = res?.data?.data?.data || res?.data?.data;

      console.log('Filtered Form1 count:', apiData?.length);

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
    this.loadform1Tables();   // reload all data from backend
  }
}
