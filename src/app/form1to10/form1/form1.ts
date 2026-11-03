// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { UserService } from '../../services/user';
// import { Router, ActivatedRoute } from "@angular/router";

// @Component({
//   selector: 'app-form1',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './form1.html',
//   styleUrls: ['./form1.css']
// })
// export class Form1 implements OnInit {

//   department_name = '';
//   district_name = '';
//   zone_name = '';

//   isSubmitting = false;

//   masterZonesText = '';
//   plannedSocietiesCount: number | null = null;

//   masterZones12: { id: number; name: string; selected: boolean }[] = [];
//   ruralDetails: { name: string; sc: number; women: number; general: number; total: number }[] = [];

//   unselectedList: string[] = [];
//   noteText = '';

//   isEditMode = false;
//   form1Id: number | null = null;

//   // 🔒 Prevent multiple checkbox API calls
//   isLoadingDetails = false;

//   constructor(
//     private userService: UserService,
//     private router: Router,
//     private route: ActivatedRoute
//   ) { }

//   /* ================= INIT ================= */

//   // ngOnInit() {


//   //   this.department_name = localStorage.getItem('department_name') || '';
//   //   this.district_name = localStorage.getItem('district_name') || '';
//   //   this.zone_name = localStorage.getItem('zone_names') || '';

//   //   this.route.queryParams.subscribe(p => {
//   //     console.log('Query Params', p);

//   //     if (p['id']) {
//   //       this.form1Id = Number(p['id']);
//   //       this.isEditMode = true;
//   //       // this.loadEditForm(this.form1Id);
//   //       this.loadEditableForm();
//   //     } else {
//   //       this.loadMasterZones();
//   //       this.loadMasterZonesCheckbox();
//   //     }
//   //   });
//   // }

//   ngOnInit() {
//     console.log('district_name=', localStorage.getItem('district_name'));
//     console.log('zone_name=', localStorage.getItem('zone_name'));
//     this.department_name = localStorage.getItem('department_name') || '';
//     this.district_name = localStorage.getItem('district_name') || '';
//     this.zone_name = localStorage.getItem('zone_name') || '';

//     this.route.queryParams.subscribe(params => {

//       // Edit from table
//       if (params['id']) {

//         this.form1Id = +params['id'];
//         this.isEditMode = true;

//         this.loadEditableForm();
//       }
//       else {

//         // Fresh user or existing user
//         const form1Completed = localStorage.getItem('form1_completed');

//         if (form1Completed === 'true') {

//           this.loadEditableForm();

//         } else {

//           this.loadMasterZones();
//           this.loadMasterZonesCheckbox();

//         }
//       }
//     });
//   }

//   /* ================= ADD MODE ================= */

//   loadMasterZones() {
//     this.userService.getMasterZones().subscribe(res => {
//       if (res.success) {
//         this.masterZonesText = res.data.map((x: any) => x.association_name).join('\n\n');
//         this.plannedSocietiesCount = res.data.length;
//       }
//     });
//   }



//   get selectedCount(): number {
//     return this.masterZones12.filter(x => x.selected).length;
//   }


//   loadEditableForm() {

//     this.userService.getEditableForm1().subscribe({

//       next: (res) => {

//         const d = res.data;

//         this.noteText = d.remark || '';

//         const selectedNames = d.selected_soc.map(
//           (x: any) => x.society_name.trim()
//         );

//         this.userService.getMasterZones().subscribe(master => {

//           this.masterZones12 = master.data.map((z: any) => ({
//             id: z.id,
//             name: z.association_name,
//             selected: selectedNames.includes(
//               z.association_name.trim()
//             )
//           }));

//           this.plannedSocietiesCount = master.data.length;

//           this.ruralDetails = d.selected_soc.map((s: any) => ({
//             name: s.society_name,
//             sc: s.sc_st,
//             women: s.women,
//             general: s.general,
//             total: s.tot_voters
//           }));

//           this.unselectedList = d.non_selected_soc.map(
//             (x: any) => x.society_name
//           );
//         });
//       },

//       error: () => {

//         // New user -> load empty form
//         this.loadMasterZones();
//         this.loadMasterZonesCheckbox();
//       }
//     });
//   }

//   loadMasterZonesCheckbox() {
//     this.userService.getMasterZones().subscribe(res => {
//       if (res.success) {
//         this.masterZones12 = res.data.map((z: any) => ({
//           id: z.id,
//           name: z.association_name,
//           selected: false
//         }));
//       }
//     });
//   }

