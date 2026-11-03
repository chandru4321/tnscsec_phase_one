import { inject, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileCardsDirective } from '../../shared/mobile-cards.directive';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { lockedMessageFrom } from '../../shared/form-lock';
import { DialogService } from '../../shared/dialog/dialog.service';

type CategoryType = 'sc_st' | 'women' | 'general';

interface Member {
  form4_filed_soc_id: number;
  category_type: CategoryType;
  member_name: string;
  aadhar_no: string;
}

@Component({
  selector: 'app-form5',
  standalone: true,
  imports: [CommonModule, FormsModule, MobileCardsDirective],
  templateUrl: './form5.html',
  styleUrls: ['./form5.css']
})
export class Form5Component implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Set when the edit API says this form is locked (shown as a banner)
  lockedMessage = '';

  form5List: any[] = [];

  district_name = '';
  zone_name = '';
  isEditMode = false;
  editableMembers: any[] = [];

  showModal = false;
  selectedSociety: any = null;

  members: Member[] = [];

  constructor(private userService: UserService) { }

  // ngOnInit(): void {
  //   this.district_name = localStorage.getItem('district_name') || '';
  //   this.zone_name = localStorage.getItem('zone_name') || '';
  //   this.loadForm5();
  // }
  ngOnInit(): void {

    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';

    this.loadEditableForm5();
  }

  loadEditableForm5() {

    this.userService.getEditableForm5().subscribe({

      next: (res: any) => {

        const d = res.data;

        if (d?.editable) {
          this.isEditMode = true;
          this.editableMembers = d.members || [];
        } else {
          this.editableMembers = [];
        }

        // Load society list normally
        this.loadForm5();
      },

      error: (err: any) => {
        // Locked (next form already submitted) → show it on the page
        this.lockedMessage = lockedMessageFrom(err);

        this.isEditMode = false;

        this.loadForm5();
      }
    });
  }
  /* ===============================
     LOAD FORM 5 ELIGIBLE (DEDUPED)
     =============================== */
  loadForm5() {
    this.userService.getForm5Eligible().subscribe(res => {
      if (!res?.success) return;

      const map = new Map<number, any>();

      res.data.forEach((item: any) => {
        // ✅ DEDUPE BY SOCIETY ID (NOT filed_soc_id)
        if (!map.has(item.society_id)) {
          map.set(item.society_id, {
            society_id: item.society_id,
            society_name: item.society_name,

            // ✅ COUNTS FOR TABLE
            sc_st: item.declared?.sc_st ?? 0,
            women: item.declared?.women ?? 0,
            general: item.declared?.general ?? 0,

            // keep one filed_soc_id (latest is fine)
            filed_soc_id: item.filed_soc_id,

            declared: item.declared,

            // Already has saved members → the button edits them
            hasMembers: this.editableMembers.some(
              (m: any) => m.form4_filed_soc_id === item.filed_soc_id)
          });
        }
      });

      this.form5List = Array.from(map.values());
    });
  }

  /* ===============================
     GETTERS FOR HTML
     =============================== */
  get scstMembers() {
    return this.members.filter(m => m.category_type === 'sc_st');
  }

  get womenMembers() {
    return this.members.filter(m => m.category_type === 'women');
  }

  get generalMembers() {
    return this.members.filter(m => m.category_type === 'general');
  }

  /* ===============================
     HTML ALIASES
     =============================== */
  addSociety(row: any) {
    this.openModal(row);
  }

  submitModal() {
    this.submitForm5();
  }

  /* ===============================
     OPEN MODAL
     =============================== */
  openModal(row: any) {

    this.selectedSociety = row;
    this.members = [];

    const existingMembers = this.editableMembers.filter(
      x => x.form4_filed_soc_id === row.filed_soc_id
    );

    if (existingMembers.length > 0) {

      // EDIT MODE
      this.isEditMode = true;

      this.members = existingMembers.map((m: any) => ({
        id: m.id,
        form4_filed_soc_id: m.form4_filed_soc_id,
        category_type: m.category_type,
        member_name: m.member_name,
        aadhar_no: m.aadhar_no
      }));

    } else {

      // ADD MODE
      this.isEditMode = false;

      this.createMembers('sc_st', row.sc_st);
      this.createMembers('women', row.women);
      this.createMembers('general', row.general);
    }

    this.showModal = true;
  }
  private createMembers(type: CategoryType, count: number) {
    for (let i = 0; i < count; i++) {
      this.members.push({
        form4_filed_soc_id: this.selectedSociety.filed_soc_id,
        category_type: type,
        member_name: '',
        aadhar_no: ''
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedSociety = null;
    this.members = [];
  }


  formatAadhar(event: any, member: any) {
    // Remove all non-numbers
    let value = event.target.value.replace(/\D/g, '');

    // Limit to 12 digits
    value = value.substring(0, 12);

    // Add hyphen after every 4 digits
    let formatted = value
      .replace(/(\d{4})(?=\d)/g, '$1-');

    member.aadhar_no = formatted;
  }

  /* ===============================
     SUBMIT FORM 5
     =============================== */
  submitForm5() {

    if (!this.selectedSociety) return;

    const namePattern = /^[a-zA-Z\u0B80-\u0BFF ]+$/;
    const aadharPattern = /^([0-9]{12}|[0-9]{4}-[0-9]{4}-[0-9]{4})$/;

    const invalidMember = this.members.some(m =>
      !m.member_name ||
      !namePattern.test(m.member_name) ||
      !m.aadhar_no ||
      !aadharPattern.test(m.aadhar_no)
    );

    if (invalidMember) {
      this.dialog.show('சரியான பெயர் மற்றும் 12 இலக்க ஆதார் எண் உள்ளிடவும்');
      return;
    }

    const payload = {
      members: this.members
    };

    /* ===== EDIT MODE ===== */
    if (this.isEditMode) {

      const payload = {
        // the edit API checks the members belong to THIS society
        form4_filed_soc_id: this.selectedSociety.filed_soc_id,
        updates: this.members.map((m: any) => ({
          form5_id: m.id,
          member_name: m.member_name,
          aadhar_no: m.aadhar_no
        }))
      };

      this.userService.editForm5(payload).subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.dialog.show('✔ Form5 Updated Successfully');
            this.closeModal();
            // Re-fetch so reopening shows the updated names / Aadhaar
            this.loadEditableForm5();
          } else {
            this.dialog.show('✘ ' + (res?.message || 'Form5 Update Failed'));
          }
        },
        error: (err: any) => {
          this.dialog.show('✘ ' + (err?.error?.message || err?.message || 'Form5 Update Failed'));
        }
      });

    } else {

      const payload = {
        members: this.members
      };

      this.userService.submitForm5(payload).subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.dialog.show('✔ Form5 Submitted Successfully');
            this.closeModal();
            // Re-fetch so this society now opens in edit mode
            this.loadEditableForm5();
          } else {
            this.dialog.show('✘ ' + (res?.message || 'Form5 Submission Failed'));
          }
        },
        error: (err: any) => {
          this.dialog.show('✘ ' + (err?.error?.message || err?.message || 'Form5 Submission Failed'));
        }
      });
    }
  }
  cancel() {
    window.history.back();
  }

  exportExcel() {
    this.dialog.show('Excel export logic here');
  }
}

