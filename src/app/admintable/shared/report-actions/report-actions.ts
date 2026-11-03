import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminReportPage } from '../admin-report';

// Action bar of the Form8 / Form10 / Form11 / Form12 admin pages:
// Department/District filters, Full List ⇄ Abstract toggle, Download PDF.
@Component({
  selector: 'app-report-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-actions.html',
  styleUrls: ['../admin-report.css']
})
export class ReportActions {
  @Input({ required: true }) page!: AdminReportPage & { downloadPdf(): void };
  // false for reports that have no abstract view (Form13 / Form14 / Form17)
  @Input() abstract = true;
}
