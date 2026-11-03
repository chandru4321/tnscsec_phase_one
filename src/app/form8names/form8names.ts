import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { saveAs } from 'file-saver';
import { UserService } from '../services/user';

interface Names {
  sc: string;
  women: string;
  general: string;
}

interface NameRow {
  society_name: string;
  unopposed: Names | null;
  aboveHalfQuorum: Names | null;
  winners: Names | null;
  stopped: { stage: string; reason: string } | null;
}

@Component({
  selector: 'app-form8names',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form8names.html',
  styleUrls: ['./form8names.css']
})
export class Form8Names implements OnInit {

  rows: NameRow[] = [];
  department_name = '';
  district_name = '';
  zone_name = '';

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';

    // Same rows as the admin page and the PDF (backend /form8/name/list)
    this.userService.getForm11List().subscribe({
      next: (res: any) => {
        this.department_name = localStorage.getItem('department_name') || '';
        this.rows = this.buildRows(res?.success ? res.data?.rows || [] : []);
      },
      error: err => { console.error(err); this.rows = []; }
    });
  }

  downloadPdf(): void {

    // No hard-coded department: the backend uses the logged-in user's own
    // department/district, the same data this table shows.
    this.userService.getForm8NamesPdf().subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form8_Names_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }

  private buildRows(apiRows: any[]): NameRow[] {
    const names = (n: any): Names | null => n ? {
      sc: (n.sc_st || []).join(', ') || '-',
      women: (n.women || []).join(', ') || '-',
      general: (n.general || []).join(', ') || '-'
    } : null;

    return apiRows.map(r => ({
      society_name: r.society_name || '-',
      unopposed: names(r.unopposed),
      aboveHalfQuorum: names(r.aboveHalfQuorum),
      winners: names(r.winners),
      stopped: r.stopped ?? null
    }));
  }
}
