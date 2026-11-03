import { inject, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileCardsDirective } from '../../shared/mobile-cards.directive';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { Router } from '@angular/router';
import { lockedMessageFrom } from '../../shared/form-lock';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-form5b',
  standalone: true,
  imports: [CommonModule, FormsModule, MobileCardsDirective],
  templateUrl: './form5b.html',
  styleUrls: ['./form5b.css']
})

export class Form5b implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Set when the edit API says this form is locked (shown as a banner)
  lockedMessage = '';

  district_name = '';
  zone_name = '';


  f3Societies: any[] = [];
  f4Societies: any[] = [];

  selectedSociety: any = null;

  showRejectPopup = false;
  showStopPopup = false;
  showFinalSubmitPopup = false;

  // Final submit: confirm first (it locks Form 5), then success / error
  showConfirmPopup = false;
  submitting = false;
  submitError = '';

  stopReason = '';
  stopOtherReasonText: string | null = null;

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_candidates', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  isEditMode = false;
  editableData: any = null;
  formSubmitted = false;


  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  // ngOnInit(): void {


  //   this.district_name = localStorage.getItem('district_name') || '';
  //   this.zone_name = localStorage.getItem('zone_name') || '';

  //   this.loadPreview();
  // }


  ngOnInit(): void {

    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';

    this.loadEditableForm5b();
  }
  loadEditableForm5b() {

    this.userService.getEditableForm5b().subscribe({

      next: (res: any) => {
        console.log(this.userService);



        this.isEditMode = true;
        this.editableData = res.data;
        console.log('Editable Societies:', this.editableData?.societies);


        this.loadPreview();
      },

      error: (err: any) => {
        // Locked (next form already submitted) → show it on the page
        this.lockedMessage = lockedMessageFrom(err);

        this.isEditMode = false;

        this.loadPreview();
      }
    });
  }



  // A society has been submitted once when any of its candidates is saved
  // as withdrawn; until then the popup uses the first-submit (add) API.
  hasSavedWithdrawal(form4FiledSocId: number): boolean {
    if (!this.isEditMode) return false;
    const soc = this.editableData?.societies?.find(
      (x: any) => x.form4_filed_soc_id === form4FiledSocId
    );
    return !!soc?.members?.some((m: any) => m.is_stopped === true);
  }

  refreshEditableData() {
    this.userService.getEditableForm5b().subscribe({
      next: (res: any) => {
        this.isEditMode = true;
        this.editableData = res.data;
      },
      error: () => {}
    });
  }

  /* ================= PREVIEW ================= */

  loadPreview() {

    const form4Id = Number(localStorage.getItem('form4_id'));

    this.userService.getForm5bpreview(form4Id).subscribe(res => {

      if (!res?.success) return;

      console.log('SOCIETIES:', res.data.societies);

      const prepared = res.data.societies.map((s: any) => {

        // withdrawn-but-not-yet-final candidates (is_stopped) are not counted
        const activeMembers = s.members.filter(
          (m: any) => m.is_active === true && m.is_stopped !== true
        );

        return {

          ...s,

          sc_st: activeMembers.filter(
            (m: any) => m.category_type === 'sc_st'
          ).length,

          women: activeMembers.filter(
            (m: any) => m.category_type === 'women'
          ).length,

          general: activeMembers.filter(
            (m: any) => m.category_type === 'general'
          ).length,

          total: activeMembers.length,

          // Default button text
          rejectDone: false,

          stopDone: s.is_stopped === true,

          members: s.members.map((m: any) => ({
            ...m,
            checked: false
          }))
        };

      });

      this.f3Societies = JSON.parse(JSON.stringify(prepared));
      this.f4Societies = JSON.parse(JSON.stringify(prepared));

      console.log('F4 Societies:', this.f4Societies);

    });

  }

  openRejectPopup(soc: any) {

    if (this.isEditMode && this.editableData?.societies) {

      const editableSoc = this.editableData.societies.find(
        (x: any) => x.form4_filed_soc_id === soc.form4_filed_soc_id
      );

      if (editableSoc) {

        this.selectedSociety = {
          ...soc,
          members: editableSoc.members.map((m: any) => ({
            ...m,
            // previously withdrawn = checked (untick to restore)
            checked: m.is_stopped === true || m.is_active === false
          }))
        };

      } else {

        this.selectedSociety = soc;
      }

    } else {

      this.selectedSociety = soc;
    }

    console.log('SELECTED SOCIETY', this.selectedSociety);

    this.showRejectPopup = true;
  }

  closeReject() {

    this.showRejectPopup = false;
    this.selectedSociety = null;

  }

  getMembers(type: string) {

    return this.selectedSociety?.members.filter(
      (m: any) => m.category_type === type
    ) || [];

  }

  /* ================= FINAL WITHDRAW ================= */

  finalWithdraw() {

    const candidateIds = this.selectedSociety.members
      .filter((m: any) => m.checked)
      .map((m: any) => m.id);

    // if (!candidateIds.length) {
    //   alert('தயவுசெய்து உறுப்பினரை தேர்வு செய்யவும்');
    //   return;
    // }

    /* ===== EDIT MODE: only once this society has a saved withdrawal ===== */
    if (this.hasSavedWithdrawal(this.selectedSociety.form4_filed_soc_id)) {

      // Update API directly: this society's ticked candidates are withdrawn,
      // previously withdrawn ones that are now unticked are restored.
      // form4_id is filled in by the backend (the user's Form4).
      const payload = {
        form4_filed_soc_id: this.selectedSociety.form4_filed_soc_id,
        stopped_candidate_ids: candidateIds
      };

      this.userService.editForm5b(payload).subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.dialog.show('✔ Form5B Updated Successfully');
            this.closeReject();
            // reload so the counts and the edit data show the saved state
            this.loadEditableForm5b();
          }
        },
        error: (err: any) => this.dialog.show('✘ ' + (err?.error?.message || 'Form5B update failed'))
      });

    }

    /* ===== ADD MODE: first submit for this society ===== */
    else {

      // No withdrawals in this society: nothing to save, just mark it done
      if (!candidateIds.length) {
        const soc = this.f4Societies.find(
          (x: any) => x.form4_filed_soc_id === this.selectedSociety.form4_filed_soc_id
        );
        if (soc) soc.rejectDone = true;
        this.dialog.show('✔ Form5B Submitted Successfully');
        this.closeReject();
        return;
      }

      const payload = {
        candidate_ids: candidateIds
      };

      this.userService.postcandidatestop(payload).subscribe((res: any) => {

        if (res?.success) {

          const soc = this.f4Societies.find(
            (x: any) =>
              x.form4_filed_soc_id === this.selectedSociety.form4_filed_soc_id
          );

          if (soc) {

            soc.members.forEach((m: any) => {

              if (candidateIds.includes(m.id)) {
                m.is_active = false;
              }

            });

            const activeMembers = soc.members.filter(
              (m: any) => m.is_active === true
            );

            soc.sc_st = activeMembers.filter(
              (m: any) => m.category_type === 'sc_st'
            ).length;

            soc.women = activeMembers.filter(
              (m: any) => m.category_type === 'women'
            ).length;

            soc.general = activeMembers.filter(
              (m: any) => m.category_type === 'general'
            ).length;

            soc.total = activeMembers.length;

            // Button text change after submit
            soc.rejectDone = true;
          }

          this.dialog.show('✔ Form5B Submitted Successfully');

          this.closeReject();
          // refresh the saved state so the next change goes through update
          this.refreshEditableData();
        }

      }, (err: any) => this.dialog.show('✘ ' + (err?.error?.message || 'Form5B submit failed')));
    }
  }
  /* ================= STOP ELECTION ================= */

  openStopPopup(soc: any) {

    this.selectedSociety = soc;
    // '' (not null) so it matches the dropdown's placeholder <option value="">
    this.stopReason = soc.stop_reason || '';
    this.stopOtherReasonText = soc.stop_other_reason_text || null;

    this.showStopPopup = true;

  }

  closeStop() {

    this.showStopPopup = false;
    this.selectedSociety = null;
    this.confirmRestart = false;

  }

  // Restart a stopped society: clears the stop and brings its candidates back
  confirmRestart = false;

  restartElection() {
    if (!this.confirmRestart) {
      this.confirmRestart = true;
      return;
    }

    this.userService.editForm5b({
      restarted_societies: [this.selectedSociety.form4_filed_soc_id]
    }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.dialog.show('✔ தேர்தல் மீண்டும் தொடங்கப்பட்டது');
          this.closeStop();
          this.loadEditableForm5b();
        }
      },
      error: (err: any) => {
        this.confirmRestart = false;
        this.dialog.show('✘ ' + (err?.error?.message || 'Restart failed'));
      }
    });
  }


  // cancel() {
  //   window.history.back();ss
  // }
  submitStop() {

    if (!this.stopReason) {

      this.dialog.show('தேர்தல் நிறுத்துவதற்கான காரணத்தை தேர்வு செய்யவும்');
      return;

    }

    const payload = {

      form4_filed_soc_id: this.selectedSociety.form4_filed_soc_id,
      reason: this.stopReason,
      other_reason_text: this.stopReason === 'other' ? (this.stopOtherReasonText || '') : null

    };

    /* ===== EDIT MODE: update API directly ===== */
    if (this.isEditMode) {
      this.userService.editForm5b({ stopped_societies: [payload] }).subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.dialog.show('✔ Form5B Updated Successfully');
            this.closeStop();
            this.loadEditableForm5b();
          }
        },
        error: (err: any) => this.dialog.show('✘ ' + (err?.error?.message || 'Form5B update failed'))
      });
      return;
    }

    this.userService.postsocietystop(payload).subscribe(res => {

      if (res?.success) {

        this.selectedSociety.stopDone = true;
        this.selectedSociety.stop_reason = this.stopReason;
        this.selectedSociety.stop_other_reason_text = payload.other_reason_text;

        this.closeStop();

      }

    });

  }

  /* ================= FINAL SUBMIT ================= */

  openFinalSubmit() {
    if (this.formSubmitted) return;
    this.submitError = '';
    this.showConfirmPopup = true;
  }

  submitForm5bFinal() {

    if (this.formSubmitted || this.submitting) return;

    this.submitting = true;
    this.submitError = '';

    this.userService.submitForm5b({}).subscribe({
      next: (res: any) => {
        this.submitting = false;

        if (res?.success) {
          this.formSubmitted = true;
          this.showConfirmPopup = false;
          this.showFinalSubmitPopup = true;
        } else {
          this.submitError = res?.message || 'சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.';
        }
      },
      error: (err: any) => {
        this.submitting = false;
        this.submitError = err?.error?.message || 'சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.';
      }
    });

  }

  // Success dialog → back to the forms list
  finishSubmit() {
    this.showFinalSubmitPopup = false;
    this.router.navigate(['/layout/totalforms']);
  }

}