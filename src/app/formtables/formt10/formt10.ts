import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { Form14Part, Form14Table } from '../../shared/form14-table/form14-table';

// படிவம் 15 (a) at /Formt10 and 15 (b) at /formt10b — the route's data.part
// picks which half of the vice-president election table is shown.
@Component({
  selector: 'app-formt10',
  standalone: true,
  imports: [CommonModule, Form14Table],
  templateUrl: './formt10.html',
  styleUrls: ['./formt10.css']
})
export class Formt10 implements OnInit {

  part: Form14Part = 'a';
  department_name = '';
  forms: any[] = [];

  constructor(private userService: UserService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.part = this.route.snapshot.data?.['part'] === 'b' ? 'b' : 'a';
    this.loadForm10();
  }

  loadForm10(): void {
    this.userService.getForm10List().subscribe(res => {
      this.forms = res?.success ? (res.data || []) : [];
      this.department_name = this.forms[0]?.department?.name || '';
    });
  }

  downloadPdf(): void {
    // No department filter: the backend uses the logged-in user's own data,
    // the same rows this table shows.
    this.userService.getForm10Pdf(undefined, undefined, this.part).subscribe({
      next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), `Form15${this.part}_Report.pdf`),
      error: err => console.error('PDF download error:', err)
    });
  }
}
