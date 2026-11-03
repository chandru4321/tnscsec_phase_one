import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { saveAs } from 'file-saver';
import { UserService } from '../services/user';

// "தேர்தல் முடிவடையாத சங்கங்கள் விபரம்" — societies whose committee
// election did not complete / was stopped, one column per reason. Rows
// come from the backend's /form8/incomplete/list (the same rows its PDF
// uses): ✓ in the reason column, or the free text under இதர காரணங்கள்.
interface IncompleteRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  stage_form: string;   // (5a) form where it stopped
  stage_text: string;   // (5b) election stage
  marks: string[];
}

@Component({
  selector: 'app-form8incomplete',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form8incomplete.html',
  styleUrls: ['../form8names/form8names.css', '../form8counts/form8counts.css', './form8incomplete.css']
})
export class Form8Incomplete implements OnInit {

  rows: IncompleteRow[] = [];
  department_name = '';

  // Columns 6–11 (same order as the backend's INCOMPLETE_COLUMNS)
  readonly reasonColumns = [
    'சட்ட ஒழுங்கு',
    'இயற்கை பேரிடர்',
    'நீதிமன்ற தடையாணை',
    'ஆணையத்தால் தேர்தல் ரத்து',
    'சிற்றெண் குறைவு',
    'இதர காரணங்கள்'
  ];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getForm8IncompleteList().subscribe({
      next: (res: any) => {
        const data = res?.success ? res.data : null;
        this.department_name = data?.departmentName && data.departmentName !== '-'
          ? data.departmentName
          : (localStorage.getItem('department_name') || '');
        this.rows = data?.rows || [];
      },
      error: err => { console.error(err); this.rows = []; }
    });
  }

  downloadPdf(): void {
    // No department filter: the backend uses the logged-in user's own data,
    // the same rows this table shows.
    this.userService.getForm8IncompletePdf().subscribe({
      next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), 'Election_Not_Completed_Societies.pdf'),
      error: err => console.error('PDF download error:', err)
    });
  }
}
