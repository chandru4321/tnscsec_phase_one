import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// One row per society. district_name is one value per district/zone group
// (rowSpan merges it across every society row in that group); zone_name is
// genuinely per-society (societies in the same district can sit in
// different zones), so it is never merged.
interface TableRow {
  serial: number;
  district_name: string;
  zone_name: string;
  society_name: string;

  rural_sc: number;
  rural_women: number;
  rural_general: number;
  rural_total: number;

  dec_sc: number;
  dec_women: number;
  dec_general: number;
  dec_total: number;

  polling_date: string;
  total_voters: number | string;
  casted_votes_count: number;
  voting_percentage: number | string;
  ballot_box_count: number;

  stop_name: string;
  stop_reason: string;

  rowSpan?: number;
  // Societies in this district group where polling was actually held
  pollingHeldCount?: number;
}

interface AbstractRow {
  district_name: string;
  zone_name: string;
  society_count: number;
  polling_held_count: number;
  total_voters: number;
  casted_votes_count: number;
  voting_percentage: number;
  ballot_box_total: number;
  stopped_count: number;
}

@Component({
  selector: 'app-table7',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './table7.html',
  styleUrls: ['./table7.css']
})
export class Table7 implements OnInit {

  department_name = '';
  tableRows: TableRow[] = [];
  abstractRows: AbstractRow[] = [];
  viewMode: 'full' | 'abstract' = 'full';

