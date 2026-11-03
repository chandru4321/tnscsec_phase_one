import { inject, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileCardsDirective } from '../../shared/mobile-cards.directive';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { FilterByCategoryPipe } from '../../pipes/filter-by-category-pipe';
import { Router, RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { lockedMessageFrom } from '../../shared/form-lock';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-form6',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterByCategoryPipe, MobileCardsDirective],
  templateUrl: './form6.html',
  styleUrls: ['./form6.css']
})
export class Form6 implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Set when the edit API says this form is locked (shown as a banner)
  lockedMessage = '';

  district_name = '';
  zone_name = '';
  form6_id!: number;

  // 🔥 NEW SEPARATION
  f3Societies: any[] = [];   // STATIC
  f4Societies: any[] = [];   // WORKING LIST

  showRejectPopup = false;
  showStopPopup = false;
  showFinalSubmitPopup = false;
  form6Submitted = false;
  isEditMode = false;
  editableData: any = null;


  selectedSociety: any = null;
  stopRemark = '';

  // Stop reason — same choices as Form5B. Saved as readable text in the
  // decision's remark, so the tables / PDFs that show it need no change.
  stopReason = '';
  stopOtherReasonText = '';

  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_candidates', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  // Captured once, when the popup opens — whether this society was
  // UNOPPOSED before any interaction (checkbox grid hidden, no choice to
  // make). Must NOT be re-derived from the live/simulated election_status,
  // since checking boxes can simulate the society INTO 'UNOPPOSED' too —
  // that case must still submit the boxes actually checked, not auto-pick
  // members[0].
  wasInitiallyUnopposed = false;

  f5List: any[] = [];
  f6List: any[] = [];
  f7List: any[] = [];

  // Societies whose withdrawal was actually submitted (moved out of
  // f4Societies into f5/f6/f7) — the only ones with a real withdrawn
  // count. Kept separately so it's not tied to which outcome list a
  // society lands in.
  processedSocieties: any[] = [];

  showViewPopup = false;
  viewSociety: any = null;

  constructor(private userService: UserService, private router: Router) { }

  // ngOnInit(): void {
  //   this.district_name = localStorage.getItem('district_name') || '';
  //   this.zone_name = localStorage.getItem('zone_name') || '';
  //   this.initForm6();
  // }
  ngOnInit(): void {

    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';

    // First initialize Form6 to get form6_id
    this.initForm6();
  }

  initForm6() {

    this.userService.initForm6().subscribe(res => {

      if (res?.success) {

        this.form6_id = res.data.form6_id;

        // Save for later use
        localStorage.setItem('form6_id', this.form6_id.toString());

        // Already submitted → edit mode (built from the saved Form6);
        // otherwise the normal draft flow from the preview
        if (res.data.status === 'SUBMITTED') {
          this.loadEditableForm6();
        } else {
          this.loadPreview();
        }
      }

    });

  }

  loadEditableForm6() {

    this.userService.getEditableForm6().subscribe({

      next: (res: any) => {

        this.editableData = res.data;
        this.isEditMode = true;
        this.form6_id = res.data.form6_id;

        this.buildFromEditable(res.data);

      },

      error: (err: any) => {
        // Locked (next form already submitted) → show it on the page
        this.lockedMessage = lockedMessageFrom(err);

        this.isEditMode = false;
        this.form6Submitted = true;   // nothing left to submit

        this.loadPreview();

      }

    });

  }

  /* ================= EDIT MODE: BUILD PAGE FROM SAVED FORM6 ================= */
  private buildFromEditable(data: any) {

    const prepared = (data.societies || []).map((s: any) => {

      const members = (s.members || []).map((m: any) => ({
        ...m,
        checked: m.withdrawn === true,
        withdrawn: m.withdrawn === true
      }));

      const soc: any = {
        form4_filed_soc_id: s.form4_filed_soc_id,
        society_id: s.society_id,
        society_name: s.society_name,
        election_status: s.election_status,

        rural_sc_st: +s.rural.sc_st,
        rural_women: +s.rural.women,
        rural_general: +s.rural.general,
        rural_total: +s.rural.sc_st + +s.rural.women + +s.rural.general,

        declared_sc_st: +s.declared.sc_st,
        declared_women: +s.declared.women,
        declared_general: +s.declared.general,
        declared_total: +s.declared.sc_st + +s.declared.women + +s.declared.general,

        rejectDone: false,
        stopDone: s.election_action === 'STOP',

        members
      };

      this.updateCounts(soc);
      return soc;
    });

    this.f3Societies = JSON.parse(JSON.stringify(prepared));
    this.f4Societies = prepared;

    this.processedSocieties = prepared.filter((s: any) => this.getWithdrawnTotal(s) > 0);

    const running = prepared.filter((s: any) => !s.stopDone);
    const withCandidates = (s: any) => ({
      ...s,
      candidates: s.members
        .filter((m: any) => !m.withdrawn)
        .map((m: any) => ({ member_name: m.member_name, category_type: m.category_type }))
    });

    this.f5List = running.filter((s: any) => s.election_status === 'UNOPPOSED').map(withCandidates);
    this.f6List = running.filter((s: any) => s.election_status === 'UNQUALIFIED').map(withCandidates);
    this.f7List = running.filter((s: any) => s.election_status === 'QUALIFIED').map(withCandidates);
  }
  /* ================= PREVIEW ================= */
  loadPreview() {
    this.userService.getForm6Preview().subscribe(res => {
      if (!res?.success) return;

      // const prepared = res.data.societies.map((s: any) => ({
      const prepared = res.data.societies
        .filter((s: any) => Number(s.active_counts?.total || 0) > 0)
        .map((s: any) => ({
          ...s,

          // Rural Counts
          rural_sc_st: +s.rural.sc_st,
          rural_women: +s.rural.women,
          rural_general: +s.rural.general,
          rural_total:
            +s.rural.sc_st +
            +s.rural.women +
            +s.rural.general,

          // Declared Counts
          declared_sc_st: +s.declared.sc_st,
          declared_women: +s.declared.women,
          declared_general: +s.declared.general,
          declared_total:
            +s.declared.sc_st +
            +s.declared.women +
            +s.declared.general,

          // Active Counts (existing)
          sc_st: +s.active_counts.sc_st,
          women: +s.active_counts.women,
          general: +s.active_counts.general,
          total: +s.active_counts.total,

          rejectDone: false,
          stopDone: false,

          members: s.members.map((m: any) => ({
            ...m,
            checked: false,
            withdrawn: false
          }))
        }));

      this.f3Societies = JSON.parse(JSON.stringify(prepared)); // snapshot
      this.f4Societies = prepared; // working list
      this.processedSocieties = [];
    });
  }



  /* ================= REJECT ================= */
  // openRejectPopup(soc: any) {
  //   this.selectedSociety = soc;
  //   this.showRejectPopup = true;
  // }

  openRejectPopup(soc: any) {

    if (this.isEditMode) {

      if (soc.stopDone) {
        this.dialog.show('இச்சங்கத்தில் தேர்தல் நிறுத்தப்பட்டுள்ளது');
        return;
      }

      // Work on a copy so closing the popup without saving changes nothing.
      // Members withdrawn earlier come pre-ticked; un-tick to restore them.
      this.selectedSociety = {
        ...soc,
        members: soc.members.map((m: any) => ({ ...m }))
      };

      // Always show the checkboxes in edit mode (never auto-pick members[0])
      this.wasInitiallyUnopposed = false;

    } else {

      this.selectedSociety = soc;
      this.wasInitiallyUnopposed = this.selectedSociety.election_status === 'UNOPPOSED';
    }

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

  /* ================= SIMULATE ================= */
  onCheckboxChange() {

    // Edit mode: the submitted Form6's withdrawn members are already
    // inactive, so the server simulation can't see them — work it out here
    if (this.isEditMode) {
      this.selectedSociety.members.forEach((m: any) => (m.withdrawn = !!m.checked));
      this.updateCounts(this.selectedSociety);
      this.selectedSociety.election_status = this.computeElectionStatus(this.selectedSociety);
      return;
    }

    const ids = this.selectedSociety.members
      .filter((m: any) => m.checked)
      .map((m: any) => m.id);

    if (!ids.length) return;

    this.userService.simulateForm6({
      form4_filed_soc_id: this.selectedSociety.form4_filed_soc_id,
      withdraw_member_ids: ids
    }).subscribe(res => {
      if (!res?.success) return;

      this.selectedSociety.election_status = res.data.election_status;

      //   res.data.members.forEach((apiM: any) => {
      //     const local = this.selectedSociety.members.find(
      //       (m: any) => m.id === apiM.id
      //     );
      //     if (local) local.withdrawn = apiM.withdrawn;

      res.data.members.forEach((apiM: any) => {

        const local = this.selectedSociety.members.find(
          (m: any) => m.id === apiM.id
        );

        if (local) {
          local.withdrawn = apiM.withdrawn;
        }
      });

      this.updateCounts(this.selectedSociety);
    });


  }

  /* ================= FINAL WITHDRAW ================= */
  finalWithdraw() {

    // ================= EDIT (submitted Form6) =================
    // Sends this society's full ticked list; the server withdraws the newly
    // ticked ones and restores the un-ticked ones. An empty list is allowed
    // (it restores every withdrawal of this society).
    if (this.isEditMode) {

      const payload = {
        form6_id: this.form6_id,
        form4_filed_soc_id: this.selectedSociety.form4_filed_soc_id,
        withdraw_member_ids: this.selectedSociety.members
          .filter((m: any) => m.checked)
          .map((m: any) => m.form5_member_id ?? m.id)
      };

      this.userService.editForm6(payload).subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.dialog.show('✔ Form6 Updated Successfully');
            this.closeReject();
            this.loadEditableForm6();
          }
        },
        error: (err: any) => {
          this.dialog.show(err?.error?.message || 'புதுப்பிக்க முடியவில்லை');
        }
      });

      return;
    }

    let membersToWithdraw: any[] = [];

    if (this.wasInitiallyUnopposed) {

      // Only auto-pick members[0] when the society was UNOPPOSED from the
      // start (no checkboxes were ever offered). If it only became
      // UNOPPOSED via the live simulation after the officer checked boxes,
      // those checked members are what must actually be withdrawn.
      membersToWithdraw = [this.selectedSociety.members[0]];

    } else {

      membersToWithdraw = this.selectedSociety.members.filter(
        (m: any) => m.checked || m.withdrawn
      );

    }

    // No one ticked = no withdrawals in this society; the submit below then
    // just finalises its status from the current counts (no API call needed)

    // ================= FIRST SUBMIT =================

    {

      // Send one at a time — firing all of these in parallel meant each
      // withdrawForm6 response reflected whatever partial state the backend
      // happened to be in at that moment (a race), so neither "last response
      // to arrive" nor any single response's election_status could be
      // trusted as the true final state. Sequencing them removes that.
      const withdrawNext = (index: number) => {

        if (index >= membersToWithdraw.length) {

          // Mark them withdrawn locally, then derive the final status the
          // same way the backend does (rural vs. the real active counts) —
          // instead of trusting any one intermediate API response.
          membersToWithdraw.forEach((m: any) => (m.withdrawn = true));

          this.updateCounts(this.selectedSociety);
          this.selectedSociety.election_status = this.computeElectionStatus(this.selectedSociety);

          this.moveSocietyAfterSubmit(this.selectedSociety);
          this.closeReject();
          this.dialog.show('✔ Form6 Submitted Successfully');

          return;
        }

        const m = membersToWithdraw[index];

        this.userService.withdrawForm6({

          form6_id: this.form6_id,

          form5_member_id: m.form5_member_id ?? m.id,

          action: 'WITHDRAW'

        }).subscribe({
          next: () => withdrawNext(index + 1),
          error: (err: any) => this.dialog.show(err?.error?.message || 'சமர்ப்பிக்க முடியவில்லை')
        });
      };

      withdrawNext(0);

    }

  }

  /* ================= CLIENT-SIDE ELECTION STATUS ================= */
  // Mirrors the backend's getElectionStatus(rural, final): all three
  // categories equal to the required seats -> UNOPPOSED; any category still
  // above the required seats -> QUALIFIED; otherwise -> UNQUALIFIED.
  private computeElectionStatus(soc: any): 'UNOPPOSED' | 'QUALIFIED' | 'UNQUALIFIED' {

    const allEqual =
      soc.rural_sc_st === soc.sc_st &&
      soc.rural_women === soc.women &&
      soc.rural_general === soc.general;

    if (allEqual) return 'UNOPPOSED';

    const hasIncrease =
      soc.sc_st > soc.rural_sc_st ||
      soc.women > soc.rural_women ||
      soc.general > soc.rural_general;

    return hasIncrease ? 'QUALIFIED' : 'UNQUALIFIED';
  }
  /* ================= MOVE SOCIETY ================= */
  private moveSocietyAfterSubmit(soc: any) {

    soc.candidates = soc.members
      .filter((m: any) => !m.withdrawn)
      .map((m: any) => ({
        member_name: m.member_name,
        category_type: m.category_type
      }));

    this.f4Societies = this.f4Societies.filter(
      s => s.form4_filed_soc_id !== soc.form4_filed_soc_id
    );

    if (soc.election_status === 'UNOPPOSED') this.f5List.push(soc);
    else if (soc.election_status === 'UNQUALIFIED') this.f6List.push(soc);
    else if (soc.election_status === 'QUALIFIED') this.f7List.push(soc);

    this.processedSocieties.push(soc);
  }

  /* ================= VIEW ================= */
  openViewPopup(soc: any) {

    // f5/f6/f7 rows already carry a built `candidates` list (see
    // moveSocietyAfterSubmit); this table's rows only have `members`,
    // so derive the same shape from the active (non-withdrawn) ones.
    const candidates = soc.candidates?.length
      ? soc.candidates
      : (soc.members || [])
        .filter((m: any) => !m.withdrawn)
        .map((m: any) => ({
          member_name: m.member_name,
          category_type: m.category_type
        }));

    this.viewSociety = { ...soc, candidates };
    this.showViewPopup = true;
  }

  closeViewPopup() {
    this.viewSociety = null;
    this.showViewPopup = false;
  }

  /* ================= STOP ================= */
  openStopPopup(soc: any) {
    if (soc.stopDone) return;
    this.selectedSociety = soc;
    this.stopRemark = '';
    this.stopReason = '';
    this.stopOtherReasonText = '';
    this.showStopPopup = true;
  }

  // Text saved as the remark: the reason label, or "இதர காரணங்கள் - <text>"
  private buildStopRemark(): string | null {
    const opt = this.reasonOptions.find(r => r.value === this.stopReason);
    if (!opt) return null;
    if (this.stopReason !== 'other') return opt.label;
    const text = (this.stopOtherReasonText || '').trim();
    return text ? `${opt.label} - ${text}` : null;
  }

  closeStop() {
    this.showStopPopup = false;
    this.selectedSociety = null;
  }

  submitStop() {

    if (!this.stopReason) {
      this.dialog.show('தேர்தல் நிறுத்துவதற்கான காரணத்தை தேர்வு செய்யவும்');
      return;
    }

    const remark = this.buildStopRemark();
    if (!remark) {
      this.dialog.show('இதர காரணத்தை உள்ளிடவும்');
      return;
    }
    this.stopRemark = remark;

    // Edit mode: stop it on the submitted Form6 directly
    if (this.isEditMode) {
      this.userService.editForm6({
        form6_id: this.form6_id,
        form4_filed_soc_id: this.selectedSociety.form4_filed_soc_id,
        action: 'STOP',
        remark: this.stopRemark
      }).subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.dialog.show('✔ Form6 Updated Successfully');
            this.closeStop();
            this.loadEditableForm6();
          }
        },
        error: (err: any) => {
          this.dialog.show(err?.error?.message || 'புதுப்பிக்க முடியவில்லை');
        }
      });
      return;
    }

    this.userService.stopElectionForm6({
      form6_id: this.form6_id,
      form4_filed_soc_id: this.selectedSociety.form4_filed_soc_id,
      action: 'STOP',
      remark: this.stopRemark
    }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.selectedSociety.stopDone = true;
          this.closeStop();
          this.dialog.show('✔ Form6 Submitted Successfully');
        }
      },
      error: (err: any) => this.dialog.show(err?.error?.message || 'சமர்ப்பிக்க முடியவில்லை')
    });
  }

  /* ================= WITHDRAWN COUNT (CATEGORY-WISE) ================= */
  getWithdrawnCount(soc: any, type: string): number {
    return (soc.members || []).filter(
      (m: any) => m.category_type === type && m.withdrawn
    ).length;
  }

  getWithdrawnTotal(soc: any): number {
    return (soc.members || []).filter((m: any) => m.withdrawn).length;
  }

  //newly added method

  updateCounts(soc: any) {

    const activeMembers = soc.members.filter((m: any) => !m.withdrawn);

    soc.sc_st = activeMembers.filter(
      (m: any) => m.category_type === 'sc_st'
    ).length;

    soc.women = activeMembers.filter(
      (m: any) => m.category_type === 'women'
    ).length;

    soc.general = activeMembers.filter(
      (m: any) => m.category_type === 'general'
    ).length;

    soc.total = soc.sc_st + soc.women + soc.general;
  }

  /* ================= FINAL FORM 6 SUBMIT ================= */
  submitForm6Final() {
    if (this.form6Submitted) return;

    this.userService.submitForm6({
      form6_id: this.form6_id
    }).subscribe(res => {
      if (res?.success) {

        this.form6Submitted = true;
        this.showFinalSubmitPopup = true;

        this.dialog.show('Form 6 submitted successfully');

        this.router.navigate(['/layout/totalforms']);
      }
    });
  }
}