//   /* ================= EDIT MODE ================= */


//   /* ================= CHECKBOX ================= */

//   onCheckboxChange() {

//     // 🔒 Stop if already loading (prevents double click issue)
//     if (this.isLoadingDetails) return;

//     const selectedIDs = this.masterZones12
//       .filter(x => x.selected)
//       .map(x => x.id);

//     this.unselectedList = this.masterZones12
//       .filter(z => !z.selected)
//       .map(z => z.name);

//     if (selectedIDs.length === 0) {
//       this.ruralDetails = [];
//       return;
//     }

//     this.isLoadingDetails = true;

//     const body = { associationIds: selectedIDs };

//     this.userService.PostCheckpointZones(body).subscribe(res => {

//       // Clear before reloading (avoids accumulation)
//       this.ruralDetails = [];

//       if (res.success) {

//         const filtered = res.data.non_selected_soc
//           .filter((x: any) => selectedIDs.includes(x.id));

//         filtered.forEach((soc: any) => {
//           this.loadRuralDetail(soc.id, soc.association_name);
//         });
//       }

//       this.isLoadingDetails = false;
//     }, () => {
//       this.isLoadingDetails = false;
//     });
//   }

//   /* ================= LOAD DETAILS ================= */

//   loadRuralDetail(id: number, name: string) {

//     // 🔒 Prevent duplicate before API
//     if (this.ruralDetails.some(r => r.name === name)) {
//       return;
//     }

//     const body = { associationIds: [id] };

//     this.userService.getRuralSocietyDetails(body).subscribe(r => {
//       if (r.success && r.data.length > 0) {
//         const d = r.data[0];

//         // 🔒 Double protection (API race condition)
//         if (!this.ruralDetails.some(x => x.name === name)) {
//           this.ruralDetails.push({
//             name,
//             sc: d.sc_st,
//             women: d.women,
//             general: d.general,
//             total: d.sc_st + d.women + d.general
//           });
//         }
//       }
//     });
//   }




//   cancel() {
//     this.router.navigate(['/layout/totalforms']);
//   }


//   /* ================= SUBMIT ================= */

//   submitForm() {

//     const payload = {
//       remark: this.noteText,

//       selected_soc: this.masterZones12
//         .filter(x => x.selected)
//         .map(z => ({
//           id: z.id,
//           association_name: z.name
//         })),

//       non_selected_soc: this.masterZones12
//         .filter(x => !x.selected)
//         .map(z => ({
//           id: z.id,
//           association_name: z.name
//         })),

//       rural_details: this.masterZones12
//         .filter(x => x.selected)
//         .map(z => {
//           const r = this.ruralDetails.find(t => t.name === z.name);
//           return {
//             rurel_id: z.id,
//             sc_st: r?.sc ?? 0,
//             women: r?.women ?? 0,
//             general: r?.general ?? 0,
//             tot_voters: (r?.sc ?? 0) + (r?.women ?? 0) + (r?.general ?? 0)
//           };
//         })
//     };

//     /* ===== EDIT MODE ===== */
//     //     if (this.isEditMode) {

//     //       this.userService.editForm1(this.form1Id!, payload).subscribe(() => {

//     //         localStorage.setItem('form1_id', this.form1Id!.toString());
//     //         localStorage.setItem('form1_completed', 'true');

//     //         alert("✔ Form Updated Successfully");
//     //         this.router.navigate(['/layout/form2']);
//     //       });

//     //     }
//     //     /* ===== ADD MODE ===== */
//     //     else {

//     //       this.userService.submitForm1(payload).subscribe((res: any) => {

//     //         if (res.success) {

//     //           localStorage.setItem('form1_id', res.data.id);
//     //           localStorage.setItem('form1_completed', 'true');

//     //           localStorage.setItem('district_name', this.district_name);
//     //           localStorage.setItem('zone_name', this.zone_name);

//     //           alert("✔ Form Submitted Successfully");
//     //           this.router.navigate(['/layout/totalforms']);
//     //         }
//     //       });
//     //     }
//     //   }
//     // }

//     /* ===== EDIT MODE ===== */
//     if (this.isEditMode) {

//       this.userService.editForm1(this.form1Id!, payload).subscribe(() => {

//         localStorage.setItem('form1_id', this.form1Id!.toString());
//         localStorage.setItem('form1_completed', 'true');

//         alert("✔ Form Updated Successfully");
//         this.router.navigate(['/layout/form2']);
//       });

