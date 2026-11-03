import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { RouterModule } from '@angular/router';

interface CandidateEntry {
  member_name: string;
  aadhar_no: string;
}

// One row per candidate-index within a society (row 1 shows candidate #1
// in each category, row 2 shows candidate #2, etc.) — society name and the
// required-counts columns only render on the first row of that society
// (rowSpan). The API can return several district/zone groups at once (e.g.
// an unfiltered "All districts" admin view), so district_name/zone_name are
// per-row, not a single value for the whole table, and districtZoneRowSpan
// only spans the rows belonging to that one district/zone group.
interface TableRow {
  serial: number;
  district_name: string;
  zone_name: string;
  society_name: string;

  sc_total: number;
  women_total: number;
  general_total: number;
  grand_total: number;

  sc: CandidateEntry | null;
  women: CandidateEntry | null;
  general: CandidateEntry | null;

  rowSpan?: number;
  districtZoneRowSpan?: number;
}

// One row per district, with every society's candidates summed across
// all its circles — no per-society breakdown here (that's what the Full
// List view is for). zone_count is how many distinct circles were rolled
// into this district's totals.
interface AbstractRow {
  district_name: string;
  zone_name: string;
  zone_count: number;
  society_count: number;
  sc_total: number;
  women_total: number;
  general_total: number;
  grand_total: number;
}

@Component({
  selector: 'app-formt5',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './table5.html',
  styleUrls: ['./table5.css']
})
export class Table5 implements OnInit {

  tableRows: TableRow[] = [];
  abstractRows: AbstractRow[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  grandTotal: AbstractRow = {
    district_name: '',
    zone_name: '',
    zone_count: 0,
    society_count: 0,
    sc_total: 0,
    women_total: 0,
    general_total: 0,
    grand_total: 0
  };

  department_name = '';

  // Add these here
  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];


  constructor(private userService: UserService) { }

  ngOnInit(): void {

    this.loadDepartments();
    this.loadDistricts();
    this.loadForm5();

  }

  loadForm5(): void {

    this.userService.loadForm5Filtered().subscribe({

      next: (res: any) => {

        console.log("FORM5 RESPONSE", res);

        const apiData = res?.data;

        if (res?.success && apiData) {

          this.department_name = apiData.department_name;

          this.prepareRows(apiData);

        } else {

          this.tableRows = [];
          this.abstractRows = [];
          this.grandTotal = { district_name: '', zone_name: '', zone_count: 0, society_count: 0, sc_total: 0, women_total: 0, general_total: 0, grand_total: 0 };

        }

      },

      error: err => console.error(err)

    });

  }
  // The API returns one entry per district/zone group (an unfiltered "All
  // districts" admin view can contain several at once), each with its own
  // members array — never a single flat member list with one shared
  // district/zone.
  private prepareRows(data: any): void {

    const districtGroups = data.data || [];

    const rows: TableRow[] = [];
    const abstractGroups = new Map<string, {
      district_name: string;
      zone_name: string;
      societyNames: Set<string>;
      sc: number;
      women: number;
      general: number;
    }>();

    let serial = 0;

    districtGroups.forEach((districtGroup: any) => {

      const districtName = districtGroup.district_name || '';
      const zoneName = districtGroup.zone_name || '';
      const members = districtGroup.members || [];

      const societyMap = new Map<string, {
        society_name: string;
        sc: CandidateEntry[];
        women: CandidateEntry[];
        general: CandidateEntry[];
      }>();

      members.forEach((m: any) => {

        if (!societyMap.has(m.society_name)) {
          societyMap.set(m.society_name, {
            society_name: m.society_name,
            sc: [],
            women: [],
            general: []
          });
        }

        const group = societyMap.get(m.society_name)!;
        const entry: CandidateEntry = {
          member_name: m.member_name,
          aadhar_no: m.aadhar_no
        };

        if (m.category_type === 'sc_st') group.sc.push(entry);
        else if (m.category_type === 'women') group.women.push(entry);
        else if (m.category_type === 'general') group.general.push(entry);

        // District+zone-wise totals only — no per-society breakdown here.
        const abstractKey = `${districtName}||${zoneName}`;
        if (!abstractGroups.has(abstractKey)) {
          abstractGroups.set(abstractKey, {
            district_name: districtName,
            zone_name: zoneName,
            societyNames: new Set<string>(),
            sc: 0, women: 0, general: 0
          });
        }
        const abstractGroup = abstractGroups.get(abstractKey)!;
        abstractGroup.societyNames.add(m.society_name);
        if (m.category_type === 'sc_st') abstractGroup.sc += 1;
        else if (m.category_type === 'women') abstractGroup.women += 1;
        else abstractGroup.general += 1;
      });

      const groupStartIndex = rows.length;

      societyMap.forEach(group => {

        const maxRows = Math.max(group.sc.length, group.women.length, group.general.length, 1);

        serial += 1;

        for (let i = 0; i < maxRows; i++) {

          rows.push({
            serial,
            district_name: districtName,
            zone_name: zoneName,
            society_name: i === 0 ? group.society_name : '',

            sc_total: group.sc.length,
            women_total: group.women.length,
            general_total: group.general.length,
            grand_total: group.sc.length + group.women.length + group.general.length,

            sc: group.sc[i] || null,
            women: group.women[i] || null,
            general: group.general[i] || null,

            rowSpan: i === 0 ? maxRows : undefined
          });
        }
      });

      if (rows.length > groupStartIndex) {
        rows[groupStartIndex].districtZoneRowSpan = rows.length - groupStartIndex;
      }

    });

    this.tableRows = rows;

    this.buildAbstractRows(abstractGroups);

  }

