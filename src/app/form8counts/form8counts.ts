import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { saveAs } from 'file-saver';
import { UserService } from '../services/user';

// "தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள் எண்ணிக்கை விபரம்" —
// the COUNT companion of the Form8 names page (form8names): same societies
// and groups, from the same backend rows (/form8/name/list), with the
// number of elected members per category instead of their names.
type Names = { sc_st: string[]; women: string[]; general: string[] };

interface Counts { sc: number; women: number; general: number; total: number; }

interface CountRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  seats: Counts;                // committee seats (Form4)
  unopposed: Counts | null;
  aboveHalfQuorum: Counts | null;
  winners: Counts | null;
  overall: Counts;
  rowSpan?: number;
  serial?: number;
}

const toCounts = (n: Names | null): Counts | null => {
  if (!n) return null;
  const sc = n.sc_st.length, women = n.women.length, general = n.general.length;
  return { sc, women, general, total: sc + women + general };
};

const addCounts = (a: Counts, b: Counts | null): Counts =>
  b ? { sc: a.sc + b.sc, women: a.women + b.women, general: a.general + b.general, total: a.total + b.total } : a;

const ZERO: Counts = { sc: 0, women: 0, general: 0, total: 0 };

@Component({
  selector: 'app-form8counts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form8counts.html',
  styleUrls: ['../form8names/form8names.css', './form8counts.css']
})
export class Form8Counts implements OnInit {

  rows: CountRow[] = [];
  department_name = '';

  // Column totals for the மொத்தம் row: [seats, unopposed, quorum, polling, overall]
  totals: Counts[] = [ZERO, ZERO, ZERO, ZERO, ZERO];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getForm11List().subscribe({
      next: (res: any) => this.prepare(res?.success ? res.data : null),
      error: err => { console.error(err); this.prepare(null); }
    });
  }

  private prepare(data: any): void {

    this.department_name = data?.departmentName && data.departmentName !== '-'
      ? data.departmentName
      : (localStorage.getItem('department_name') || '');

    // Form 12 counts elected members only — societies stopped at polling /
    // counting (shown on Form 11) are left out
    const rows: CountRow[] = (data?.rows || []).filter((r: any) => !r.stopped).map((r: any) => {
      const unopposed = toCounts(r.unopposed);
      const aboveHalfQuorum = toCounts(r.aboveHalfQuorum);
      const winners = toCounts(r.winners);
      return {
        district_name: r.district_name,
        zone_name: r.zone_name,
        society_name: r.society_name,
        seats: {
          sc: r.seats?.sc_st || 0,
          women: r.seats?.women || 0,
          general: r.seats?.general || 0,
          total: r.seats?.total || 0
        },
        unopposed,
        aboveHalfQuorum,
        winners,
        overall: addCounts(addCounts(addCounts(ZERO, unopposed), aboveHalfQuorum), winners)
      };
    });

    // Serial + merged district/zone cells per district/zone group
    let serial = 0;
    rows.forEach((r, i) => {
      const prev = rows[i - 1];
      if (!prev || prev.district_name !== r.district_name || prev.zone_name !== r.zone_name) {
        let span = 1;
        while (rows[i + span] && rows[i + span].district_name === r.district_name && rows[i + span].zone_name === r.zone_name) span++;
        r.rowSpan = span;
        r.serial = ++serial;
      }
    });

    this.totals = [
      rows.reduce((t, r) => addCounts(t, r.seats), ZERO),
      rows.reduce((t, r) => addCounts(t, r.unopposed), ZERO),
      rows.reduce((t, r) => addCounts(t, r.aboveHalfQuorum), ZERO),
      rows.reduce((t, r) => addCounts(t, r.winners), ZERO),
      rows.reduce((t, r) => addCounts(t, r.overall), ZERO)
    ];

    this.rows = rows;
  }

  downloadPdf(): void {
    // No department filter: the backend uses the logged-in user's own data,
    // the same rows this table shows.
    this.userService.getForm8CountPdf().subscribe({
      next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), 'Elected_Members_Count_Report.pdf'),
      error: err => console.error('PDF download error:', err)
    });
  }

  // Cells for a group: '-' when the society is not in that group
  cells(c: Counts | null): (number | string)[] {
    return c ? [c.sc, c.women, c.general, c.total] : ['-', '-', '-', '-'];
  }
}
