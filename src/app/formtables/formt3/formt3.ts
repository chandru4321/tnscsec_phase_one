import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Stop reason codes (same as Form5B / Form7) → Tamil label
const STOP_REASONS: Record<string, string> = {
  legal_order: 'சட்ட ஒழுங்கு',
  natural_disaster: 'இயற்கை பேரிடர்',
  court_injunction: 'நீதிமன்ற தடையாணை',
  election_cancelled_by_commission: 'ஆணையத்தால் தேர்தல் ரத்து',
  insufficient_candidates: 'சிற்றெண் குறைவு',
  other: 'இதர காரணங்கள்'
};

const stopReasonLabel = (soc: any): string => {
  const label = STOP_REASONS[soc.stop_reason] || soc.stop_reason || '-';
  return soc.stop_reason === 'other' && soc.stop_other_reason_text
    ? `${label} - ${soc.stop_other_reason_text}` : label;
};

interface TableRow {
  district_name: string;
  zone_name: string;

  // Society name lands in exactly one of these two, depending on whether
  // the society gave its own member list or the officer drafted it himself.
  member_society_name: string | null;
  non_member_society_name: string | null;

  member_count: number;
  non_member_count: number;

  ass_memlist: number | null;   // draft voter list count
  ero_claim: string;            // 'ஆம்' | 'இல்லை' | '-'
  jcount: number;               // removed (நீக்கப்பட்ட)
  rcount: number;               // added (சேர்க்கப்பட்ட)
  total: number | null;         // final voter list count

  // Election stopped at Form3 — name + reason
  stopped_society_name: string;
  stop_reason_display: string;

  rowSpan?: number;
}

@Component({
  selector: 'app-formt3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formt3.html',
  styleUrls: ['./formt3.css']
})
export class Formt3 implements OnInit {

  tableRows: TableRow[] = [];
  department_name = '';

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadForm3();
  }

  loadForm3(): void {
    this.userService.getForm3Table().subscribe({
      next: (res) => {

        console.log("FORM3 FULL RESPONSE:", res);

        const apiData = res?.data?.data;   // ✅ FIX HERE

        if (res?.success && Array.isArray(apiData) && apiData.length > 0) {

          this.department_name = apiData[0].department_name;

          this.prepareRows(apiData);
        } else {
          this.tableRows = [];
        }
      },
      error: (err) => {
        console.error("FORM3 API ERROR:", err);
      }
    });
  }

  private prepareRows(data: any[]): void {
    const rows: TableRow[] = [];

    data.forEach(item => {
      const societies = item.societies || [];
      const span = societies.length;
      const memberCount = societies.filter((s: any) => s.is_member_list === true).length;

      societies.forEach((soc: any, index: number) => {

        const isMember = soc.is_member_list === true;

        rows.push({
          district_name: item.district_name,
          zone_name: item.zone_name,
          member_society_name: isMember ? soc.society_name : null,
          non_member_society_name: isMember ? null : soc.society_name,
          member_count: memberCount,
          non_member_count: span - memberCount,
          ass_memlist: soc.ass_memlist,
          ero_claim:
            soc.ero_claim === 1 ? 'ஆம்' :
              soc.ero_claim === 0 ? 'இல்லை' : '-',
          jcount: soc.jcount || 0,
          rcount: soc.rcount || 0,
          total: soc.total,
          stopped_society_name: soc.is_stopped ? soc.society_name : '-',
          stop_reason_display: soc.is_stopped ? stopReasonLabel(soc) : '-',
          rowSpan: index === 0 ? span : undefined
        });
      });
    });

    this.tableRows = rows;
  }

  /* Excel Export */
  downloadPdf(): void {

    const departmentId = 2;

    this.userService.getForm3Pdf(departmentId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form3_Report.pdf'
        );

      },
      error => {

        console.error('PDF download error:', error);

      }
    );
  }
}