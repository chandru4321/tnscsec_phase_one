import { inject, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { Router, RouterOutlet } from '@angular/router';
import { lockedMessageFrom } from '../../shared/form-lock';
import { DialogService } from '../../shared/dialog/dialog.service';

@Component({
  selector: 'app-form3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form3.html',
  styleUrls: ['./form3.css']
})
export class Form3 implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Set when the edit API says this form is locked (shown as a banner)
  lockedMessage = '';

  district_name = '';
  zone_name = '';

  form1_id!: number;
  form2_id!: number;

  isEditMode = false;
  form3Id: number | null = null;

  // F3 society list (IMPORTANT: object list)
  f3SocietyList: {
    society_id: number;
    society_name: string;
    voter_list_prepared_count: number | null;
  }[] = [];

  // Societies that did NOT give a member list — officer prepared the
  // draft voter list himself for these (read-only, informational).
  f3NonMemberSocietyList: {
    society_id: number;
    society_name: string;
    voter_list_prepared_count: number | null;
  }[] = [];

  // society_id -> voter_list_prepared_count, from Form2 (covers both groups)
  private voterListCountMap = new Map<number, number | null>();

  // F5 & F6 need to cover BOTH member-list and non-member-list societies —
  // this is the union of f3SocietyList + f3NonMemberSocietyList.
  allSocietiesList: {
    society_id: number;
    society_name: string;
    voter_list_prepared_count: number | null;
  }[] = [];

  // F5 — keyed by society_id so it stays correct across the merged list
  // (index-based arrays broke once societies could come from two sources)
  f5AnswersMap: Record<number, 'YES' | 'NO'> = {};

  // F6
  removedCountsMap: Record<number, number> = {};
  remainingCountsMap: Record<number, number> = {};


  memberCounts: number[] = [];   // From API (readonly)

  // Election stop per society (same reasons as Form5B / Form7). Saved with
  // the Form3 submit; a stopped society is not carried into Form4.
  stopMap: Record<number, { reason: string; otherText: string }> = {};
  stopSociety: { society_id: number; society_name: string } | null = null;
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

  isStopped(societyId: number): boolean {
    return !!this.stopMap[societyId]?.reason;
  }

  stopLabel(societyId: number): string {
    const st = this.stopMap[societyId];
    if (!st?.reason) return '';
    const label = this.reasonOptions.find(r => r.value === st.reason)?.label || st.reason;
    return st.reason === 'other' && st.otherText ? `${label} - ${st.otherText}` : label;
  }

  openStop(soc: { society_id: number; society_name: string }): void {
    this.stopSociety = soc;
    this.stopReason = this.stopMap[soc.society_id]?.reason || '';
    this.stopOtherReasonText = this.stopMap[soc.society_id]?.otherText || '';
  }

  closeStop(): void {
    this.stopSociety = null;
  }

  saveStop(): void {
    if (!this.stopSociety) return;
    if (!this.stopReason) {
      this.dialog.show('தேர்தல் நிறுத்துவதற்கான காரணத்தை தேர்வு செய்யவும்');
      return;
    }
    if (this.stopReason === 'other' && !this.stopOtherReasonText.trim()) {
      this.dialog.show('இதர காரணத்தை உள்ளிடவும்');
      return;
    }
    this.stopMap[this.stopSociety.society_id] = {
      reason: this.stopReason,
      otherText: this.stopReason === 'other' ? this.stopOtherReasonText.trim() : ''
    };
    this.closeStop();
  }

  // Undo a stop before the form is submitted
  cancelStop(): void {
    if (this.stopSociety) delete this.stopMap[this.stopSociety.society_id];
    this.closeStop();
  }

  constructor(private userService: UserService, private router: Router

  ) { }

  ngOnInit(): void {

    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';

    this.loadEditableForm3();
    this.loadNonMemberSocieties();
  }

  // Independent of Form3's own edit/add state — always pull the
  // non-selected group (and the counts for BOTH groups) straight
  // from Form2's editable data.
  loadNonMemberSocieties(): void {
    this.userService.getEditableForm2().subscribe({
      next: (res: any) => {
        const selected = res?.data?.selected_soc || [];
        const nonSelected = res?.data?.non_selected_soc || [];

        [...selected, ...nonSelected].forEach((s: any) => {
          this.voterListCountMap.set(s.society_id, s.voter_list_prepared_count ?? null);
        });

        this.f3NonMemberSocietyList = nonSelected.map((s: any) => ({
          society_id: s.society_id,
          society_name: s.society_name,
          voter_list_prepared_count: s.voter_list_prepared_count ?? null
        }));

        this.applyVoterListCounts();
      },
      // Locked once Form3 exists — keep whatever the Form3 editable
      // response already filled in rather than clearing it
      error: () => { }
    });
  }

  // Backfills voter_list_prepared_count onto f3SocietyList — called after
  // either f3SocietyList or voterListCountMap becomes available, whichever
  // async call (loadEditableForm3/loadF3 vs loadNonMemberSocieties) lands last.
  private applyVoterListCounts(): void {
    this.f3SocietyList = this.f3SocietyList.map(soc => ({
      ...soc,
      voter_list_prepared_count:
        this.voterListCountMap.get(soc.society_id) ?? soc.voter_list_prepared_count ?? null
    }));

    this.rebuildAllSocieties();
  }

  // Merges member + non-member societies for F5/F6, filling in defaults
  // for any society that doesn't have an answer yet — never overwrites
  // an answer already entered/loaded for one.
  private rebuildAllSocieties(): void {
    // One entry per society even if it turns up in both source lists
    const unique = new Map<number, (typeof this.allSocietiesList)[number]>();
    [...this.f3SocietyList, ...this.f3NonMemberSocietyList]
      .forEach(soc => { if (!unique.has(soc.society_id)) unique.set(soc.society_id, soc); });
    this.allSocietiesList = Array.from(unique.values());

    this.allSocietiesList.forEach(soc => {
      if (!(soc.society_id in this.f5AnswersMap)) this.f5AnswersMap[soc.society_id] = 'NO';
      if (!(soc.society_id in this.removedCountsMap)) this.removedCountsMap[soc.society_id] = 0;
      if (!(soc.society_id in this.remainingCountsMap)) this.remainingCountsMap[soc.society_id] = 0;
    });
  }






  loadEditableForm3(): void {

    console.log('loadEditableForm3 called');

    this.userService.getEditableForm3().subscribe({

      next: (res: any) => {

        const d = res.data;

        this.isEditMode = true;
        this.form3Id = d.form3_id ?? d.id;
        this.form2_id = d.form2_id;

        // Form2 editable is locked once Form3 exists, so the voter-list
        // counts (and the no-member-list societies) come with Form3 itself
        // Form3 saves BOTH groups (F5–F7 cover all societies), so split the
        // no-member-list ones back out — otherwise they'd be listed twice
        const nonMemberIds = new Set<number>(
          (d.non_selected_soc || []).map((s: any) => s.society_id));

        this.f3SocietyList = d.societies
          .filter((s: any) => !nonMemberIds.has(s.society_id))
          .map((s: any) => ({
            society_id: s.society_id,
            society_name: s.society_name,
            voter_list_prepared_count: s.voter_list_prepared_count ?? null
          }));

        d.societies.forEach((s: any) => {
          if (s.voter_list_prepared_count != null) {
            this.voterListCountMap.set(s.society_id, s.voter_list_prepared_count);
          }
        });

        if (d.non_selected_soc) {
          this.f3NonMemberSocietyList = d.non_selected_soc.map((s: any) => ({
            society_id: s.society_id,
            society_name: s.society_name,
            voter_list_prepared_count: s.voter_list_prepared_count ?? null
          }));
        }

        d.societies.forEach((s: any) => {
          if (s.is_stopped && s.stop_reason) {
            this.stopMap[s.society_id] = { reason: s.stop_reason, otherText: s.stop_other_reason_text || '' };
          }
          this.f5AnswersMap[s.society_id] = (s.ero_claim === 1 || s.ero_claim === 'yes') ? 'YES' : 'NO';
          this.removedCountsMap[s.society_id] = Number(s.jcount || 0);
          this.remainingCountsMap[s.society_id] = Number(s.rcount || 0);
        });

        this.applyVoterListCounts();
      },

      error: (err: any) => {
        // Locked (next form already submitted) → show it on the page
        this.lockedMessage = lockedMessageFrom(err);

        this.isEditMode = false;

        this.form1_id = Number(localStorage.getItem('form1_id'));

        if (this.form1_id) {
          this.loadF3();
        }
      }
    });
  }

  // ================= LOAD F3 DATA =================
  loadF3() {
    this.userService.getForm3Form2List(this.form1_id).subscribe(res => {

      console.log('API Response:', res);

      if (!res?.success) return;

      const societies: any[] = [];

      // API structure: res.data.data
      const form2List = res.data?.data || [];

      form2List.forEach((f2: any) => {

        // API uses "id", not "form2_id"
        if (!this.form2_id && f2.id) {
          this.form2_id = f2.id;
        }

        (f2.selected_soc || []).forEach((soc: any) => {

          societies.push({
            society_id: soc.society_id,
            society_name: soc.society_name,
            voter_list_prepared_count: soc.voter_list_prepared_count ?? null
          });

        });

      });

      this.f3SocietyList = societies;
      this.applyVoterListCounts();

      // console.log('Societies:', this.f3SocietyList);
      // console.log('Form2 ID:', this.form2_id);

    });
  }
  // F7's final voter count for one society: when a claim/objection was
  // raised (F5 = ஆம்), the draft count is adjusted by what F6 recorded —
  // voter_list_prepared_count - removed + added. Otherwise it's unchanged.
  finalVoterCount(soc: { society_id: number; voter_list_prepared_count: number | null }): number | string {

    if (soc.voter_list_prepared_count === null || soc.voter_list_prepared_count === undefined) {
      return '✘';
    }

    if (this.f5AnswersMap[soc.society_id] === 'YES') {
      const removed = Number(this.removedCountsMap[soc.society_id] || 0);
      const added = Number(this.remainingCountsMap[soc.society_id] || 0);
      return soc.voter_list_prepared_count - removed + added;
    }

    return soc.voter_list_prepared_count;
  }

  // ================= SUBMIT =================
  onSubmit() {

    // ass_memlist stays the original draft count; total follows F7's
    // (possibly claim-adjusted) final count.
    const society_entries = this.allSocietiesList.map((soc) => {
      const draftCount = soc.voter_list_prepared_count ?? 0;
      const finalCount = this.finalVoterCount(soc);
      const total = typeof finalCount === 'number' ? finalCount : draftCount;

      return {
        society_id: soc.society_id,
        society_name: soc.society_name,
        ass_memlist: String(draftCount),
        ero_claim: (this.f5AnswersMap[soc.society_id] || 'NO').toLowerCase(), // "yes" or "no"
        jcount: Number(this.removedCountsMap[soc.society_id] || 0),
        rcount: Number(this.remainingCountsMap[soc.society_id] || 0),
        total,
        stop_reason: this.stopMap[soc.society_id]?.reason || null,
        stop_other_reason_text: this.stopMap[soc.society_id]?.reason === 'other'
          ? this.stopMap[soc.society_id].otherText : null
      };
    });

    const payload = {
      form2_id: this.form2_id,
      remarks: `Form3 submission for Form2 ID ${this.form2_id}`,
      society_entries
    };

    /* ===== EDIT MODE ===== */
    if (this.isEditMode) {

      // Edit API finds the record by form3_id and reads the list as "societies"
      this.userService.editForm3({ ...payload, form3_id: this.form3Id, societies: society_entries }).subscribe((res: any) => {

        if (res.success) {

          localStorage.setItem('form3_completed', 'true');

          this.dialog.show('✔ Form3 Updated Successfully');
          this.router.navigate(['/layout/totalforms']);
        }
      });

    }

    /* ===== ADD MODE ===== */
    else {

      this.userService.submitForm3(payload).subscribe((res: any) => {

        if (res.success) {

          localStorage.setItem('form3_id', res.data.id);
          localStorage.setItem('form3_completed', 'true');

          this.dialog.show('✔ Form3 Submitted Successfully');
          this.router.navigate(['/layout/totalforms']);
        }
      });
    }
  }


  onCancel() {
    window.history.back();
  }
}