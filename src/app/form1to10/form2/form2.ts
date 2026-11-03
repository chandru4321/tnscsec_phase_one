import { inject, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { Router } from '@angular/router';
import { lockedMessageFrom } from '../../shared/form-lock';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-form2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form2.html',
  styleUrls: ['./form2.css']
})
export class Form2 implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Set when the edit API says this form is locked (shown as a banner)
  lockedMessage = '';

  district_name = '';
  zone_name = '';

  form1_id!: number;
  isEditMode = false;
  form2Id: number | null = null;

  /* F3 */
  f3List = '';

  /* Checkbox master list */
  finalCheckboxList: {
    society_id: number;
    society_name: string;
    checked: boolean;
    voter_list_prepared_count: number | null;
  }[] = [];

  /* UI preview */
  f5_selectedList: any[] = [];
  f6_unselectedList: any[] = [];

  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  /* ================= INIT ================= */
  // ngOnInit(): void {

  //   const storedForm1Id = localStorage.getItem('form1_id');
  //   this.form1_id = storedForm1Id ? Number(storedForm1Id) : 0;

  //   this.district_name = localStorage.getItem('district_name') || '';
  //   this.zone_name = localStorage.getItem('zone_name') || '';

  //   if (this.form1_id) {
  //     this.loadForm1Selected();
  //   }
  // }




  // ngOnInit(): void {
  //   console.log('form2Completed = ', localStorage.getItem('form2_completed'));

  //   this.district_name = localStorage.getItem('district_name') || '';
  //   this.zone_name = localStorage.getItem('zone_name') || '';

  //   const form2Completed = localStorage.getItem('form2_completed');

  //   if (form2Completed === 'true') {

  //     this.loadEditableForm2();

  //   } else {

  //     const storedForm1Id = localStorage.getItem('form1_id');
  //     this.form1_id = storedForm1Id ? Number(storedForm1Id) : 0;

  //     if (this.form1_id) {
  //       this.loadForm1Selected();
  //     }
  //   }
  // }

  ngOnInit(): void {

    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';

    console.log('Calling Editable Form2 API');

    this.loadEditableForm2();
  }


  loadEditableForm2(): void {

    console.log('loadEditableForm2 called');

    this.userService.getEditableForm2().subscribe({

      next: (res) => {

        const d = res.data;

        // ✅ EDIT MODE
        this.isEditMode = true;
        this.form2Id = d.id;

        this.finalCheckboxList = [];

        // Selected societies
        d.selected_soc.forEach((s: any) => {

          this.finalCheckboxList.push({
            society_id: s.society_id,
            society_name: s.society_name,
            checked: true,
            voter_list_prepared_count: s.voter_list_prepared_count ?? null
          });

        });

        // Non-selected societies
        d.non_selected_soc.forEach((s: any) => {

          this.finalCheckboxList.push({
            society_id: s.society_id,
            society_name: s.society_name,
            checked: false,
            voter_list_prepared_count: s.voter_list_prepared_count ?? null
          });

        });

        this.updateF5F6();
      },

      error: (err: any) => {
        // Locked (next form already submitted) → show it on the page
        this.lockedMessage = lockedMessageFrom(err);

        this.isEditMode = false;

        const storedForm1Id = localStorage.getItem('form1_id');
        this.form1_id = storedForm1Id ? Number(storedForm1Id) : 0;

        if (this.form1_id) {
          this.loadForm1Selected();
        }
      }
    });
  }
  /* ================= API-1 : LOAD F3 ================= */
  loadForm1Selected(): void {
    this.userService.getForm1Selected(this.form1_id).subscribe(res => {

      if (!res?.success) return;

      const list = res.data.selected_soc;

      // F3 textarea
      this.f3List = list.map((x: any) => x.society_name).join('\n');

      // Build checkbox list
      this.finalCheckboxList = list.map((x: any) => ({
        society_id: x.society_id,
        society_name: x.society_name,
        checked: false,
        voter_list_prepared_count: null
      }));

      this.updateF5F6();
    });
  }

  /* ================= UI LOGIC ================= */
  updateF5F6(): void {
    this.f5_selectedList = this.finalCheckboxList.filter(x => x.checked);
    this.f6_unselectedList = this.finalCheckboxList.filter(x => !x.checked);
  }


  cancel() {
    this.router.navigate(['/layout/totalforms']);
  }

  /* ================= SUBMIT (🔥 FIXED) ================= */
  //   submitForm2(): void {

  //     // 🔥 BACKEND EXPECTS IDs ONLY
  //     const selectedIds = this.finalCheckboxList
  //       .filter(x => x.checked)
  //       .map(x => x.society_id);

  //     // Validation
  //     if (selectedIds.length === 0) {
  //       alert('⚠️ குறைந்தது ஒரு சங்கத்தை தேர்வு செய்ய வேண்டும்');
  //       return;
  //     }

  //     const payload = {
  //       selectedIds,                    // ✅ THIS IS THE FIX
  //       remark: 'Form2 submission test'
  //     };

  //     console.log('🚀 FINAL PAYLOAD SENT TO BACKEND:', payload);


  //     this.userService.submitForm2(payload).subscribe(res => {

  //       if (res?.success) {

  //         // Save form2 id for future use
  //         localStorage.setItem('form2_id', res.data.id);
  //         localStorage.setItem('form2_completed', 'true');

  //         alert('✔ Form-2 Saved Successfully');
  //         this.router.navigate(['/layout/totalforms']);
  //       }
  //     });
  //   }
  // }



  submitForm2(): void {

    const selectedIds = this.finalCheckboxList
      .filter(x => x.checked)
      .map(x => x.society_id);

    if (selectedIds.length === 0) {
      this.dialog.show('⚠️ குறைந்தது ஒரு சங்கத்தை தேர்வு செய்ய வேண்டும்');
      return;
    }

    const societyCounts = this.finalCheckboxList.map(x => ({
      society_id: x.society_id,
      voter_list_prepared_count: x.voter_list_prepared_count
    }));

    const payload = {
      selectedIds,
      societyCounts,
      remark: 'Updated after verification'
    };

    /* ===== EDIT MODE ===== */
    if (this.isEditMode) {

      // this.userService.editForm2(this.form2Id!, payload).subscribe((res: any) => {
      // this.userService.editForm2(payload).subscribe((res: any) => {
      this.userService.editForm2(this.form2Id!, payload).subscribe((res: any) => {
        if (res.success) {

          localStorage.setItem('form2_id', this.form2Id!.toString());
          localStorage.setItem('form2_completed', 'true');

          this.dialog.show('✔ Form-2 Updated Successfully');
          this.router.navigate(['/layout/totalforms']);
        }
      });

    }

    /* ===== ADD MODE ===== */
    else {

      this.userService.submitForm2(payload).subscribe((res: any) => {

        if (res.success) {

          localStorage.setItem('form2_id', res.data.id);
          localStorage.setItem('form2_completed', 'true');

          this.dialog.show('✔ Form-2 Saved Successfully');
          this.router.navigate(['/layout/totalforms']);
        }
      });
    }
  }
}