import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';

// Overview at the top of the admin dashboard: headline numbers, how far
// the officers have got through the forms, how the societies' elections
// turned out, polling, and who was elected. One call to /dashboard/summary.

interface Segment { key: string; label: string; value: number; color: string; }

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-overview.html',
  styleUrls: ['./admin-overview.css']
})
export class AdminOverview implements OnInit {

  summary: any = null;
  loading = true;
  failed = false;

  selectedDepartment = '';
  selectedDistrict = '';
  departmentList: { id: number; name: string }[] = [];
  districtList: { id: number; name: string }[] = [];

  // Progress is measured against officers who have started (submitted Form 1)
  progressBase = 0;

  segments: Segment[] = [];
  outcomeTotal = 0;

  // Categorical slots 1–4 in fixed order (validated palette)
  private readonly outcomeColors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#898781'];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getdepartment().subscribe((res: any) => {
      if (res?.success) {
        this.departmentList = res.data.filter((d: any) => d.is_active === 1)
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });
    this.userService.getdistrict().subscribe((res: any) => {
      if (res?.success) {
        this.districtList = res.data.filter((d: any) => d.is_active === 1)
          .map((d: any) => ({ id: d.id, name: d.name.trim() }));
      }
    });
    this.load();
  }

  load(): void {
    const deptId = this.departmentList.find(d => d.name === this.selectedDepartment)?.id;
    const distId = this.districtList.find(d => d.name === this.selectedDistrict)?.id;

    this.loading = true;
    this.failed = false;

    this.userService.getDashboardSummary(deptId, distId).subscribe({
      next: (res: any) => {
        this.summary = res?.success ? res.data : null;
        this.failed = !this.summary;
        this.loading = false;
        if (this.summary) {
          this.progressBase = this.summary.progress?.[0]?.done || 0;
          this.buildSegments();
        }
      },
      error: () => { this.failed = true; this.loading = false; }
    });
  }

  private buildSegments(): void {
    const o = this.summary.outcome;
    const parts = [
      { key: 'unopposed', label: 'போட்டியின்றி தேர்வு', value: o.unopposed },
      { key: 'polling', label: 'வாக்குப்பதிவு தேவை', value: o.polling },
      { key: 'partial', label: 'பகுதி நிர்வாகக்குழு (50% மேல்)', value: o.partial },
      { key: 'stopped', label: 'தேர்தல் நிறுத்தம்', value: o.stopped },
      { key: 'short', label: 'வேட்பாளர் குறைவு (50% கீழ்)', value: o.short }
    ];
    this.segments = parts.map((p, i) => ({ ...p, color: this.outcomeColors[i] }));
    this.outcomeTotal = parts.reduce((t, p) => t + p.value, 0);
  }

  pct(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Width for a progress bar, never wider than the track
  barWidth(value: number, total: number): number {
    return total > 0 ? Math.min(100, (value / total) * 100) : 0;
  }
}