  /* =========================
     ABSTRACT (DISTRICT/ZONE-WISE SUMMARY)
  ========================= */
  private buildAbstractRows(abstractGroups: Map<string, {
    district_name: string;
    zone_name: string;
    societyNames: Set<string>;
    sc: number;
    women: number;
    general: number;
  }>): void {

    this.abstractRows = Array.from(abstractGroups.values()).map(group => ({
      district_name: group.district_name,
      zone_name: group.zone_name,
      zone_count: 1,
      society_count: group.societyNames.size,
      sc_total: group.sc,
      women_total: group.women,
      general_total: group.general,
      grand_total: group.sc + group.women + group.general
    }));

    this.grandTotal = this.abstractRows.reduce((totals, a) => {
      totals.zone_count += a.zone_count;
      totals.society_count += a.society_count;
      totals.sc_total += a.sc_total;
      totals.women_total += a.women_total;
      totals.general_total += a.general_total;
      totals.grand_total += a.grand_total;
      return totals;
    }, { district_name: '', zone_name: '', zone_count: 0, society_count: 0, sc_total: 0, women_total: 0, general_total: 0, grand_total: 0 });

  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }

  applyFilter(): void {

    const deptId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const distId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    this.userService.loadForm5Filtered(deptId, distId)
      .subscribe((res: any) => {

        if (res.success) {

          this.department_name = res.data.department_name;

          this.prepareRows(res.data);

        } else {

          this.tableRows = [];
          this.abstractRows = [];
          this.grandTotal = { district_name: '', zone_name: '', zone_count: 0, society_count: 0, sc_total: 0, women_total: 0, general_total: 0, grand_total: 0 };

        }

      });

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

  downloadPdf(): void {

    const departmentId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const districtId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    console.log("Department:", departmentId);
    console.log("District:", districtId);

    if (this.viewMode === 'abstract') {

      this.userService
        .getForm5AbstractPdf(departmentId, districtId)
        .subscribe({
          next: (res: Blob) => {
            saveAs(
              new Blob([res], { type: 'application/pdf' }),
              'Form5_Abstract_Report.pdf'
            );
          },
          error: err => {
            console.error('Abstract PDF download error:', err);
          }
        });
      return;
    }

    this.userService
      .getForm5Pdf(departmentId, districtId)
      .subscribe({

        next: (res: Blob) => {

          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form5_Report.pdf'
          );

        },

        error: err => {

          console.error(err);

        }

      });

  }
}