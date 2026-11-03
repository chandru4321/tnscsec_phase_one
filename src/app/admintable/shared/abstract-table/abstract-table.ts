import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractGroup, AbstractZoneRow } from '../admin-report';

// District/zone-wise abstract table used by the Form8, Form10, Form11 and
// Form12 admin pages — same layout as the Form6/Form7/Form9 abstracts:
// வ. எண் / மாவட்டம் / சரகம், the count columns, a column-number row, and a
// மொத்தம் row with the zone count under சரகம்.
@Component({
  selector: 'app-abstract-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abstract-table.html',
  styleUrls: ['./abstract-table.css']
})
export class AbstractTable {

  @Input() formNumber = '';
  @Input() title = '';
  @Input() department = '';
  @Input() groups: AbstractGroup[] = [];
  @Input() rows: AbstractZoneRow[] = [];

  get columnCount(): number {
    return 3 + this.groups.reduce((n, g) => n + (g.subs?.length || 1), 0);
  }

  get hasSubs(): boolean {
    return this.groups.some(g => !!g.subs?.length);
  }

  get subHeadings(): string[] {
    return this.groups.flatMap(g => g.subs || []);
  }

  get totals(): number[] {
    const size = this.columnCount - 3;
    const totals = new Array(size).fill(0);
    this.rows.forEach(r => r.values.forEach((v, i) => (totals[i] += v)));
    return totals;
  }
}
