import { Directive, OnInit } from '@angular/core';
import { saveAs } from 'file-saver';
import { Observable } from 'rxjs';
import { UserService } from '../../services/user';

// One district/zone row of an abstract: running totals for each column
export interface AbstractZoneRow {
  district_name: string;
  zone_name: string;
  values: number[];
}

// A column group in the abstract header. With `subs` it spans one column
// per sub-heading; without, it is a single column spanning both header rows.
export interface AbstractGroup {
  label: string;
  subs?: string[];
}

// Collects one abstract row per district/zone, each holding `size` totals
export function zoneCollector(size: number) {
  const zones = new Map<string, AbstractZoneRow>();
  return {
    get(district: string, zone: string): number[] {
      const key = `${district || '-'}||${zone || '-'}`;
      if (!zones.has(key)) {
        zones.set(key, { district_name: district || '-', zone_name: zone || '-', values: new Array(size).fill(0) });
      }
      return zones.get(key)!.values;
    },
    list: () => Array.from(zones.values())
  };
}

// Shared behaviour of the Form8 / Form10 / Form11 / Form12 admin pages:
// Department/District filters, Full List ⇄ Abstract toggle, PDF download.
@Directive()
export abstract class AdminReportPage implements OnInit {

  department_name = '';
  viewMode: 'full' | 'abstract' = 'full';

  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  constructor(protected userService: UserService) { }

  ngOnInit(): void {
    this.userService.getdepartment().subscribe((res: any) => {
      if (res?.success) {
        this.departmentList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });

    this.userService.getdistrict().subscribe((res: any) => {
      if (res?.success) {
        this.districtList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });

    this.load();
  }

  protected get deptId(): number | undefined {
    return this.departmentList.find(d => d.name === this.selectedDepartment)?.id;
  }

  protected get distId(): number | undefined {
    return this.districtList.find(d => d.name === this.selectedDistrict)?.id;
  }

  /** Load the list for the current filters */
  abstract load(): void;

  applyFilter(): void {
    this.load();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }

  protected savePdf(request: Observable<any>, fileName: string): void {
    request.subscribe({
      next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), fileName),
      error: err => console.error('PDF download error:', err)
    });
  }
}
