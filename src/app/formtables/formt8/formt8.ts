import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';

interface TableRow {
  district_name: string;
  zone_name: string;
  society_name: string;

  casted_votes: number;
  ballot_votes: number;
  valid_votes: number;
  invalid_votes: number;

  // One row per candidate; the society-level cells are filled only on the
  // society's first row (rowSpan covers the rest).
  candidate_name: string;
  category_label: string;
  votes_obtained: number | string;
  total_count: number;

  // Election stopped at vote counting: "society — reason"
  stopped: string;

  rowSpan?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  SC_ST: 'ப.இ./ப.கு',
  WOMEN: 'பெண்கள்',
  GENERAL: 'பொது'
};

@Component({
  selector: 'app-formt8',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formt8.html',
  styleUrls: ['./formt8.css']
})
export class Formt8 implements OnInit {

  department_name = '';
  tableRows: TableRow[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadForm8();
  }

  loadForm8(): void {
    this.userService.getForm8Table().subscribe(res => {

      if (!res?.success || !res.data?.length) return;

      const rows: TableRow[] = [];

      res.data.forEach((form: any) => {

        const department = localStorage.getItem('department_name') || '';
        const district = localStorage.getItem('district_name') || '';
        const zone = localStorage.getItem('zone_name') || '';

        this.department_name = department;

        form.societies?.forEach((soc: any) => {

          const categories = soc.categories || [];

          const candidates = categories.flatMap((cat: any) =>
            (cat.candidates || []).map((w: any) => ({
              name: w.member_name || '-',
              label: CATEGORY_LABELS[cat.category] || cat.category,
              votes: w.votes_obtained ?? 0
            }))
          );

          const total = candidates.length;
          const list = candidates.length ? candidates : [{ name: '-', label: '-', votes: '-' }];

          list.forEach((c: any, index: number) => {

            rows.push({
              district_name: district,
              zone_name: zone,
              society_name: soc.society_name || '-',

              casted_votes: soc.casted_votes_count || 0,
              ballot_votes: soc.polling_details?.ballot_votes_at_counting || 0,
              valid_votes: soc.polling_details?.valid_votes || 0,
              invalid_votes: soc.polling_details?.invalid_votes || 0,

              candidate_name: c.name,
              category_label: c.label,
              votes_obtained: c.votes,
              total_count: total,
              stopped: soc.is_stopped ? `${soc.society_name || '-'} — ${soc.stop_reason_label || '-'}` : '-',

              rowSpan: index === 0 ? list.length : undefined
            });

          });

        });

      });


      this.tableRows = rows;
    });
  }

  downloadPdf(): void {

    const departmentId = 2;

    this.userService.getForm8Pdf(departmentId).subscribe(
      (res: Blob) => {

        saveAs(
          new Blob([res], { type: 'application/pdf' }),
          'Form8_Report.pdf'
        );

      },
      error => {
        console.error('PDF download error:', error);
      }
    );
  }
}
