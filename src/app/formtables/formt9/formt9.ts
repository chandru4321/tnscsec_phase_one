import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { Form14Part, Form14Table } from '../../shared/form14-table/form14-table';

// படிவம் 14 (a) at /formt9 and 14 (b) at /formt9b — the route's data.part
// picks which half of the president election table is shown.
@Component({
  selector: 'app-formt9',
  standalone: true,
  imports: [CommonModule, Form14Table],
  templateUrl: './formt9.html',
  styleUrls: ['./formt9.css']
})
export class formt9 implements OnInit {

  part: Form14Part = 'a';
  department_name = '';
  forms: any[] = [];

  constructor(private userService: UserService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.part = this.route.snapshot.data?.['part'] === 'b' ? 'b' : 'a';
    this.loadForm9();
  }

  loadForm9(): void {
    this.userService.getForm9List().subscribe(res => {
      this.forms = res?.success ? (res.data || []) : [];
      this.department_name = this.forms[0]?.department?.name || '';
    });
  }

  downloadPdf(): void {
    // No department filter: the backend uses the logged-in user's own data,
    // the same rows this table shows.
    this.userService.getForm9Pdf(undefined, undefined, this.part).subscribe({
      next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), `Form14${this.part}_Report.pdf`),
      error: err => console.error('PDF download error:', err)
    });
  }
}
