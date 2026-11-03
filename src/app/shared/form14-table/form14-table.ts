import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// படிவம் 14 (a) / 14 (b) — தலைவர் தேர்தல் விவரம். One table for the user
// (formt9 / formt9b) and admin (table9 / table9b) pages, fed the /form9 list
// API's forms. Same rows as the backend PDF (form14Rows.ts):
//
// 14 (a): (4) society  (5) filed  (6) rejected  (7) eligible  (8) withdrawn
//         (9) final list  (10) elected unopposed  (11) contesting the poll (9 − 10)
// 14 (b): (12) society polled  (13) contesting, by category
//         (14) votes obtained, by category  (15) elected by polling
//         (16) society stopped during the president election + reason
//
// Also படிவம் 15 (a) / 15 (b) — துணைத் தலைவர் (vice-president, /form10 list):
// same columns, set office="vice_president".

export type Form14Part = 'a' | 'b';
export type Form14Office = 'president' | 'vice_president';
type Category = 'sc_st' | 'women' | 'general';

export const FORM14_CATEGORIES: { key: Category; label: string }[] = [
  { key: 'sc_st', label: 'ப.இ/பகு' },
  { key: 'women', label: 'மகளிர்' },
  { key: 'general', label: 'பொது' }
];

export interface Form14ARow {
  serial: number;
  rowSpan?: number;
  district_name: string;
  zone_name: string;
  society_name: string;
  filed: string;
  rejected: string;
  eligible: string;
  withdrawn: string;
  final_list: string;
  unopposed_president: string;
  contesting: string;
}

export interface Form14BRow {
  serial: number;
  rowSpan?: number;
  district_name: string;
  zone_name: string;
  society_name: string;
  contesting: Record<Category, string[]>;
  votes: Record<Category, string[]>;
  president: string;
  stopped: string;
}

const names = (list: any[] | undefined): string => {
  const n = (list || []).map(c => c?.member_name).filter(Boolean);
  return n.length ? n.join(', ') : '-';
};


// District / zone shown once per group: the first row of each run of the
// same district+zone carries rowSpan and the group's serial number.
function mergeGroups<T extends { district_name: string; zone_name: string; rowSpan?: number; serial?: number }>(rows: T[]): T[] {
  let serial = 0;
  for (let i = 0; i < rows.length; i++) {
    const prev = rows[i - 1];
    if (prev && prev.district_name === rows[i].district_name && prev.zone_name === rows[i].zone_name) {
      rows[i].rowSpan = undefined;
      continue;
    }
    let span = 1;
    while (rows[i + span] && rows[i + span].district_name === rows[i].district_name && rows[i + span].zone_name === rows[i].zone_name) span++;
    rows[i].rowSpan = span;
    rows[i].serial = ++serial;
  }
  return rows;
}

export function buildForm14Rows(
  forms: any[],
  winnerKey: string = 'president_winner'
): { aRows: Form14ARow[]; bRows: Form14BRow[] } {
  const aRows: Form14ARow[] = [];
  const bRows: Form14BRow[] = [];

  for (const form of forms || []) {
    const district = form.district?.name || '-';
    const zone = form.zone?.name || '-';

    for (const s of form.societies || []) {
      const stopped = !!s.is_stopped;
      const isPoll = !stopped && s.election_type === 'POLL';
      const isUnopposed = !stopped && s.election_type === 'UNOPPOSED';
      const finalList: any[] = s.final_candidates || s.table6_candidates || [];
      const president = s[winnerKey]?.member_name || '-';

      aRows.push({
        serial: aRows.length + 1,
        district_name: district,
        zone_name: zone,
        society_name: s.society_name || '-',
        filed: names(s.table1_candidates || s.candidates),
        rejected: names(s.table3_candidates),
        eligible: names(s.table4_candidates),
        withdrawn: names(s.table5_candidates),
        final_list: stopped ? '-' : names(finalList),
        unopposed_president: isUnopposed ? president : '-',
        contesting: isPoll ? names(finalList) : '-'
      });

      if (isPoll || stopped) {
        const byCat = (fmt: (c: any) => string) =>
          Object.fromEntries(FORM14_CATEGORIES.map(({ key }) => [
            key,
            isPoll ? finalList.filter(c => c.category_type === key).map(fmt) : []
          ])) as Record<Category, string[]>;

        bRows.push({
          serial: bRows.length + 1,
          district_name: district,
          zone_name: zone,
          society_name: isPoll ? (s.society_name || '-') : '-',
          contesting: byCat(c => c.member_name),
          votes: byCat(c => `${c.member_name} : ${c.votes_obtained ?? '-'}`),
          president: isPoll ? president : '-',
          stopped: stopped ? `${s.society_name || '-'} — ${s.stop_reason_label || '-'}` : '-'
        });
      }
    }
  }

  return { aRows: mergeGroups(aRows), bRows: mergeGroups(bRows) };
}

@Component({
  selector: 'app-form14-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form14-table.html',
  styleUrls: ['./form14-table.css']
})
export class Form14Table {

  @Input() part: Form14Part = 'a';
  @Input() departmentName = '';

  // president → படிவம் 14, vice_president → படிவம் 15
  private _office: Form14Office = 'president';
  private _forms: any[] = [];

  @Input() set office(value: Form14Office) {
    this._office = value === 'vice_president' ? 'vice_president' : 'president';
    this.build();
  }
  get office(): Form14Office { return this._office; }

  get formNo(): number { return this._office === 'vice_president' ? 15 : 14; }
  get role(): string { return this._office === 'vice_president' ? 'துணைத் தலைவர்' : 'தலைவர்'; }

  readonly categories = FORM14_CATEGORIES;

  aRows: Form14ARow[] = [];
  bRows: Form14BRow[] = [];

  @Input() set forms(value: any[] | null | undefined) {
    this._forms = value || [];
    this.build();
  }

  private build(): void {
    const winnerKey = this._office === 'vice_president' ? 'vice_president_winner' : 'president_winner';
    const built = buildForm14Rows(this._forms, winnerKey);
    this.aRows = built.aRows;
    this.bRows = built.bRows;
  }
}
