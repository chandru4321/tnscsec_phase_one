import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-formt7',
  templateUrl: './formt7.html',
  styleUrl: './formt7.css',
  imports: [CommonModule],
  standalone: true,
})
export class Formt7 implements OnInit {

  // Old content kept (not removed)
  baseUrl = 'YOUR_API_BASE_URL';

  form7Data: any;
  societies: any[] = [];

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_quorum', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  constructor(
    private userservice: UserService,
    private http: HttpClient   // kept because old code uses it
  ) { }

  ngOnInit(): void {
    console.log('Form7 loaded');
    this.getForm7Table();
  }

  // API CALL (Fixed to use UserService)
  getForm7Table() {
    this.userservice.getForm7Table().subscribe({
      next: (res: any) => {
        console.log('Form7 Response:', res);

        if (res.data && res.data.length > 0) {
          this.form7Data = res.data[0];   // take first object
          this.societies = this.form7Data.societies || [];
        }
      },
      error: (err) => {
        console.error('Form7 Error:', err);
      }
    });
  }
  // Rural values
  getRuralValue(society: any, type: string) {
    return society.rural?.[type] || 0;
  }

  // Declared values only if eligible = true
  getDeclaredValue(society: any, type: string) {
    const cat = society.qualified_categories?.[type];
    return cat && cat.eligible ? cat.count : 0;
  }

  getDeclaredTotal(society: any) {
    let total = 0;
    ['sc_st', 'women', 'general'].forEach(type => {
      const cat = society.qualified_categories?.[type];
      if (cat && cat.eligible) {
        total += cat.count;
      }
    });
    return total;
  }

  // Polling actually held: Form7 entered with a polling date, not stopped
  isPollingHeld(society: any): boolean {
    return !!society.submitted_data?.polling_date && !society.submitted_data?.stop_reason;
  }

  pollingHeldCount(): number {
    return this.societies.filter(s => this.isPollingHeld(s)).length;
  }

  resolveStopName(society: any): string {
    return society.submitted_data?.stop_reason ? society.society_name : '-';
  }

  resolveStopReason(society: any): string {

    const reason = society.submitted_data?.stop_reason;

    if (!reason) return '-';

    const opt = this.reasonOptions.find(r => r.value === reason);
    const label = opt?.label || reason;

    return reason === 'other' && society.submitted_data?.stop_other_reason_text
      ? `${label} - ${society.submitted_data.stop_other_reason_text}`
      : label;
  }

  // Excel Export

  downloadPdf(): void {

    const departmentId = 2;

    this.userservice.getForm7Pdf(departmentId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form7_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }
}