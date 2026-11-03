import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractGroup, AbstractZoneRow, AdminReportPage, zoneCollector } from '../shared/admin-report';
import { AbstractTable } from '../shared/abstract-table/abstract-table';
import { ReportActions } from '../shared/report-actions/report-actions';

// Form11 — elected committee members' names, admin page. Rows come from
// the backend's /form8/name/list, the same rows its PDFs use.
type Names = { sc_st: string[]; women: string[]; general: string[] };

interface NameRow {
  district_name: string;
  zone_name: string;
  society_name: string;
  unopposed: Names | null;
  aboveHalfQuorum: Names | null;
  winners: Names | null;
  stopped: { stage: string; reason: string } | null;
  rowSpan?: number;
  serial?: number;
}

@Component({
  selector: 'app-table8names',
  standalone: true,
  imports: [CommonModule, ReportActions, AbstractTable],
  templateUrl: './table8names.html',
  styleUrls: ['../shared/admin-report.css']
})
export class Table8Names extends AdminReportPage {

  tableRows: NameRow[] = [];
  abstractRows: AbstractZoneRow[] = [];

  readonly title = 'சங்கத்தின் நிர்வாகக்குழு உறுப்பினர் தேர்தல் முழுமையாக முடிவுற்று தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்களின் பெயர் பட்டியல்';

  readonly abstractGroups: AbstractGroup[] = [
    { label: 'தேர்தல் அறிவிப்புப்படி தேர்தல் முடிவடைந்த சங்கங்களின் எண்ணிக்கை' },
    { label: 'சமமாக இருந்து போட்டியின்றி தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள்', subs: ['சங்கங்கள்', 'ப.இ./ப.கு', 'பெண்கள்', 'பொது'] },
    { label: 'குறைவாக இருந்து போட்டியின்றி தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள் (50% மேல்)', subs: ['சங்கங்கள்', 'ப.இ./ப.கு', 'பெண்கள்', 'பொது'] },
    { label: 'வாக்குப்பதிவு மூலம் தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள்', subs: ['சங்கங்கள்', 'ப.இ./ப.கு', 'பெண்கள்', 'பொது'] }
  ];

  load(): void {
    this.userService.getForm11List(this.deptId, this.distId).subscribe({
      next: (res: any) => this.prepare(res?.success ? res.data : null),
      error: err => { console.error(err); this.prepare(null); }
    });
  }

  private prepare(data: any): void {

    this.department_name = data?.departmentName && data.departmentName !== '-' ? data.departmentName : '';

    const rows: NameRow[] = (data?.rows || []).map((r: NameRow) => ({ ...r }));

    // Serial + merged district/zone cells per district/zone group
    let serial = 0;
    rows.forEach((r, i) => {
      const prev = rows[i - 1];
      if (!prev || prev.district_name !== r.district_name || prev.zone_name !== r.zone_name) {
        let span = 1;
        while (rows[i + span] && rows[i + span].district_name === r.district_name && rows[i + span].zone_name === r.zone_name) span++;
        r.rowSpan = span;
        r.serial = ++serial;
      }
    });

    // [decided][unopposed: soc, sc, w, g][quorum: soc, sc, w, g][polling: soc, sc, w, g]
    const zones = zoneCollector(13);
    rows.forEach(r => {
      const v = zones.get(r.district_name, r.zone_name);
      v[0] += 1;
      [r.unopposed, r.aboveHalfQuorum, r.winners].forEach((n, i) => {
        if (!n) return;
        const o = 1 + i * 4;
        v[o] += 1;
        v[o + 1] += n.sc_st.length;
        v[o + 2] += n.women.length;
        v[o + 3] += n.general.length;
      });
    });

    this.tableRows = rows;
    this.abstractRows = zones.list();
  }

  names(list: string[] | undefined): string {
    return list?.length ? list.join(', ') : '-';
  }

  downloadPdf(): void {
    if (this.viewMode === 'abstract') {
      this.savePdf(this.userService.getForm11AbstractPdf(this.deptId, this.distId), 'Form11_Abstract_Report.pdf');
    } else {
      this.savePdf(this.userService.getForm8NamesPdf(this.deptId, this.distId), 'Form11_Report.pdf');
    }
  }
}
