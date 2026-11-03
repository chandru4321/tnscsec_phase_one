import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


interface TableRow {
  district_name: string;
  zone_name: string;
  society_name: string;

  rural_sc: number;
  rural_women: number;
  rural_general: number;
  rural_total: number;

  // Only meaningful when the society was actually filed with declared
  // candidates (not stopped, not zero) — '-' otherwise, but the row itself
  // still exists so it stays visible in the "required societies" columns.
  declared_society_name: string;
  dec_sc: number | string;
  dec_women: number | string;
  dec_general: number | string;
  dec_total: number | string;

  rejected: string;

  // Only meaningful for a not-filed society's row — blank otherwise
  unfiled_society_name: string;
  unfiled_reason_display: string;

  rowSpan?: number;
}

@Component({
  selector: 'app-formt4',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formt4.html',
  styleUrls: ['./formt4.css']
})
export class Formt4 implements OnInit {

  tableRows: TableRow[] = [];
  department_name = '';

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_candidates', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  constructor(private userService: UserService) { }

  private resolveReason(soc: any): string {

    if (!soc.reason) return '-';

    const opt = this.reasonOptions.find(r => r.value === soc.reason);
    const label = opt?.label || soc.reason;

    return soc.reason === 'other' && soc.other_reason_text
      ? `${label} - ${soc.other_reason_text}`
      : label;
  }

  ngOnInit(): void {
    this.loadForm4();
  }





  loadForm4(): void {
    this.userService.getForm4Table().subscribe({
      next: (res) => {

        console.log("FORM4 FULL RESPONSE:", res);

        const apiData = res?.data?.data;   // ✅ IMPORTANT FIX

        if (res?.success && Array.isArray(apiData) && apiData.length > 0) {

          this.department_name = apiData[0].department?.name || '';
          this.prepareRows(apiData);
        } else {
          this.tableRows = [];
        }

      },
      error: err => console.error("FORM4 API ERROR:", err)
    });
  }

  private prepareRows(data: any[]): void {
    const rows: TableRow[] = [];

    data.forEach(item => {

      // Row identity/count always covers every society (filed or not) —
      // that's what drives the "required societies" columns. Whether the
      // "declared/filed" columns show anything for a given row is decided
      // separately below, so a stopped or zero-candidate filed society
      // still appears with its required-society data, just blank there.
      const hasDeclaredCandidates = (s: any) => {
        const d = s.declared_counts || {};
        return (Number(d.sc_st) || 0) + (Number(d.women) || 0) + (Number(d.general) || 0) > 0;
      };

      const societies = [
        ...(item.filed_societies || []).map((s: any) => ({ ...s, _isFiled: true })),
        ...(item.unfiled_societies || []).map((s: any) => ({ ...s, _isFiled: false }))
      ];

      const span = societies.length || 1;

      societies.forEach((soc: any, index: number) => {

        const rural = soc.rural_counts || {};
        const declared = soc.declared_counts || {};

        // A stopped society still filed real nominations — is_stopped only
        // means the election was halted afterward (e.g. at polling), not
        // that it was never filed — so it must still show here, same as
        // any other filed society with declared candidates.
        const showDeclared =
          soc._isFiled && hasDeclaredCandidates(soc);

        rows.push({
          district_name: item.district?.name,
          zone_name: item.zone?.name,
          society_name: soc.society_name || '-',

          rural_sc: rural.sc_st || 0,
          rural_women: rural.women || 0,
          rural_general: rural.general || 0,
          rural_total: rural.total || 0,

          declared_society_name: showDeclared ? (soc.society_name || '-') : '-',
          dec_sc: showDeclared ? (declared.sc_st || 0) : '-',
          dec_women: showDeclared ? (declared.women || 0) : '-',
          dec_general: showDeclared ? (declared.general || 0) : '-',
          dec_total: showDeclared ? (declared.total || 0) : '-',

          rejected:
            soc.election_status === 'UNQUALIFIED'
              ? soc.society_name
              : '-',

          unfiled_society_name: soc._isFiled ? '-' : (soc.society_name || '-'),
          unfiled_reason_display: soc._isFiled ? '-' : this.resolveReason(soc),

          rowSpan: index === 0 ? span : 0
        });

      });

      // if no societies
      if (societies.length === 0) {
        rows.push({
          district_name: item.district_name,
          zone_name: item.zone_name,
          society_name: '-',

          rural_sc: 0,
          rural_women: 0,
          rural_general: 0,
          rural_total: 0,

          declared_society_name: '-',
          dec_sc: '-',
          dec_women: '-',
          dec_general: '-',
          dec_total: '-',

          rejected: '-',
          unfiled_society_name: '-',
          unfiled_reason_display: '-',

          rowSpan: 1
        });
      }

    });

    this.tableRows = rows;
  }
  downloadPdf(): void {

    const departmentId = 2;

    this.userService.getForm4Pdf(departmentId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form2_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }
}