//     }
//     /* ===== ADD MODE ===== */
//     else {

//       this.userService.submitForm1(payload).subscribe((res: any) => {

//         if (res.success) {

//           localStorage.setItem('form1_id', res.data.id);
//           localStorage.setItem('form1_completed', 'true');

//           localStorage.setItem('district_name', this.district_name);
//           localStorage.setItem('zone_name', this.zone_name);

//           alert("✔ Form Submitted Successfully");
//           this.router.navigate(['/layout/totalforms']);
//         }
//       });
//     }
//   }
// }

import { CommonModule } from '@angular/common';
import { inject, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { Router, ActivatedRoute } from '@angular/router';
import { lockedMessageFrom } from '../../shared/form-lock';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-form1',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form1.html',
  styleUrls: ['./form1.css']
})
export class Form1 implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Set when the edit API says this form is locked (shown as a banner)
  lockedMessage = '';

  // ================= BASIC DETAILS =================

  department_name = '';
  district_name = '';
  zone_name = '';

  // ================= FORM STATUS =================

  isSubmitting = false;
  isEditMode = false;

  // Form1 database ID
  form1Id: number | null = null;

  // Prevent multiple checkbox API calls
  isLoadingDetails = false;

  // ================= MASTER DATA =================

  masterZonesText = '';

  plannedSocietiesCount: number | null = null;

  masterZones12: {
    id: number;
    name: string;
    selected: boolean;
  }[] = [];

  // ================= RURAL DETAILS =================

  ruralDetails: {
    id?: number;     // society id — counts are matched to societies by this
    name: string;
    sc: number;
    women: number;
    general: number;
    total: number;
  }[] = [];

  // ================= OTHER DATA =================

  // Societies the DEO did NOT issue an election notice for — each
  // one needs a reason picked from reasonOptions; "other" additionally
  // needs free-text (capped at 555 characters, enforced by [maxlength]
  // in the template).
  unselectedList: {
    name: string;
    reason: string;
    otherReasonText: string;
  }[] = [];

  readonly reasonOptions = [
    { value: 'address_unknown', label: 'முகவரி தெரியவில்லை' },
    { value: 'defunct_societies', label: 'செயலிழந்த சங்கங்கள்' },
    { value: 'dissolution_notice_issued', label: 'கலைத்தல் அறிவிப்பு வழங்கப்பட்டவை' },
    { value: 'other', label: 'இதர காரணம்' }
  ];

  noteText = '';

  // ================= CONSTRUCTOR =================

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    console.log('================ FORM1 INIT ================');

    this.department_name =
      localStorage.getItem('department_name') || '';

    this.district_name =
      localStorage.getItem('district_name') || '';

    this.zone_name =
      localStorage.getItem('zone_name') || '';

    console.log(
      'Department:',
      this.department_name
    );

    console.log(
      'District:',
      this.district_name
    );

    console.log(
      'Zone:',
      this.zone_name
    );

    // ============================================================
    // CHECK URL QUERY PARAMETER
    // ============================================================

    this.route.queryParams.subscribe(params => {

      console.log('Query Params:', params);

      // ==========================================================
      // CASE 1: EDIT FROM TABLE
      // Example:
      // /form1?id=5
      // ==========================================================

      if (params['id']) {

        this.form1Id = Number(params['id']);

        this.isEditMode = true;

        console.log(
          'EDIT MODE - URL Form1 ID:',
          this.form1Id
        );

        if (this.form1Id) {
          this.loadEditableForm(this.form1Id);
        }

      }

      // ==========================================================
      // CASE 2: NORMAL FORM1 PAGE
      // ==========================================================

      else {

        const form1Completed =
          localStorage.getItem('form1_completed');

        const storedForm1Id =
          localStorage.getItem('form1_id');

        console.log(
          'form1_completed:',
          form1Completed
        );

        console.log(
          'form1_id:',
          storedForm1Id
        );

        // ========================================================
        // EXISTING FORM1
        // ========================================================

        if (
          form1Completed === 'true' &&
          storedForm1Id
        ) {

          this.form1Id = Number(storedForm1Id);

          this.isEditMode = true;

          console.log(
            'EDIT MODE - LocalStorage Form1 ID:',
            this.form1Id
          );

          if (this.form1Id) {
            this.loadEditableForm(this.form1Id);
          }

        }

        // ========================================================
        // NEW FORM1
        // ========================================================

        else {

          this.isEditMode = false;

          this.form1Id = null;

          console.log(
            'NEW FORM1 MODE'
          );

          this.loadMasterZones();

          this.loadMasterZonesCheckbox();
        }
      }

    });
  }

  // ============================================================
  // LOAD MASTER ZONES
  // ============================================================

  loadMasterZones(): void {

    console.log(
      'Loading Master Zones...'
    );

    this.userService.getMasterZones().subscribe({

      next: (res: any) => {

        console.log(
          'Master Zones Response:',
          res
        );

        if (res.success) {

          this.masterZonesText =
            res.data
              .map((x: any) => x.association_name)
              .join('\n\n');

          this.plannedSocietiesCount =
            res.data.length;
        }

      },

      error: (err) => {

        console.error(
          'Master Zones Error:',
          err
        );

      }

    });
  }

  // ============================================================
  // LOAD MASTER ZONES FOR CHECKBOX
  // ============================================================

  loadMasterZonesCheckbox(): void {

    console.log(
      'Loading Master Zones Checkbox...'
    );

    this.userService.getMasterZones().subscribe({

      next: (res: any) => {

        console.log(
          'Master Zones Checkbox Response:',
          res
        );

        if (res.success) {

          this.masterZones12 =
            res.data.map((z: any) => ({

              id: z.id,

              name: z.association_name,

              selected: false

            }));

        }

      },

      error: (err) => {

        console.error(
          'Master Zones Checkbox Error:',
          err
        );

      }

    });
  }

  // ============================================================
  // SELECTED COUNT
  // ============================================================

  get selectedCount(): number {

    return this.masterZones12
      .filter(x => x.selected)
      .length;

  }

  // ============================================================
  // LOAD EDITABLE FORM1
  // ============================================================

  loadEditableForm(form1Id: number): void {

    console.log(
      '======================================'
    );

    console.log(
      'Loading Editable Form1'
    );

    console.log(
      'Form1 ID:',
      form1Id
    );

    console.log(
      '======================================'
    );

    // ==========================================================
    // IMPORTANT
    // Send Form1 ID to backend
    // ==========================================================

    this.userService
      .getEditableForm1(form1Id)
      .subscribe({

        // ======================================================
        // SUCCESS
        // ======================================================

        next: (res: any) => {

          console.log(
            'Editable Form1 Response:',
            res
          );

          if (!res || !res.success) {

            console.error(
              'Editable Form1 API returned unsuccessful response'
            );

            return;
          }

          const d = res.data;

          if (!d) {

            console.error(
              'Editable Form1 data is empty'
            );

            return;
          }

          // ====================================================
          // REMARK
          // ====================================================

          this.noteText =
            d.remark || '';

          // ====================================================
          // SELECTED SOCIETY NAMES
          // ====================================================

          const selectedNames =
            (d.selected_soc || [])
              .map(
                (x: any) =>
                  x.society_name?.trim()
              )
              .filter(
                (x: any) => x
              );

          console.log(
            'Selected Society Names:',
            selectedNames
          );

          // ====================================================
          // LOAD MASTER ZONES
          // ====================================================

          this.userService
            .getMasterZones()
            .subscribe({

              next: (master: any) => {

                console.log(
                  'Master Zones for Edit:',
                  master
                );

                if (!master.success) {
                  return;
                }

                // ==============================================
                // CHECKBOX LIST
                // ==============================================

                this.masterZones12 =
                  master.data.map((z: any) => ({

                    id: z.id,

                    name: z.association_name,

                    selected:
                      selectedNames.includes(
                        z.association_name.trim()
                      )

                  }));

                // ==============================================
                // PLANNED COUNT
                // ==============================================

                this.plannedSocietiesCount =
                  master.data.length;

                // ==============================================
                // RURAL DETAILS
                // ==============================================

                this.ruralDetails =
                  (d.selected_soc || [])
                    .map((s: any) => ({

                      id:
                        Number(s.society_id),

                      name:
                        s.society_name,

                      sc:
                        Number(s.sc_st || 0),

                      women:
                        Number(s.women || 0),

                      general:
                        Number(s.general || 0),

                      total:
                        Number(
                          s.tot_voters ||
                          (
                            Number(s.sc_st || 0) +
                            Number(s.women || 0) +
                            Number(s.general || 0)
                          )
                        )

                    }));

                // ==============================================
                // UNSELECTED SOCIETIES
                // ==============================================

                this.unselectedList =
                  (d.non_selected_soc || [])
                    .map(
                      (x: any) => ({
                        name: x.society_name,
                        reason: x.reason || '',
                        otherReasonText: x.other_reason_text || ''
                      })
                    );

                console.log(
                  'Master Zones:',
                  this.masterZones12
                );

                console.log(
                  'Rural Details:',
                  this.ruralDetails
                );

                console.log(
                  'Unselected List:',
                  this.unselectedList
                );

              },

              error: (err: any) => {

                console.error(
                  'Master Zones Edit Error:',
                  err
                );

              }

            });

        },

        // ======================================================
        // ERROR
        // ======================================================

        error: (err: any) => {

          // Locked (next form already submitted) → show it on the page
          this.lockedMessage = lockedMessageFrom(err);

          console.error(
            'Editable Form1 API Error:',
            err
          );

          // If editable record is not found,
          // load fresh Form1

          this.isEditMode = false;

          this.loadMasterZones();

          this.loadMasterZonesCheckbox();

        }

      });
  }

  // ============================================================
  // CHECKBOX CHANGE
  // ============================================================

  onCheckboxChange(): void {

    // ==========================================================
    // Prevent duplicate API calls
    // ==========================================================

    if (this.isLoadingDetails) {
      return;
    }

    // ==========================================================
    // GET SELECTED IDS
    // ==========================================================

    const selectedIDs =
      this.masterZones12
        .filter(x => x.selected)
        .map(x => x.id);

    console.log(
      'Selected IDs:',
      selectedIDs
    );

    // ==========================================================
    // UNSELECTED LIST
    // ==========================================================

    this.unselectedList =
      this.masterZones12
        .filter(z => !z.selected)
        .map(z => {

          // Preserve a reason the admin already picked for this
          // society if it was unselected before too — only reset
          // for societies that just became unselected.
          const existing = this.unselectedList.find(
            u => u.name === z.name
          );

          return existing || {
            name: z.name,
            reason: '',
            otherReasonText: ''
          };
        });

    // ==========================================================
    // NOTHING SELECTED
    // ==========================================================

    if (selectedIDs.length === 0) {

      this.ruralDetails = [];

      return;
    }

    // ==========================================================
    // API LOADING
    // ==========================================================

    this.isLoadingDetails = true;

    const body = {
      associationIds: selectedIDs
    };

    console.log(
      'Checkpoint Zones Request:',
      body
    );

    // ==========================================================
    // CALL CHECKPOINT API
    // ==========================================================

    this.userService
      .PostCheckpointZones(body)
      .subscribe({

        next: (res: any) => {

          console.log(
            'Checkpoint Zones Response:',
            res
          );

          // Clear previous details
          this.ruralDetails = [];

          if (res.success) {

            const filtered =
              (res.data?.non_selected_soc || [])
                .filter(
                  (x: any) =>
                    selectedIDs.includes(x.id)
                );

            console.log(
              'Filtered Societies:',
              filtered
            );

            filtered.forEach(
              (soc: any) => {

                this.loadRuralDetail(
                  soc.id,
                  soc.association_name
                );

              }
            );

          }

          this.isLoadingDetails = false;

        },

        error: (err) => {

          console.error(
            'Checkpoint Zones Error:',
            err
          );

          this.isLoadingDetails = false;

        }

      });
  }

  // ============================================================
  // LOAD RURAL DETAIL
  // ============================================================

  loadRuralDetail(
    id: number,
    name: string
  ): void {

    // ==========================================================
    // Prevent duplicate
    // ==========================================================

    if (
      this.ruralDetails
        .some(r => r.name === name)
    ) {
      return;
    }

    const body = {
      associationIds: [id]
    };

    console.log(
      'Rural Detail Request:',
      body
    );

    // ==========================================================
    // API
    // ==========================================================

    this.userService
      .getRuralSocietyDetails(body)
      .subscribe({

        next: (r: any) => {

          console.log(
            'Rural Detail Response:',
            r
          );

          if (
            r.success &&
            r.data &&
            r.data.length > 0
          ) {

            const d = r.data[0];

            // ==================================================
            // Prevent duplicate
            // ==================================================

            if (
              !this.ruralDetails
                .some(
                  x => x.name === name
                )
            ) {

              const sc =
                Number(d.sc_st || 0);

              const women =
                Number(d.women || 0);

              const general =
                Number(d.general || 0);

              this.ruralDetails.push({

                id: id,

                name: name,

                sc: sc,

                women: women,

                general: general,

                total:
                  sc +
                  women +
                  general

              });

            }

          }

        },

        error: (err) => {

          console.error(
            'Rural Detail Error:',
            err
          );

        }

      });
  }

  // ============================================================
  // CANCEL
  // ============================================================

  cancel(): void {

    this.router.navigate([
      '/layout/totalforms'
    ]);

  }

  // ============================================================
  // SUBMIT FORM
  // ============================================================

  submitForm(): void {

    // ==========================================================
    // PREPARE PAYLOAD
    // ==========================================================

    const payload = {

      remark: this.noteText,

      // ========================================================
      // SELECTED SOCIETIES
      // ========================================================

      selected_soc:
        this.masterZones12
          .filter(x => x.selected)
          .map(z => ({

            id: z.id,

            association_name:
              z.name

          })),

      // ========================================================
      // NON SELECTED SOCIETIES
      // ========================================================

      non_selected_soc:
        this.masterZones12
          .filter(x => !x.selected)
          .map(z => {

            const reasonEntry =
              this.unselectedList.find(
                u => u.name === z.name
              );

            return {

              id: z.id,

              association_name:
                z.name,

              reason:
                reasonEntry?.reason || '',

              other_reason_text:
                reasonEntry?.reason === 'other'
                  ? (reasonEntry?.otherReasonText || '')
                  : ''

            };

          }),

      // ========================================================
      // RURAL DETAILS
      // ========================================================

      rural_details:
        this.masterZones12
          .filter(x => x.selected)
          .map(z => {

            // Match by society id (names can differ slightly between the
            // master list and saved data, which used to save 0 counts);
            // fall back to the name for rows without an id.
            const r =
              this.ruralDetails.find(t => t.id === z.id) ??
              this.ruralDetails.find(t => t.name === z.name);

            const sc =
              r?.sc ?? 0;

            const women =
              r?.women ?? 0;

            const general =
              r?.general ?? 0;

            return {

              rurel_id:
                z.id,

              sc_st:
                sc,

              women:
                women,

              general:
                general,

              tot_voters:
                sc +
                women +
                general

            };

          })

    };

    console.log(
      '======================================'
    );

    console.log(
      'Form1 Submit Payload:',
      payload
    );

    console.log(
      'Form1 ID:',
      this.form1Id
    );

    console.log(
      'Edit Mode:',
      this.isEditMode
    );

    console.log(
      '======================================'
    );

    // ==========================================================
    // EDIT MODE
    // ==========================================================

    if (this.isEditMode) {

      if (!this.form1Id) {

        this.dialog.show(
          'Form1 ID is missing'
        );

        return;
      }

      this.isSubmitting = true;

      this.userService
        .editForm1(
          this.form1Id,
          payload
        )
        .subscribe({

          next: (res: any) => {

            console.log(
              'Form1 Update Response:',
              res
            );

            this.isSubmitting = false;

            localStorage.setItem(
              'form1_id',
              this.form1Id!.toString()
            );

            localStorage.setItem(
              'form1_completed',
              'true'
            );

            this.dialog.show(
              '✔ Form Updated Successfully'
            );

            this.router.navigate([
              '/layout/totalforms'
            ]);

          },

          error: (err) => {

            this.isSubmitting = false;

            console.error(
              'Form1 Update Error:',
              err
            );

            this.dialog.show(
              'Form1 Update Failed'
            );

          }

        });

    }

    // ==========================================================
    // ADD MODE
    // ==========================================================

    else {

      this.isSubmitting = true;

      this.userService
        .submitForm1(payload)
        .subscribe({

          next: (res: any) => {

            console.log(
              'Form1 Submit Response:',
              res
            );

            this.isSubmitting = false;

            if (res.success) {

              // =================================================
              // SAVE FORM1 ID
              // =================================================

              localStorage.setItem(
                'form1_id',
                res.data.id.toString()
              );

              // =================================================
              // MARK FORM1 COMPLETED
              // =================================================

              localStorage.setItem(
                'form1_completed',
                'true'
              );

              // =================================================
              // SAVE LOCATION DETAILS
              // =================================================

              localStorage.setItem(
                'district_name',
                this.district_name
              );

              localStorage.setItem(
                'zone_name',
                this.zone_name
              );

              this.dialog.show(
                '✔ Form Submitted Successfully'
              );

              this.router.navigate([
                '/layout/totalforms'
              ]);

            }

          },

          error: (err) => {

            this.isSubmitting = false;

            console.error(
              'Form1 Submit Error:',
              err
            );

            this.dialog.show(
              'Form1 Submission Failed'
            );

          }

        });

    }

  }

}