  grandTotal: AbstractRow = {
    district_name: '',
    zone_name: '',
    society_count: 0,
    polling_held_count: 0,
    total_voters: 0,
    casted_votes_count: 0,
    voting_percentage: 0,
    ballot_box_total: 0,
    stopped_count: 0
  };

  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_quorum', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDistricts();
    this.loadForm7();
  }

  getRuralValue(society: any, type: string) {
    return society.rural?.[type] || 0;
  }

  getDeclaredValue(society: any, type: string) {
    const cat = society.qualified_categories?.[type];
    return cat && cat.eligible ? cat.count : 0;
  }

  getDeclaredTotal(society: any) {
    let total = 0;
    ['sc_st', 'women', 'general'].forEach(type => {
      const cat = society.qualified_categories?.[type];
      if (cat && cat.eligible) total += cat.count;
    });
    return total;
  }

  private resolveStopName(society: any): string {
    return society.submitted_data?.stop_reason ? (society.society_name || '-') : '-';
  }

  private resolveStopReason(society: any): string {
    const reason = society.submitted_data?.stop_reason;
    if (!reason) return '-';
    const opt = this.reasonOptions.find(r => r.value === reason);
    const label = opt?.label || reason;
    return reason === 'other' && society.submitted_data?.stop_other_reason_text
      ? `${label} - ${society.submitted_data.stop_other_reason_text}`
      : label;
  }

  private formatPollingDate(society: any): string {
    const raw = society.submitted_data?.polling_date;
    if (!raw) return '-';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  }

  loadForm7(): void {
    this.userService.loadForm7Filtered().subscribe({
      next: (res: any) => this.handleResponse(res),
      error: err => console.error('Form7 error:', err)
    });
  }

  applyFilter(): void {
    const deptId = this.departmentList.find(d => d.name === this.selectedDepartment)?.id;
    const distId = this.districtList.find(d => d.name === this.selectedDistrict)?.id;

    this.userService.loadForm7Filtered(deptId, distId).subscribe({
      next: (res: any) => this.handleResponse(res),
      error: err => console.error('Form7 filter error:', err)
    });
  }

  private handleResponse(res: any): void {

    if (!res?.success || !res.data?.length) {
      this.tableRows = [];
      this.abstractRows = [];
      this.computeGrandTotal();
      return;
    }

    const forms = res.data;

    this.department_name = forms[0]?.department?.name || '';

    const rows: TableRow[] = [];
    const abstractGroups = new Map<string, {
      district_name: string;
      zone_name: string;
      societyNames: Set<string>;
      polling_held_count: number;
      total_voters: number;
      casted_votes_count: number;
      ballot_box_total: number;
      stopped_count: number;
    }>();

    let serial = 0;

    forms.forEach((form: any) => {

      const districtName = form.district?.name || '-';
      const societies = form.societies || [];

      const groupStartIndex = rows.length;

      societies.forEach((s: any) => {

        serial += 1;

        const zoneName = s.zone_name || '-';
        const totalVoters = s.form3_total || 0;
        const castedVotes = s.submitted_data?.casted_votes_count || 0;
        const ballotBoxCount = s.submitted_data?.ballot_box_count || 0;
        const isStopped = !!s.submitted_data?.stop_reason;
        // Polling actually held: Form7 entered with a polling date, not stopped
        const isPollingHeld = !!s.submitted_data?.polling_date && !isStopped;

        rows.push({
          serial,
          district_name: districtName,
          zone_name: zoneName,
          society_name: s.society_name || '-',

          rural_sc: this.getRuralValue(s, 'sc_st'),
          rural_women: this.getRuralValue(s, 'women'),
          rural_general: this.getRuralValue(s, 'general'),
          rural_total: this.getRuralValue(s, 'sc_st') + this.getRuralValue(s, 'women') + this.getRuralValue(s, 'general'),

          dec_sc: this.getDeclaredValue(s, 'sc_st'),
          dec_women: this.getDeclaredValue(s, 'women'),
          dec_general: this.getDeclaredValue(s, 'general'),
          dec_total: this.getDeclaredTotal(s),

          polling_date: this.formatPollingDate(s),
          // election stopped → no voter count
          total_voters: isStopped ? '-' : totalVoters,
          casted_votes_count: castedVotes,
          voting_percentage: s.submitted_data?.voting_percentage ?? 0,
          ballot_box_count: s.submitted_data?.ballot_box_count || 0,

          stop_name: this.resolveStopName(s),
          stop_reason: this.resolveStopReason(s),

          rowSpan: undefined
        });

        const abstractKey = `${districtName}||${zoneName}`;
        if (!abstractGroups.has(abstractKey)) {
          abstractGroups.set(abstractKey, {
            district_name: districtName,
            zone_name: zoneName,
            societyNames: new Set<string>(),
            polling_held_count: 0,
            total_voters: 0,
            casted_votes_count: 0,
            ballot_box_total: 0,
            stopped_count: 0
          });
        }
        const ag = abstractGroups.get(abstractKey)!;
        ag.societyNames.add(s.society_name || '-');
        ag.total_voters += totalVoters;
        ag.casted_votes_count += castedVotes;
        ag.ballot_box_total += ballotBoxCount;
        if (isStopped) ag.stopped_count += 1;
        if (isPollingHeld) ag.polling_held_count += 1;

      });

      if (rows.length > groupStartIndex) {
        rows[groupStartIndex].rowSpan = rows.length - groupStartIndex;
        rows[groupStartIndex].pollingHeldCount = societies.filter((s: any) =>
          !!s.submitted_data?.polling_date && !s.submitted_data?.stop_reason).length;
      }

    });

    this.tableRows = rows;

    this.abstractRows = Array.from(abstractGroups.values()).map(g => ({
      district_name: g.district_name,
      zone_name: g.zone_name,
      society_count: g.societyNames.size,
      polling_held_count: g.polling_held_count,
      total_voters: g.total_voters,
      casted_votes_count: g.casted_votes_count,
      voting_percentage: g.total_voters > 0 ? Math.round((g.casted_votes_count / g.total_voters) * 10000) / 100 : 0,
      ballot_box_total: g.ballot_box_total,
      stopped_count: g.stopped_count
    }));

    this.computeGrandTotal();

  }

  private computeGrandTotal(): void {

    const totals: AbstractRow = {
      district_name: '',
      zone_name: '',
      society_count: 0,
      polling_held_count: 0,
      total_voters: 0,
      casted_votes_count: 0,
      voting_percentage: 0,
      ballot_box_total: 0,
      stopped_count: 0
    };

    this.abstractRows.forEach(a => {
      totals.society_count += a.society_count;
      totals.polling_held_count += a.polling_held_count;
      totals.total_voters += a.total_voters;
      totals.casted_votes_count += a.casted_votes_count;
      totals.ballot_box_total += a.ballot_box_total;
      totals.stopped_count += a.stopped_count;
    });

    totals.voting_percentage = totals.total_voters > 0
      ? Math.round((totals.casted_votes_count / totals.total_voters) * 10000) / 100
      : 0;

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
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });
  }

  loadDistricts(): void {
    this.userService.getdistrict().subscribe((res: any) => {
      if (res?.success) {
        this.districtList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });
  }

  downloadPdf(): void {

    const deptId = this.departmentList.find(d => d.name === this.selectedDepartment)?.id;
    const distId = this.districtList.find(d => d.name === this.selectedDistrict)?.id;

    if (this.viewMode === 'abstract') {
      this.userService.getForm7AbstractPdf(deptId, distId).subscribe({
        next: (res: Blob) => {
          saveAs(new Blob([res], { type: 'application/pdf' }), 'Form7_Abstract_Report.pdf');
        },
        error: err => console.error('Abstract PDF download error:', err)
      });
      return;
    }

    this.userService.getForm7Pdf(deptId, distId).subscribe({
      next: (res: Blob) => {
        saveAs(new Blob([res], { type: 'application/pdf' }), 'Form7_Report.pdf');
      },
      error: err => console.error('PDF download error:', err)
    });

  }
}
