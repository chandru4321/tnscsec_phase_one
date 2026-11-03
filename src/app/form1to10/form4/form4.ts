import { inject, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { lockedMessageFrom } from '../../shared/form-lock';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-form4',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './form4.html',
  styleUrls: ['./form4.css']
})
export class Form4 implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Set when the edit API says this form is locked (shown as a banner)
  lockedMessage = '';

  department_id = 0;
  district_id = 0;
  zone_id = 0;

  district_name = '';
  zone_name = '';
  isEditMode = false;
  editableForm4Id: number | null = null;
  form4_id!: number;

  societyList: any[] = [];
  selectedSocietyList: any[] = [];
  unselectedSocietyList: any[] = [];

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_candidates', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  // F3 seat field → F4 declared-candidates field, per category
  readonly categories = [
    { label: 'ப.தி./ப.கு', seats: 'sc_st', declared: 'declared_sc_st' },
    { label: 'மகளிர்', seats: 'women', declared: 'declared_women' },
    { label: 'பொது', seats: 'general', declared: 'declared_general' }
  ];

  constructor(private userService: UserService, private router: Router
  ) { }

  // ngOnInit(): void {
  //   this.district_name = localStorage.getItem('district_name') || '';
  //   this.zone_name = localStorage.getItem('zone_name') || '';
  //   this.form4_id = Number(localStorage.getItem('form4_id'));

  //   this.loadF3();
  // }
  // ngOnInit(): void {

  //   this.district_name = localStorage.getItem('district_name') || '';
  //   this.zone_name = localStorage.getItem('zone_name') || '';
  //   console.log('district_name localStorage:',
  //     localStorage.getItem('district_name'));

  //   this.loadEditableForm4();
  // }


  ngOnInit(): void {

    this.department_id = Number(localStorage.getItem('department_id')) || 0;
    this.district_id = Number(localStorage.getItem('district_id')) || 0;
    this.zone_id = Number(localStorage.getItem('zone_id')) || 0;

    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';

    console.log('Stored IDs:', {
      department_id: this.department_id,
      district_id: this.district_id,
      zone_id: this.zone_id
    });

    this.loadEditableForm4();
  }
  /* ================= LOAD F3 ================= */
  loadF3() {

    this.userService.getForm4().subscribe(res => {

      if (!res?.success) return;

      const rows = res?.data?.selectedSocList || [];
      const map = new Map<number, any>();

      rows.forEach((s: any) => {

        if (!map.has(s.society_id)) {

          const sc = Number(s.sc_st) || 0;
          const women = Number(s.women) || 0;
          const general = Number(s.general) || 0;

          map.set(s.society_id, {

            society_id: s.society_id,
            society_name: s.society_name,
            rural_id: s.rural_id,

            sc_st: sc,
            women: women,
            general: general,
            total: s.tot_voters,

            selected: s.selected || false,

            declared_sc_st: Number(s.declared_sc_st) || 0,
            declared_women: Number(s.declared_women) || 0,
            declared_general: Number(s.declared_general) || 0,

            remarks: s.remarks || null,

            // '' (not null) so it matches the dropdown's placeholder
            // <option value=""> — otherwise Angular can't match a null
            // model value to any option and renders the select blank.
            reason: s.reason || '',
            otherReasonText: s.other_reason_text || null
          });

        }

      });

      this.societyList = Array.from(map.values());

      this.updateLists();

    });

  }
  /* ============== FETCH CHECKBOX PREVIEW ============== */





  loadEditableForm4() {


    this.userService.getEditableForm4().subscribe({

      next: (res: any) => {

        console.log('Editable Form4 Response:', res);

        const d = res.data;

        this.isEditMode = true;
        this.editableForm4Id = d.form4_id;

        this.district_name = d.district_name;
        this.zone_name = d.zone_name;

        this.societyList = d.form2_selected_list.map((s: any) => ({

          society_id: s.society_id,
          society_name: s.society_name,
          rural_id: s.rural_id,

          sc_st: s.sc_st,
          women: s.women,
          general: s.general,
          total: s.tot_voters,

          selected: s.selected,

          declared_sc_st: s.declared_sc_st,
          declared_women: s.declared_women,
          declared_general: s.declared_general,

          remarks: s.remarks || '',

          reason: s.reason || '',
          otherReasonText: s.other_reason_text || null
        }));

        this.updateLists();
      },

      error: (err: any) => {
        // Locked (next form already submitted) → show it on the page
        this.lockedMessage = lockedMessageFrom(err);

        console.log('No editable Form4 found');

        this.isEditMode = false;

        this.loadF3();
      }
    });
  }



  loadCheckboxStatus() {
    this.userService.getForm4Checkbox(this.form4_id).subscribe(res => {
      if (!res?.success) return;


      const filed = res.data?.filed || [];
      const selectedSet = new Set<number>();

      filed.forEach((s: any) => {
        if (s.selected === true) {
          selectedSet.add(s.society_id);
        }
      });



      this.societyList.forEach(s => {
        s.selected = selectedSet.has(s.society_id);
      });

      this.updateLists();
    });
  }

  /* ============== CHECKBOX CHANGE ============== */
  onSelectChange() {
    this.updateLists();
    this.saveCheckboxPreview();
  }

  /* ============== SAVE CHECKBOX PREVIEW ============== */
  saveCheckboxPreview() {

    const selectedIds = this.societyList
      .filter(s => s.selected)
      .map(s => s.society_id);

    if (selectedIds.length === 0) return;

    this.userService.saveForm4Checkbox({ selected_ids: selectedIds }).subscribe({
      next: () => console.log('Checkbox preview saved'),
      error: err => console.error('Checkbox preview error', err)
    });
  }

  /* ============== BUILD F4 / F5 ============== */
  updateLists() {

    // Keep the SAME object references as societyList (not copies) — the
    // declared-count inputs in the template bind directly to these list
    // items, so a copy here would silently lose every edit on submit.
    this.selectedSocietyList = this.societyList.filter(s => s.selected);
    this.unselectedSocietyList = this.societyList.filter(s => !s.selected);

    // No seats in a category → no contest there, so its count is always 0
    this.societyList.forEach(s =>
      this.categories.forEach(c => { if (this.noSeats(s, c)) s[c.declared] = 0; }));
  }

  /** True when the society has 0 seats for this category in F3 */
  noSeats(soc: any, c: { seats: string }): boolean {
    return Number(soc[c.seats]) === 0;
  }

  /* ============== FINAL SUBMIT ============== */
  submit() {

    if (!this.selectedSocietyList.length) {
      this.dialog.show('Please select at least one society');
      return;
    }

    // Every not-filed society needs its reason — the stoppage reports
    // (படிவம் 12 / 13) place it in a column by this reason.
    const noReason = this.unselectedSocietyList.find(s =>
      !s.reason || (s.reason === 'other' && !(s.otherReasonText || '').trim()));
    if (noReason) {
      this.dialog.show(`வேட்புமனு தாக்கல் செய்யாத சங்கத்திற்கு காரணத்தை தேர்வு செய்யவும்: ${noReason.society_name}`);
      return;
    }

    // Backend expects ONE list covering every society (filed and not-filed
    // alike), each flagged with `selected` — it splits them server-side.
    // Reason/other_reason_text only apply to the not-filed (selected:false) ones.
    const form2_selected_list = this.societyList.map(s => ({
      society_id: s.society_id,
      society_name: s.society_name,
      rural_id: s.rural_id,
      selected: s.selected,

      declared_sc_st: s.declared_sc_st,
      declared_women: s.declared_women,
      declared_general: s.declared_general,

      remarks: s.remarks,
      reason: s.selected ? null : (s.reason || null),
      other_reason_text: (!s.selected && s.reason === 'other') ? (s.otherReasonText || '') : null
    }));

    const payload = {
      department_id: this.department_id,
      district_id: this.district_id,
      district_name: this.district_name,
      zone_id: this.zone_id,
      zone_name: this.zone_name,

      form2_selected_list
    };
    console.log('Submit Payload:', payload);
    /* ===== EDIT MODE ===== */
    if (this.isEditMode) {

      // The edit API updates THIS Form4 — it needs its id
      this.userService.editForm4({ ...payload, form4_id: this.editableForm4Id }).subscribe((res: any) => {

        if (res.success) {

          localStorage.setItem('form4_id', String(this.editableForm4Id));
          localStorage.setItem('form4_completed', 'true');

          this.dialog.show('✔ Form4 Updated Successfully');
          this.router.navigate(['/layout/totalforms']);
        }
      });

    }

    /* ===== ADD MODE ===== */
    else {

      this.userService.submitForm4(payload).subscribe((res: any) => {

        if (res.success) {

          localStorage.setItem('form4_id', res.data.form4_id);
          localStorage.setItem('form4_completed', 'true');

          this.dialog.show('✔ Form4 Submitted Successfully');
          this.router.navigate(['/layout/totalforms']);
        }
      });
    }
  }
  cancel() {
    window.history.back();
  }
}
