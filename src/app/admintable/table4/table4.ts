import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import { saveAs } from 'file-saver';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface TableRow {
  district_name: string;
  zone_name: string;
  society_name: string;

  rural_sc: number;
  rural_women: number;
  rural_general: number;
  rural_total: number;

  // Only meaningful when the society was actually filed with declared
  // candidates (not stopped, not zero) — '-' otherwise, but the row itself
  // still exists so it stays visible in the "required societies" columns.
  declared_society_name: string;
  dec_sc: number | string;
  dec_women: number | string;
  dec_general: number | string;
  dec_total: number | string;

  rejected: string;

  // Only meaningful for a not-filed society's row — blank otherwise
  unfiled_society_name: string;
  unfiled_reason_display: string;

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
  ruralScTotal: number;
  ruralWomenTotal: number;
  ruralGeneralTotal: number;
  ruralTotalTotal: number;
  filedCount: number;
  decScTotal: number;
  decWomenTotal: number;
  decGeneralTotal: number;
  decTotalTotal: number;
  unfiledCount: number;
}

@Component({
  selector: 'app-formt4',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './table4.html',
  styleUrls: ['./table4.css']
})
export class Table4 implements OnInit {

  tableRows: TableRow[] = [];
  abstractRows: AbstractRow[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  grandTotal: AbstractRow = {
    district_name: '',
    zone_name: '',
    zone_count: 0,
    requiredCount: 0,
    ruralScTotal: 0,
    ruralWomenTotal: 0,
    ruralGeneralTotal: 0,
    ruralTotalTotal: 0,
    filedCount: 0,
    decScTotal: 0,
    decWomenTotal: 0,
    decGeneralTotal: 0,
    decTotalTotal: 0,
    unfiledCount: 0
  };

  department_name = '';
  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: any[] = [];
  districtList: any[] = [];

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_candidates', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  constructor(private userService: UserService) { }

  private resolveReason(soc: any): string {

    if (!soc.reason) return '-';

    const opt = this.reasonOptions.find(r => r.value === soc.reason);
    const label = opt?.label || soc.reason;

    return soc.reason === 'other' && soc.other_reason_text
      ? `${label} - ${soc.other_reason_text}`
      : label;
  }

  ngOnInit(): void {

    this.loadForm4();

    this.loadDepartments();

    this.loadDistricts();

  }

  loadForm4(): void {
    const selectedDepartment = this.selectedDepartment
    console.log(selectedDepartment)
    const selectedDistrict = this.selectedDistrict
    this.userService.getForm4Table(selectedDepartment, selectedDistrict).subscribe({
      next: (res: any) => {

        console.log('FORM4 RESPONSE', res);

        const apiData = res?.data?.data;


        if (
          res?.success &&
          Array.isArray(apiData) &&
          apiData.length > 0
        ) {

          // Department Header
          this.department_name =
            apiData[0]?.department?.name || '';

          this.prepareRows(apiData);

        } else {

          this.tableRows = [];

        }

      },
      error: (err) => {
        console.error('FORM4 API ERROR:', err);
      }
    });
  }

  private prepareRows(data: any[]): void {

    const rows: TableRow[] = [];

    let districtSerial = 0;

    data.forEach((item: any) => {

      districtSerial += 1;

      // Row identity/count always covers every society (filed or not) —
      // that's what drives the "required societies" columns. Whether the
      // "declared/filed" columns show anything for a given row is decided
      // separately below, so a stopped or zero-candidate filed society
      // still appears with its required-society data, just blank there.
      const hasDeclaredCandidates = (s: any) => {
        const d = s.declared_counts || {};
        return (Number(d.sc_st) || 0) + (Number(d.women) || 0) + (Number(d.general) || 0) > 0;
      };

      const societies = [
        ...(item.filed_societies || []).map((s: any) => ({ ...s, _isFiled: true })),
        ...(item.unfiled_societies || []).map((s: any) => ({ ...s, _isFiled: false }))
      ];

      const span = societies.length || 1;

      societies.forEach((soc: any, index: number) => {

        const rural = soc.rural_counts || {};
        const declared = soc.declared_counts || {};

        const showDeclared =
          soc._isFiled && soc.is_stopped !== true && hasDeclaredCandidates(soc);

        rows.push({

          district_name: item.district?.name || '-',

          zone_name: item.zone?.name || '-',

          society_name: soc.society_name || '-',

          // Rural Counts
          rural_sc: rural.sc_st || 0,
          rural_women: rural.women || 0,
          rural_general: rural.general || 0,
          rural_total: rural.total || 0,

          // Declared Counts
          declared_society_name: showDeclared ? (soc.society_name || '-') : '-',
          dec_sc: showDeclared ? (declared.sc_st || 0) : '-',
          dec_women: showDeclared ? (declared.women || 0) : '-',
          dec_general: showDeclared ? (declared.general || 0) : '-',
          dec_total: showDeclared ? (declared.total || 0) : '-',

          // Unqualified Society
          rejected:
            soc.election_status === 'UNQUALIFIED'
              ? soc.society_name
              : '-',

          unfiled_society_name: soc._isFiled ? '-' : (soc.society_name || '-'),
          unfiled_reason_display: soc._isFiled ? '-' : this.resolveReason(soc),

          rowSpan: index === 0 ? span : 0,
          districtSerial: index === 0 ? districtSerial : undefined

        });

      });

      // No societies case
      if (societies.length === 0) {

        rows.push({

          district_name: item.district?.name || '-',

          zone_name: item.zone?.name || '-',

          society_name: '-',

          rural_sc: 0,
          rural_women: 0,
          rural_general: 0,
          rural_total: 0,

          districtSerial: districtSerial,

          declared_society_name: '-',
          dec_sc: '-',
          dec_women: '-',
          dec_general: '-',
          dec_total: '-',

          rejected: '-',

          unfiled_society_name: '-',
          unfiled_reason_display: '-',

          rowSpan: 1

        });

      }

    });

    this.tableRows = rows;

    console.log('FORM4 TABLE ROWS:', this.tableRows);

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
          ruralScTotal: 0,
          ruralWomenTotal: 0,
          ruralGeneralTotal: 0,
          ruralTotalTotal: 0,
          filedCount: 0,
          decScTotal: 0,
          decWomenTotal: 0,
          decGeneralTotal: 0,
          decTotalTotal: 0,
          unfiledCount: 0
        });
      }

      const g = groups.get(key)!;

      g.requiredCount += 1;
      g.ruralScTotal += r.rural_sc || 0;
      g.ruralWomenTotal += r.rural_women || 0;
      g.ruralGeneralTotal += r.rural_general || 0;
      g.ruralTotalTotal += r.rural_total || 0;

      const showDeclared = r.declared_society_name !== '-';
      if (showDeclared) {
        g.filedCount += 1;
        g.decScTotal += Number(r.dec_sc) || 0;
        g.decWomenTotal += Number(r.dec_women) || 0;
        g.decGeneralTotal += Number(r.dec_general) || 0;
        g.decTotalTotal += Number(r.dec_total) || 0;
      }

      if (r.unfiled_society_name !== '-') {
        g.unfiledCount += 1;
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
      ruralScTotal: 0,
      ruralWomenTotal: 0,
      ruralGeneralTotal: 0,
      ruralTotalTotal: 0,
      filedCount: 0,
      decScTotal: 0,
      decWomenTotal: 0,
      decGeneralTotal: 0,
      decTotalTotal: 0,
      unfiledCount: 0
    };

    this.abstractRows.forEach(g => {
      totals.zone_count += g.zone_count;
      totals.requiredCount += g.requiredCount;
      totals.ruralScTotal += g.ruralScTotal;
      totals.ruralWomenTotal += g.ruralWomenTotal;
      totals.ruralGeneralTotal += g.ruralGeneralTotal;
      totals.ruralTotalTotal += g.ruralTotalTotal;
      totals.filedCount += g.filedCount;
      totals.decScTotal += g.decScTotal;
      totals.decWomenTotal += g.decWomenTotal;
      totals.decGeneralTotal += g.decGeneralTotal;
      totals.decTotalTotal += g.decTotalTotal;
      totals.unfiledCount += g.unfiledCount;
    });

    this.grandTotal = totals;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }



  loadDepartments() {
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

  loadDistricts() {
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

    const deptId = this.departmentList
      .find(d => d.name === this.selectedDepartment)?.id;

    const distId = this.districtList
      .find(d => d.name === this.selectedDistrict)?.id;

    console.log('Department ID:', deptId);
    console.log('District ID:', distId);

    this.userService.loadForm4Filtered(deptId, distId)
      .subscribe((res: any) => {

        console.log('FILTER RESPONSE:', res);

        const apiData = res?.data?.data;

        console.log('FILTER DATA:', apiData);

        if (Array.isArray(apiData) && apiData.length > 0) {

          this.department_name = apiData[0]?.department?.name || '';
          this.prepareRows(apiData);

        } else {

          console.log('NO DATA RETURNED');

          this.tableRows = [];
          this.abstractRows = [];
          this.computeGrandTotal();

        }

      });

  }



  downloadPdf(): void {

    const departmentId = Number(this.selectedDepartment);
    const districtId = Number(this.selectedDistrict);

    console.log('Department ID:', departmentId);
    console.log('District ID:', districtId);

    if (this.viewMode === 'abstract') {

      this.userService.getForm4AbstractPdf(departmentId, districtId).subscribe(
        (res: Blob) => {
          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form4_Abstract_Report.pdf'
          );
        },
        error => {
          console.error('Abstract PDF download error:', error);
        }
      );
      return;
    }

    this.userService.getForm4Pdf(departmentId, districtId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form4_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }
}