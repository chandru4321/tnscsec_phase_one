import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { saveAs } from 'file-saver';
import { UserService } from '../services/user';

// படிவம் 16 — "தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள், தலைவர்,
// துணைத்தலைவர் விவரம்". Rows come from the backend's /form8/office/list
// (the same rows its PDF uses).
type Category = 'sc_st' | 'women' | 'general';

interface Person { form5_member_id: number | null; member_name: string; aadhar_no: string | null; }

interface OfficeRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  counts: { sc_st: number; women: number; general: number; total: number };
  members: Record<Category, Person[]>;
  president: { category: Category; person: Person } | null;
  vicePresident: { category: Category; person: Person } | null;
}

@Component({
  selector: 'app-form8office',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form8office.html',
  styleUrls: ['../form8names/form8names.css', '../form8counts/form8counts.css', './form8office.css']
})
export class Form8Office implements OnInit {

  rows: OfficeRow[] = [];
  department_name = '';
  readonly today = new Date();

  readonly categories: Category[] = ['sc_st', 'women', 'general'];
  readonly categoryLabels = ['ப.இ/பகு', 'மகளிர்', 'பொது'];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getForm8OfficeList().subscribe({
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

  // People of one category in an office column (president / vice-president)
  office(o: OfficeRow['president'], c: Category): Person[] {
    return o && o.category === c ? [o.person] : [];
  }

  // Full Aadhaar number (this official report needs it), grouped in fours
  aadhar(value: string | null): string {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? digits.replace(/(\d{4})(?=\d)/g, '$1 ') : '-';
  }

  downloadPdf(): void {
    // No department filter: the backend uses the logged-in user's own data,
    // the same rows this table shows.
    this.userService.getForm8OfficePdf().subscribe({
      next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), 'Form16_Elected_Members_President_VP.pdf'),
      error: err => console.error('PDF download error:', err)
    });
  }
}
