import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UserService } from '../../services/user';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AbstractGroup, AbstractZoneRow, zoneCollector } from '../shared/admin-report';
import { AbstractTable } from '../shared/abstract-table/abstract-table';

interface TableRow {
  department_name: string;
  district_name: string;
  zone_name: string;
  society_name: string;

  casted_votes: number;
  ballot_votes: number;
  valid_votes: number;
  invalid_votes: number;

  sc_name: string;
  women_name: string;
  general_name: string;

  sc_count: number;
  women_count: number;
  general_count: number;
  total_count: number;

  remarks: string;
  stopped: string;   // stopped at vote counting: "society — reason"
}

@Component({
  selector: 'app-formt8',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AbstractTable],
  templateUrl: './table8.html',
  styleUrls: ['./table8.css']
})
export class Table8 implements OnInit {

  department_name = '';
  tableRows: TableRow[] = [];

  viewMode: 'full' | 'abstract' = 'full';
  abstractRows: AbstractZoneRow[] = [];

  readonly title = 'வாக்கு எண்ணிக்கை மற்றும் தேர்தல் முடிவுகள் விபரம்';

  // Same columns as the backend's Form10 abstract PDF
  readonly abstractGroups: AbstractGroup[] = [
    { label: 'வாக்குப்பதிவு நடைபெற்ற சங்கங்களின் எண்ணிக்கை' },
    { label: 'மொத்த பதிவான வாக்குகள்' },
    { label: 'வாக்கு எண்ணிக்கையின் போது வாக்குப்பெட்டியில் இருந்த வாக்குகளின் எண்ணிக்கை' },
    { label: 'செல்லுபடியான வாக்குகளின் எண்ணிக்கை' },
    { label: 'செல்லுபடியாகாத வாக்குகளின் எண்ணிக்கை' },
    { label: 'வாக்குப்பதிவின் மூலம் தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள் எண்ணிக்கை', subs: ['ப.இ./ப.கு', 'பெண்கள்', 'பொது', 'மொத்தம்'] },
    { label: 'வாக்கு எண்ணிக்கையின் போது தேர்தல் நிறுத்தப்பட்ட சங்கங்கள்' }
  ];

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'abstract' : 'full';
  }
  selectedDepartment = '';
  selectedDistrict = '';

  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {

    this.loadDepartments();
    this.loadDistricts();
    this.loadForm8();

  }


  loadDepartments(): void {

    this.userService.getdepartment().subscribe((res: any) => {

      if (res?.success) {

        this.departmentList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({
            id: d.id,
            name: d.name.trim()
          }));

      }

    });

  }

  loadDistricts(): void {

    this.userService.getdistrict().subscribe((res: any) => {

      if (res?.success) {

        this.districtList = res.data
          .filter((d: any) => d.is_active === 1)
          .map((d: any) => ({
            id: d.id,
            name: d.name.trim()
          }));

      }

    });

  }

  loadForm8(): void {

    this.userService.loadForm8Filtered().subscribe({

      next: (res: any) => {

        if (!res.success || !res.data?.length) {

          this.tableRows = [];
          this.abstractRows = [];
          return;

        }

        this.prepareRows(res.data);

      },

      error: err => console.error(err)

    });

  }

  prepareRows(data: any[]): void {

    const rows: TableRow[] = [];

    // Abstract: [societies, casted, ballot, valid, invalid, elected sc, w, g, total, stopped]
    const zones = zoneCollector(10);

    data.forEach((form: any) => {

      // Read values from the API correctly
      const department = form.department_name || '';
      const district = form.district_name || '';
      const zone = form.zone_name || '';

      this.department_name = department;

      form.societies?.forEach((soc: any) => {

        const categories = soc.categories || [];

        const getNames = (type: string): string => {
          const cat = categories.find((c: any) => c.category === type);

          return cat?.winners?.length
            ? cat.winners.map((w: any) => w.member_name).join('\n')
            : '-';
        };

        const getCount = (type: string): number => {
          const cat = categories.find((c: any) => c.category === type);
          return cat?.winners?.length || 0;
        };

        const sc = getCount('SC_ST');
        const women = getCount('WOMEN');
        const general = getCount('GENERAL');

        rows.push({

          department_name: department,

          district_name: district,

          zone_name: zone,      // <-- fixed

          society_name: soc.society_name || '-',

          casted_votes: soc.casted_votes_count || 0,

          ballot_votes: soc.polling_details?.ballot_votes_at_counting || 0,

          valid_votes: soc.polling_details?.valid_votes || 0,

          invalid_votes: soc.polling_details?.invalid_votes || 0,

          sc_name: getNames('SC_ST'),

          women_name: getNames('WOMEN'),

          general_name: getNames('GENERAL'),

          sc_count: sc,

          women_count: women,

          general_count: general,

          total_count: sc + women + general,

          remarks: soc.polling_details?.remarks || '-',

          // Election stopped at vote counting: "society — reason"
          stopped: soc.is_stopped ? `${soc.society_name || '-'} — ${soc.stop_reason_label || '-'}` : '-'

        });

        const v = zones.get(district, zone);
        v[0] += 1;
        v[1] += Number(soc.casted_votes_count) || 0;
        v[2] += Number(soc.polling_details?.ballot_votes_at_counting) || 0;
        v[3] += Number(soc.polling_details?.valid_votes) || 0;
        v[4] += Number(soc.polling_details?.invalid_votes) || 0;
        v[5] += sc;
        v[6] += women;
        v[7] += general;
        v[8] += sc + women + general;
        if (soc.is_stopped) v[9] += 1;   // stopped at vote counting

      });

    });

    this.tableRows = rows;
    this.abstractRows = zones.list();

  }

  applyFilter(): void {

    const deptId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const distId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    this.userService.loadForm8Filtered(deptId, distId)
      .subscribe({

        next: (res: any) => {

          if (!res.success || !res.data?.length) {

            this.tableRows = [];
            this.abstractRows = [];
            return;

          }

          this.prepareRows(res.data);

        }

      });

  }
  downloadPdf(): void {

    const deptId = this.departmentList.find(
      d => d.name === this.selectedDepartment
    )?.id;

    const distId = this.districtList.find(
      d => d.name === this.selectedDistrict
    )?.id;

    if (this.viewMode === 'abstract') {
      this.userService.getForm10AbstractPdf(deptId, distId).subscribe({
        next: (res: Blob) => saveAs(new Blob([res], { type: 'application/pdf' }), 'Form10_Abstract_Report.pdf'),
        error: err => console.error('Abstract PDF download error:', err)
      });
      return;
    }

    this.userService.getForm8Pdf(deptId, distId)
      .subscribe({

        next: (res: Blob) => {

          saveAs(
            new Blob([res], { type: 'application/pdf' }),
            'Form8_Report.pdf'
          );

        }

      });

  }
}