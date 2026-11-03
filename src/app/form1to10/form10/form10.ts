import { inject, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '../../shared/dialog/dialog.service';

type CategoryType = 'sc_st' | 'women' | 'general';

interface Candidate {
  form5_member_id: number;
  member_name: string;
  aadhar_no: string;
  category_type: CategoryType;
  is_elected: boolean;
  // 15 (b): votes obtained in the president poll
  votes_obtained?: number | null;
}

@Component({
  selector: 'app-form10',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form10.html',
  styleUrls: ['./form10.css']
})
export class Form10 implements OnInit {

  // Success / error / warning popup (replaces alert())
  private dialog = inject(DialogService);

  // Statuses that mean a candidate is no longer in the running.
  // Anything else (including null/undefined) is still active — the
  // preview API leaves status null until a candidate is actually
  // rejected/withdrawn/decided.
  private static readonly DECIDED_STATUSES = ['REJECTED', 'WITHDRAWN', 'LOST', 'ELECTED'];

  // ==========================================
  // TABLES — படிவம் 15 flow:
  //   15 (a): F3 (filed) -> First selection (reject) -> Rejected (view)
  //           -> Withdrawal (who continues) -> Final list
  //   15 (b): votes for each final candidate -> highest vote is President
  //   One candidate left after scrutiny / withdrawal -> President UNOPPOSED.
  // Any society not yet finalized can have its election stopped with a
  // reason instead (column 10).
  // ==========================================

  // TABLE 1 — all filed members, view only
  f3List: any[] = [];

  // TABLE 2 — societies not yet screened (reject/continue decision)
  firstSelectionList: any[] = [];

  // TABLE 3 — rejected societies, view only (society-level, automatic)
  rejectedSocietiesList: any[] = [];

  // 15 (a) col 8 — societies waiting for the withdrawal step
  withdrawList: any[] = [];

  // 15 (b) — final list with more than one candidate: enter votes (POLL)
  f5List: any[] = [];
  showF5Table = false;

  // Societies whose election can still be stopped (not finalized / stopped)
  stoppableList: any[] = [];

  // Societies whose president election was stopped, with the reason
  stoppedList: any[] = [];

  // Stop-election popup
  showStopModal = false;
  stopSociety: any = null;
  stopReason = '';
  stopOtherText = '';

  // Same stop reasons as Form4 / Form5b / Form7
  readonly reasonOptions = [
    { value: 'legal_order', label: 'சட்ட ஒழுங்கு' },
    { value: 'natural_disaster', label: 'இயற்கை பேரிடர்' },
    { value: 'court_injunction', label: 'நீதிமன்ற தடையாணை' },
    { value: 'election_cancelled_by_commission', label: 'ஆணையத்தால் தேர்தல் ரத்து' },
    { value: 'insufficient_quorum', label: 'சிற்றெண் குறைவு' },
    { value: 'other', label: 'இதர காரணங்கள்' }
  ];

  // Societies already finalized (UNOPPOSED or POLL) this session
  finalizedSocieties = new Set<number>();

  // Guards against firing the auto-finalize API call twice for the
  // same society while its request is still in flight
  private autoFinalizing = new Set<number>();

  // TABLE 7 — final result table (Sl.No, Society, President, Election type)
  finalizedResultsList: any[] = [];

  isFormSubmitted = false;

  district_name = '';
  zone_name = '';

  showModal = false;
  selectedSociety: any = null;
  candidates: Candidate[] = [];

  // VIEW ONLY MODAL
  // ======================
  showViewModal = false;
  viewSociety: any = null;
  viewCandidates: Candidate[] = [];

  // Finalize controls (TABLE 6)
  selectedVicePresidentId: number | null = null;

  // Action control
  currentAction: 'REJECT' | 'WITHDRAW' | 'FINALIZE' | null = null;

  readonly voteCategories: { key: CategoryType; label: string }[] = [
    { key: 'sc_st', label: 'ப.இ/பகு' },
    { key: 'women', label: 'மகளிர்' },
    { key: 'general', label: 'பொது' }
  ];

  form10_id!: number;

  // The form is already SUBMITTED; it can be reopened for editing until
  // the next form is submitted (can_edit from the preview API)
  submittedCanEdit = false;

  // 'a' = 15 (a) scrutiny / withdrawal, 'b' = 15 (b) votes / stop / submit
  part: 'a' | 'b' = 'a';

  constructor(private userService: UserService, private router: Router, private route: ActivatedRoute) { }

  goToPart(part: 'a' | 'b'): void {
    this.router.navigate(['/layout/form1to10', part === 'b' ? 'form10b' : 'form10']);
  }

  goBack(): void {
    this.router.navigate(['/layout/totalforms']);
  }

  // ======================
  // PAGE LOAD
  // ======================
  ngOnInit(): void {
    this.part = this.route.snapshot.data?.['part'] === 'b' ? 'b' : 'a';
    this.district_name = localStorage.getItem('district_name') || '';
    this.zone_name = localStorage.getItem('zone_name') || '';
    this.callInitOnce();
  }

  callInitOnce(): void {
    this.userService.form10init({}).subscribe({
      next: (res: any) => {
        this.form10_id = res?.data?.form10_id;
        this.loadPreview();
      },
      error: () => this.loadPreview()
    });
  }

  // ======================
  // VIEW SOCIETY - READ ONLY
  // ======================
  viewSocietyDetails(row: any): void {

    this.viewSociety = row;

    this.viewCandidates = (row.candidates || []).map((c: any) => ({
      form5_member_id: c.form5_member_id,
      member_name: c.member_name,
      aadhar_no: c.aadhar_no,
      category_type: c.category_type,
      is_elected: false
    }));

    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewSociety = null;
    this.viewCandidates = [];
  }

  // ======================
  // PREVIEW (Main Source)
  // ======================
  loadPreview(): void {
    this.userService.getForm10Preview().subscribe({
      next: (res: any) => {

        // Already submitted: show the "submitted" banner (Edit button when
        // it can still be edited) instead of the entry steps
        if (res?.success && res.data?.status === 'SUBMITTED') {
          this.isFormSubmitted = true;
          this.submittedCanEdit = !!res.data.can_edit;
          this.form10_id = res.data.form10_id;
          this.f3List = [];
          this.firstSelectionList = [];
          this.rejectedSocietiesList = [];
          this.withdrawList = [];
          this.f5List = [];
          this.showF5Table = false;
          this.stoppableList = [];
          this.stoppedList = [];
          this.finalizedResultsList = [];
          return;
        }

        this.isFormSubmitted = false;

        if (!res?.success || !res.data?.societies) {
          this.f3List = [];
          this.firstSelectionList = [];
          this.rejectedSocietiesList = [];
          this.withdrawList = [];
          this.f5List = [];
          this.showF5Table = false;
          this.stoppableList = [];
          this.stoppedList = [];
          return;
        }

        const societies = res.data.societies || [];

        // Only societies that actually have members filed
        const filedSocieties = societies.filter(
          (soc: any) =>
            Array.isArray(soc.candidates) &&
            soc.candidates.length > 0
        );

        // Stopped societies leave the entry steps; they are listed with
        // their reason instead (column 10).
        this.stoppedList = filedSocieties
          .filter((soc: any) => soc.is_stopped)
          .map((soc: any) => ({
            form10_society_id: soc.form10_society_id,
            society_name: soc.society_name,
            reason: soc.stop_reason_label || '-'
          }));

        const validSocieties = filedSocieties.filter((soc: any) => !soc.is_stopped);

        this.district_name = res.data.district_name;
        this.zone_name = res.data.zone_name;

        // ==========================================
        // PER-STAGE CANDIDATE POOLS
        //
        // The backend now precomputes each stage's candidate pool
        // directly (table1_candidates..table6_candidates) — use those
        // when present since they're authoritative, and only fall
        // back to deriving the pool ourselves for older responses
        // that don't include them yet.
        // ==========================================

        const table1 = (soc: any): any[] => soc.table1_candidates || soc.candidates || [];
        const table2 = (soc: any): any[] => soc.table2_candidates || soc.candidates || [];

        const table3 = (soc: any): any[] =>
          soc.table3_candidates ||
          soc.rejected_members?.all ||
          (soc.candidates || []).filter((c: any) => c.status === 'REJECTED');

        const table4 = (soc: any): any[] =>
          soc.table4_candidates || this.contestingCandidates(soc);

        // Final candidates — everyone who continued after scrutiny and did
        // not withdraw (TABLE 6)
        const table6 = (soc: any): any[] =>
          soc.table6_candidates || table4(soc);

        // A society has "completed" TABLE 2 once the backend's explicit
        // flag says so; fall back to inferring it from counts for older
        // responses without that flag.
        const hasCompletedFirstSelection = (soc: any): boolean => {
          if (typeof soc.is_rejected_submitted === 'boolean') {
            return soc.is_rejected_submitted;
          }
          if (table3(soc).length > 0) return true;
          if ((soc.rejected_counts?.total ?? 0) > 0) return true;
          const total = (soc.candidates || []).length;
          return this.contestingCandidates(soc).length < total;
        };

        // ==========================================
        // TABLE 1 — ALL FILED MEMBERS (view only)
        // ==========================================
        this.f3List = validSocieties.map((soc: any) => ({
          form10_society_id: soc.form10_society_id,
          society_name: soc.society_name,
          candidates: table1(soc)
        }));

        // ==========================================
        // TABLE 2 — FIRST SELECTION (societies not yet screened)
        // ==========================================
        this.firstSelectionList = validSocieties
          .filter((soc: any) => !hasCompletedFirstSelection(soc))
          .map((soc: any) => ({
            form10_society_id: soc.form10_society_id,
            society_name: soc.society_name,
            candidates: table2(soc)
          }));

        // ==========================================
        // TABLE 3 — REJECTED, view only, society-level
        // (All candidates - Selected candidates = Rejected)
        // ==========================================
        this.rejectedSocietiesList = validSocieties
          .filter((soc: any) => table3(soc).length > 0)
          .map((soc: any) => ({
            form10_society_id: soc.form10_society_id,
            society_name: soc.society_name,
            candidates: table3(soc)
          }));

        // Screened (TABLE 2 done) and not yet finalized
        const afterFirstSelection = validSocieties.filter((soc: any) =>
          hasCompletedFirstSelection(soc) &&
          !this.isSocietyFinalized(soc, Number(soc.form10_society_id))
        );

        // ==========================================
        // AUTO-FINALIZE — exactly one candidate left after TABLE 2
        // becomes President UNOPPOSED (போட்டியில்லாதது) with no
        // extra selection step.
        // ==========================================

        afterFirstSelection
          .filter((soc: any) => table6(soc).length === 1)
          .forEach((soc: any) => this.autoFinalizeUnopposed(soc, table6(soc)[0]));

        // ==========================================
        // 15 (a) col 8 — WITHDRAWAL: screened, more than one candidate
        // continuing, withdrawal step not done yet
        // ==========================================

        this.withdrawList = afterFirstSelection
          .filter((soc: any) => !soc.withdraw_done && table4(soc).length > 1)
          .map((soc: any) => ({
            form10_society_id: soc.form10_society_id,
            society_name: soc.society_name,
            candidates: table4(soc)
          }));

        // ==========================================
        // 15 (b) — FINAL LIST, VOTES (POLL)
        //
        // Withdrawal done and more than one candidate still contesting,
        // not yet finalized.
        // ==========================================

        this.f5List = afterFirstSelection
          .filter((soc: any) => soc.withdraw_done)
          .map((soc: any) => ({
            form10_society_id: soc.form10_society_id,
            society_name: soc.society_name,
            total: table6(soc).length,
            // Voters = the society's board members (everyone filed in TABLE 1)
            voter_count: soc.voter_count ?? table1(soc).length,
            candidates: table6(soc)
          }))
          .filter((row: any) => row.total > 1);

        this.showF5Table = this.f5List.length > 0;

        // Any society not yet finalized can still be stopped
        this.stoppableList = validSocieties
          .filter((soc: any) => !this.isSocietyFinalized(soc, Number(soc.form10_society_id)))
          .map((soc: any) => ({
            form10_society_id: soc.form10_society_id,
            society_name: soc.society_name
          }));

        // ==========================================
        // TABLE 7 — FINALIZED RESULTS — hydrate from backend
        //
        // Societies already finalized (this session or an earlier
        // one) may carry: table7_vice_president (most direct — bundles
        // the winner + election_type together), vice_president_winner
        // (admin list API), flat vice_president_name/vice_president_category,
        // or just vice_president_form5_candidate_id pointing into
        // candidates[] — try each in turn.
        // ==========================================

        validSocieties
          .filter((soc: any) => this.isSocietyFinalized(soc, Number(soc.form10_society_id)))
          .forEach((soc: any) => {

            const societyId = Number(soc.form10_society_id);

            const alreadyListed = this.finalizedResultsList.some(
              (item: any) => Number(item.form10_society_id) === societyId
            );

            if (alreadyListed) return;

            const winnerCandidate =
              (soc.candidates || []).find(
                (c: any) => Number(c.form5_member_id) === Number(soc.vice_president_form5_candidate_id)
              ) ||
              (soc.candidates || []).find((c: any) => c.status === 'ELECTED');

            const winner =
              soc.table7_vice_president ||
              soc.vice_president_winner ||
              (soc.vice_president_name
                ? { member_name: soc.vice_president_name, category_type: soc.vice_president_category }
                : null) ||
              winnerCandidate;

            this.pushFinalizedResult(
              societyId,
              soc.society_name,
              winner,
              soc.table7_vice_president?.election_type || soc.election_type || '-'
            );
          });
      }
    });
  }

  // A society counts as finalized if the backend says so directly
  // (is_finalized / vice_president_winner / table7_vice_president from the
  // admin list or preview API), if it has a
  // vice_president_form5_candidate_id set, or if we finalized it locally
  // this session.
  private isSocietyFinalized(soc: any, societyId: number): boolean {
    return (
      this.finalizedSocieties.has(societyId) ||
      soc.is_finalized === true ||
      !!soc.table7_vice_president ||
      !!soc.vice_president_winner ||
      !!soc.vice_president_form5_candidate_id
    );
  }

  private contestingCandidates(soc: any): any[] {
    return (soc.candidates || []).filter(
      (c: any) => !Form10.DECIDED_STATUSES.includes(c.status)
    );
  }

  // Directly finalizes a society as UNOPPOSED when exactly one
  // candidate remains right after TABLE 2 — no TABLE 4/6 step needed.
  private autoFinalizeUnopposed(soc: any, winner: any): void {

    const societyId = Number(soc.form10_society_id);

    if (this.finalizedSocieties.has(societyId) || this.autoFinalizing.has(societyId)) {
      return;
    }

    if (!winner) return;

    this.autoFinalizing.add(societyId);

    const payload = {
      form10_society_id: societyId,
      election_type: 'UNOPPOSED',
      vice_president_form5_candidate_id: winner.form5_member_id
    };

    this.userService.form10societyfinalize(payload).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.finalizedSocieties.add(societyId);
          this.pushFinalizedResult(societyId, soc.society_name, winner, 'UNOPPOSED');
        }
        this.autoFinalizing.delete(societyId);
      },
      error: () => this.autoFinalizing.delete(societyId)
    });
  }

  private pushFinalizedResult(
    societyId: number,
    societyName: string,
    candidate: any,
    electionType: string
  ): void {

    const resultRow = {
      form10_society_id: societyId,
      society_name: societyName,
      vice_president_name: candidate?.member_name || '-',
      election_type: electionType
    };

    const existingIndex = this.finalizedResultsList.findIndex(
      (item: any) => Number(item.form10_society_id) === societyId
    );

    if (existingIndex >= 0) {
      this.finalizedResultsList[existingIndex] = resultRow;
    } else {
      this.finalizedResultsList.push(resultRow);
    }
  }

  // ======================
  // OPEN MODAL
  // ======================
  addSociety(row: any, action: 'REJECT' | 'WITHDRAW' | 'FINALIZE'): void {
    this.selectedSociety = row;
    this.currentAction = action;

    this.selectedVicePresidentId = null;

    this.candidates = (row.candidates || []).map((c: any) => ({
      form5_member_id: c.form5_member_id,
      member_name: c.member_name,
      aadhar_no: c.aadhar_no,
      category_type: c.category_type,
      // REJECT / WITHDRAW modal: checked = continue (WITHDRAW starts all ticked).
      // FINALIZE modal: unused — the votes decide the President.
      is_elected: action === 'WITHDRAW',
      votes_obtained: c.votes_obtained ?? null
    }));

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSociety = null;
    this.candidates = [];
    this.currentAction = null;
  }

  // TABLE 6 — exclusive single-select via checkbox
  selectVicePresident(candidate: Candidate): void {
    this.candidates.forEach(c => c.is_elected = false);
    candidate.is_elected = true;
    this.selectedVicePresidentId = candidate.form5_member_id;
  }

  // 15 (b) — candidates of one category in the votes popup
  candidatesIn(cat: CategoryType): Candidate[] {
    return this.candidates.filter(c => c.category_type === cat);
  }

  private hasVote(c: Candidate): boolean {
    const v: any = c.votes_obtained;
    return v !== null && v !== undefined && v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0;
  }

  // Board members who vote in the president election (TABLE 1 count)
  get voterCount(): number {
    return Number(this.selectedSociety?.voter_count) || 0;
  }

  get votesEntered(): number {
    return this.candidates.reduce((t, c) => t + (this.hasVote(c) ? Number(c.votes_obtained) : 0), 0);
  }

  get votesOverLimit(): boolean {
    return this.voterCount > 0 && this.votesEntered > this.voterCount;
  }

  // Votes must tally exactly with the voters before submitting
  get votesTally(): boolean {
    return this.voterCount > 0 && this.votesEntered === this.voterCount;
  }

  // Leader by votes so far: the winner, a tie, or not all votes entered yet
  get voteLeader(): { candidate: Candidate | null; tie: boolean; complete: boolean } {
    const complete = this.candidates.length > 0 && this.candidates.every(c => this.hasVote(c));
    if (!complete) return { candidate: null, tie: false, complete };
    const highest = Math.max(...this.candidates.map(c => Number(c.votes_obtained)));
    const top = this.candidates.filter(c => Number(c.votes_obtained) === highest);
    return { candidate: top.length === 1 ? top[0] : null, tie: top.length > 1, complete };
  }

  maskAadhar(aadhar: string): string {
    return aadhar ? 'xxxx xxxx ' + aadhar.slice(-4) : '';
  }

  // (7) தேர்தல் முறை in Tamil
  electionTypeLabel(type: string | null | undefined): string {
    if (type === 'UNOPPOSED') return 'போட்டியில்லாதது';
    if (type === 'POLL') return 'போட்டி';
    return '-';
  }

  // ======================
  // STOP / RESUME a society's president election (column 10)
  // ======================
  openStop(row: any): void {
    this.stopSociety = row;
    this.stopReason = '';
    this.stopOtherText = '';
    this.showStopModal = true;
  }

  closeStop(): void {
    this.showStopModal = false;
    this.stopSociety = null;
  }

  submitStop(): void {
    if (!this.stopSociety) return;

    if (!this.stopReason) {
      this.dialog.show('காரணத்தை தேர்வு செய்யவும்');
      return;
    }

    if (this.stopReason === 'other' && !this.stopOtherText.trim()) {
      this.dialog.show('இதர காரணத்தை உள்ளிடவும்');
      return;
    }

    this.userService.form10stop({
      form10_society_id: Number(this.stopSociety.form10_society_id),
      stop_reason: this.stopReason,
      stop_other_reason_text: this.stopReason === 'other' ? this.stopOtherText.trim() : ''
    }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.dialog.show('தேர்தல் நிறுத்தப்பட்டது');
          this.closeStop();
          this.loadPreview();
        }
      },
      error: err => this.dialog.show(err?.error?.message || 'Stop failed')
    });
  }

  // ======================
  // EDIT a submitted form / a finalized society
  // ======================

  // Reopen the submitted form as a draft so it can be edited
  editSubmittedForm(): void {
    if (!confirm('சமர்ப்பிக்கப்பட்ட படிவத்தை திருத்தவா?')) return;

    this.userService.form10reopen().subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.isFormSubmitted = false;
          this.finalizedSocieties.clear();
          this.finalizedResultsList = [];
          this.callInitOnce();
        }
      },
      error: err => this.dialog.show(err?.error?.message || 'Edit failed')
    });
  }

  // Send one finalized / stopped society back to step 1 to enter it again
  resetSociety(row: any): void {
    if (!confirm(`${row.society_name} — மீண்டும் உள்ளீடு செய்யவா?`)) return;

    const societyId = Number(row.form10_society_id);

    this.userService.form10societyreset({ form10_society_id: societyId }).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.finalizedSocieties.delete(societyId);
          this.finalizedResultsList = this.finalizedResultsList.filter(
            (item: any) => Number(item.form10_society_id) !== societyId
          );
          this.loadPreview();
        }
      },
      error: err => this.dialog.show(err?.error?.message || 'Reset failed')
    });
  }

  resumeElection(row: any): void {
    if (!confirm(`${row.society_name} — தேர்தலை மீண்டும் தொடங்கவா?`)) return;

    this.userService.form10resume({ form10_society_id: Number(row.form10_society_id) }).subscribe({
      next: (res: any) => {
        if (res?.success) this.loadPreview();
      },
      error: err => this.dialog.show(err?.error?.message || 'Resume failed')
    });
  }

  // ======================
  // SUBMIT (REJECT / FINALIZE)
  // ======================

  submitModal(): void {

    if (!this.selectedSociety) return;

    // ==========================
    // TABLE 6 → FINALIZE (POLL)
    // ==========================
    if (this.currentAction === 'FINALIZE') {

      if (!this.candidates.every(c => this.hasVote(c))) {
        this.dialog.show('அனைத்து வேட்பாளர்களுக்கும் பெற்ற வாக்குகளை உள்ளிடவும்');
        return;
      }

      if (!this.votesTally) {
        this.dialog.show(
          `பெற்ற வாக்குகளின் கூடுதல் (${this.votesEntered}) மொத்த வாக்காளர்களுக்கு (${this.voterCount}) சமமாக இருக்க வேண்டும்`
        );
        return;
      }

      const leader = this.voteLeader;
      if (leader.tie || !leader.candidate) {
        this.dialog.show('அதிக வாக்குகள் சமமாக உள்ளன — வாக்குகளை சரிசெய்யவும்');
        return;
      }

      // Highest vote wins (the backend checks the same)
      this.selectedVicePresidentId = leader.candidate.form5_member_id;

      const payload = {
        form10_society_id: this.selectedSociety.form10_society_id,
        election_type: 'POLL',
        vice_president_form5_candidate_id: this.selectedVicePresidentId,
        votes: this.candidates.map(c => ({
          form5_member_id: c.form5_member_id,
          votes_obtained: Number(c.votes_obtained)
        }))
      };

      this.userService.form10societyfinalize(payload).subscribe({
        next: (res: any) => {

          if (res?.success) {

            this.dialog.show('சேமிக்கப்பட்டது — அதிக வாக்குகள் பெற்றவர் துணைத் தலைவர்');

            const societyId = Number(this.selectedSociety.form10_society_id);

            this.finalizedSocieties.add(societyId);

            // Finalized: no longer waiting for votes or stoppable
            this.f5List = this.f5List.filter(
              (item: any) => Number(item.form10_society_id) !== societyId
            );
            this.showF5Table = this.f5List.length > 0;
            this.stoppableList = this.stoppableList.filter(
              (item: any) => Number(item.form10_society_id) !== societyId
            );

            const president = this.candidates.find(
              c => c.form5_member_id === this.selectedVicePresidentId
            );

            this.pushFinalizedResult(societyId, this.selectedSociety.society_name, president, 'POLL');

            this.closeModal();

            // Refresh from the backend so every list matches the saved state
            this.loadPreview();
          }
        },
        error: err => this.dialog.show(err?.error?.message || 'Finalize failed')
      });

      return;
    }

    // ==========================
    // 15 (a) col 8 → WITHDRAW
    // CHECKED = continues, UNCHECKED = withdrew. One left → UNOPPOSED.
    // ==========================
    if (this.currentAction === 'WITHDRAW') {

      const staying = this.candidates.filter(c => c.is_elected);

      if (staying.length === 0) {
        this.dialog.show('குறைந்தது ஒரு உறுப்பினரையாவது தொடர தேர்வு செய்யவும்');
        return;
      }

      this.userService.form10withdraw({
        form10_society_id: this.selectedSociety.form10_society_id,
        candidates: staying.map(c => ({ form5_member_id: c.form5_member_id }))
      }).subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.dialog.show(staying.length === 1
              ? 'சேமிக்கப்பட்டது — போட்டியின்றி துணைத் தலைவர் தேர்வு'
              : 'சேமிக்கப்பட்டது');
            this.closeModal();
            this.loadPreview();
          }
        },
        error: err => this.dialog.show(err?.error?.message || 'API error')
      });

      return;
    }

    // ==========================
    // TABLE 2 → REJECT
    //
    // CHECKED   = candidate continues to TABLE 6/UNOPPOSED
    // UNCHECKED = candidate is rejected
    //
    // The backend's candidates[] payload is the KEEP list — anyone
    // NOT included gets marked REJECTED automatically. So we send
    // the checked (continuing) candidates, not the unchecked ones.
    // ==========================

    const continuing = this.candidates.filter(c => c.is_elected);

    if (continuing.length === 0) {
      this.dialog.show('குறைந்தது ஒரு உறுப்பினரையாவது தொடர தேர்வு செய்யவும்');
      return;
    }

    const payload = {
      form10_society_id: this.selectedSociety.form10_society_id,
      candidates: continuing.map(c => ({ form5_member_id: c.form5_member_id }))
    };

    this.userService.form10reject(payload).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.dialog.show('சேமிக்கப்பட்டது');
          this.closeModal();
          this.loadPreview();
        }
      },
      error: err => this.dialog.show(err?.error?.message || 'API error')
    });
  }

  submitForm10(): void {

    if (this.isFormSubmitted) return;

    // ==========================================
    // CHECK ALL SOCIETIES HAVE A FINAL RESULT
    //
    // Pulled fresh from the last loadPreview() response, not just
    // the local finalizedSocieties Set — the backend is still the
    // final authority and will reject form10submit() if anything
    // was missed.
    // ==========================================

    // Stopped societies are complete (they have a reason instead)
    const pendingCount =
      this.firstSelectionList.length +
      this.withdrawList.length +
      this.f5List.filter((row: any) => !row.submitted).length;

    if (pendingCount > 0) {
      this.dialog.show(`${pendingCount} சங்கங்கள் இன்னும் இறுதி செய்யப்படவில்லை.`);
      return;
    }

    const payload = {
      form10_id: this.form10_id
    };

    this.userService.form10submit(payload).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.dialog.show('Form10 Submitted Successfully');
          this.isFormSubmitted = true;
          this.router.navigate(['/layout/totalforms']);
        }
      },
      error: err => this.dialog.show(err?.error?.message || 'Submit failed')
    });
  }
}
