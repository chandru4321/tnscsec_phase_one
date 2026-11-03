import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table5b',
  imports: [CommonModule, FormsModule],
  templateUrl: './table5b.html',
  styleUrl: './table5b.css',
})
export class table5b implements OnInit {

  tableRows: any[] = [];
  abstractRows: any[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  grandTotal: any = {
    district_name: '',
    zone_name: '',
    filedCount: 0,
    decSc: 0, decWomen: 0, decGeneral: 0, decTotal: 0,
    rejCount: 0,
    rejSc: 0, rejWomen: 0, rejGeneral: 0, rejTotal: 0,
    remCount: 0,
    remSc: 0, remWomen: 0, remGeneral: 0, remTotal: 0,
    stoppedCount: 0,
    stopDecSc: 0, stopDecWomen: 0, stopDecGeneral: 0, stopDecTotal: 0
  };

  department_name = '';
  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

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

    this.loadDepartments();

    this.loadDistricts();

    this.loadForm5B();

  }

  loadDepartments(): void {

    this.userService.getdepartment().subscribe((res: any) => {

      if (res.success) {

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

      if (res.success) {

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

    this.userService.loadForm5bFiltered(deptId, distId)
      .subscribe((res: any) => {

        const apiData = res?.data?.data;

        if (res.success && apiData) {

          this.prepareRows(apiData);

        }
        else {

          this.tableRows = [];
          this.abstractRows = [];
          this.computeGrandTotal();

        }

      });

  }
  loadForm5B(): void {

    this.userService.loadForm5bFiltered().subscribe({

      next: (res: any) => {

        console.log("FORM5B RESPONSE:", res);

        const apiData = res?.data?.data;

        if (res?.success && apiData?.length > 0) {

          this.prepareRows(apiData);

        } else {

          this.tableRows = [];
          this.abstractRows = [];
          this.computeGrandTotal();

        }

      },

      error: (err: any) => {

        console.error(err);

      }

    });

  }

  private buildRow(item: any, soc: any, isStopped: boolean, districtSerial: number): any {

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
      districtSerial,
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

    const rows: any[] = [];

    let districtSerial = 0;

    data.forEach(item => {

      districtSerial += 1;

      this.department_name = item.department_name || '';

      (item.active_societies || []).forEach((soc: any) => {
        rows.push(this.buildRow(item, soc, false, districtSerial));
      });

      (item.stopped_societies || []).forEach((soc: any) => {
        rows.push(this.buildRow(item, soc, true, districtSerial));
      });

    });

    this.tableRows = rows;

    console.log('TABLE ROWS:', this.tableRows);

    this.buildAbstractRows();
  }

  /* =========================
     ABSTRACT (DISTRICT/ZONE-WISE SUMMARY)
  ========================= */
  private emptyAbstractTotals(): any {
    return {
      district_name: '',
      zone_name: '',
      zone_count: 0,
      filedCount: 0,
      decSc: 0, decWomen: 0, decGeneral: 0, decTotal: 0,
      rejCount: 0,
      rejSc: 0, rejWomen: 0, rejGeneral: 0, rejTotal: 0,
      remCount: 0,
      remSc: 0, remWomen: 0, remGeneral: 0, remTotal: 0,
      stoppedCount: 0,
      stopDecSc: 0, stopDecWomen: 0, stopDecGeneral: 0, stopDecTotal: 0
    };
  }

  private buildAbstractRows(): void {

    const groups = new Map<string, any>();

    this.tableRows.forEach((r: any) => {

      const key = `${r.district_name}||${r.zone_name}`;

      if (!groups.has(key)) {
        groups.set(key, {
          ...this.emptyAbstractTotals(),
          district_name: r.district_name,
          zone_name: r.zone_name,
          zone_count: 1
        });
      }

      const g = groups.get(key)!;

      g.filedCount += 1;
      g.decSc += r.dec_sc || 0;
      g.decWomen += r.dec_women || 0;
      g.decGeneral += r.dec_general || 0;
      g.decTotal += r.dec_total || 0;

      if (r.rej_total > 0) {
        g.rejCount += 1;
        g.rejSc += r.rej_sc || 0;
        g.rejWomen += r.rej_women || 0;
        g.rejGeneral += r.rej_general || 0;
        g.rejTotal += r.rej_total || 0;
      }

      if (r.rem_total > 0) {
        g.remCount += 1;
        g.remSc += r.rem_sc || 0;
        g.remWomen += r.rem_women || 0;
        g.remGeneral += r.rem_general || 0;
        g.remTotal += r.rem_total || 0;
      }

      if (r.stopped_society_name !== '-') {
        g.stoppedCount += 1;
        g.stopDecSc += Number(r.stop_dec_sc) || 0;
        g.stopDecWomen += Number(r.stop_dec_women) || 0;
        g.stopDecGeneral += Number(r.stop_dec_general) || 0;
        g.stopDecTotal += Number(r.stop_dec_total) || 0;
      }

    });

    this.abstractRows = Array.from(groups.values());

    this.computeGrandTotal();
  }

  private computeGrandTotal(): void {

    const totals = this.emptyAbstractTotals();

    this.abstractRows.forEach((g: any) => {
      totals.zone_count += g.zone_count;
      totals.filedCount += g.filedCount;
      totals.decSc += g.decSc;
      totals.decWomen += g.decWomen;
      totals.decGeneral += g.decGeneral;
      totals.decTotal += g.decTotal;
      totals.rejCount += g.rejCount;
      totals.rejSc += g.rejSc;
      totals.rejWomen += g.rejWomen;
      totals.rejGeneral += g.rejGeneral;
      totals.rejTotal += g.rejTotal;
      totals.remCount += g.remCount;
      totals.remSc += g.remSc;
      totals.remWomen += g.remWomen;
      totals.remGeneral += g.remGeneral;
      totals.remTotal += g.remTotal;
      totals.stoppedCount += g.stoppedCount;
      totals.stopDecSc += g.stopDecSc;
      totals.stopDecWomen += g.stopDecWomen;
      totals.stopDecGeneral += g.stopDecGeneral;
      totals.stopDecTotal += g.stopDecTotal;
    });

    this.grandTotal = totals;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }

  downloadPdf(): void {

    const deptId = this.departmentList
      .find(d => d.name === this.selectedDepartment)?.id;

    const distId = this.districtList
      .find(d => d.name === this.selectedDistrict)?.id;

    if (this.viewMode === 'abstract') {

      this.userService.getForm5bAbstractPdf(deptId, distId)
        .subscribe({
          next: (res: Blob) => {
            saveAs(
              new Blob([res], { type: 'application/pdf' }),
              'Form5B_Abstract_Report.pdf'
            );
          },
          error: err => console.error('Abstract PDF download error:', err)
        });
      return;
    }

    this.userService.getForm5bPdf(deptId, distId)
      .subscribe({

        next: (res: Blob) => {

          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form5B_Report.pdf'
          );

        },

        error: err => console.error(err)

      });

  }
}
