import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Form14Part, Form14Table } from '../../shared/form14-table/form14-table';
import { AbstractTable } from '../shared/abstract-table/abstract-table';
import { AbstractResult, abstract14 } from '../shared/abstract12to16';

// Admin படிவம் 15 (a) at /table10 and 15 (b) at /table10b — the route's
// data.part picks which half; Department / District filters as before.
@Component({
  selector: 'app-table10',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Form14Table, AbstractTable],
  templateUrl: './table10.html',
  styleUrls: ['./table10.css']
})
export class Table10 implements OnInit {

  part: Form14Part = 'a';

  // Full list ⇄ district / zone-wise abstract (same rules as the abstract PDF)
  viewMode: 'full' | 'abstract' = 'full';
  abstract: AbstractResult = { groups: [], zones: [] };
  readonly formNumber = 'படிவம் 15';
  readonly title = 'தலைவர் தேர்தல் விவரம்';

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }
  department_name = '';
  forms: any[] = [];

  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  constructor(private userService: UserService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.part = this.route.snapshot.data?.['part'] === 'b' ? 'b' : 'a';
    this.loadDepartments();
    this.loadDistricts();
    this.applyFilter();
  }

  loadDepartments(): void {
    this.userService.getdepartment().subscribe((res: any) => {
      if (res?.success) {
        this.departmentList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });
  }

  loadDistricts(): void {
    this.userService.getdistrict().subscribe((res: any) => {
      if (res?.success) {
        this.districtList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });
  }

  private get deptId(): number | undefined {
    return this.departmentList.find(d => d.name === this.selectedDepartment)?.id;
  }

  private get distId(): number | undefined {
    return this.districtList.find(d => d.name === this.selectedDistrict)?.id;
  }

  applyFilter(): void {
    this.userService.loadForm10Filtered(this.deptId, this.distId).subscribe({
      next: (res: any) => {
        this.forms = res?.success ? (res.data || []) : [];
        this.department_name = this.forms[0]?.department?.name || '';
        this.abstract = abstract14(this.forms, this.part, 'vice_president');
      },
      error: err => console.error(err)
    });
  }

  downloadPdf(): void {
    if (this.viewMode === 'abstract') {
      this.userService.getVicePresidentAbstractPdf(this.deptId, this.distId, this.part).subscribe({
        next: (res: any) => saveAs(new Blob([res], { type: 'application/pdf' }), `Form15${this.part}_Abstract_Report.pdf`),
        error: err => console.error(err)
      });
      return;
    }

    this.userService.getForm10Pdf(this.deptId, this.distId, this.part).subscribe({
      next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), `Form15${this.part}_Report.pdf`),
      error: err => console.error(err)
    });
  }
}
