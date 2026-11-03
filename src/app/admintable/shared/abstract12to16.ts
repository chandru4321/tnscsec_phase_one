// District / zone-wise ABSTRACT rules for படிவம் 12 – 16 (admin).
//
// This file is copied byte-for-byte to the frontend
// (src/app/admintable/shared/abstract12to16.ts) — the admin page's on-screen
// abstract and the abstract PDF are built by the same code, so they always
// agree. No imports: it only reads the JSON the list APIs already return.
//
// Each builder returns the column groups (label + optional sub-columns) and
// one row of totals per district/zone.

export type AbstractGroup = { label: string; subs?: string[] };
export type AbstractZone = { district_name: string; zone_name: string; values: number[] };
export type AbstractResult = { groups: AbstractGroup[]; zones: AbstractZone[] };

const CAT3 = ["ப.இ/பகு", "மகளிர்", "பொது"];
const CAT4 = ["ப.இ/பகு", "மகளிர்", "பொது", "மொத்தம்"];

const collector = (size: number) => {
  const zones = new Map<string, AbstractZone>();
  return {
    get(district: string, zone: string): number[] {
      const key = `${district || "-"}||${zone || "-"}`;
      if (!zones.has(key)) {
        zones.set(key, { district_name: district || "-", zone_name: zone || "-", values: new Array(size).fill(0) });
      }
      return zones.get(key)!.values;
    },
    list: () => Array.from(zones.values()),
  };
};

const size = (groups: AbstractGroup[]) => groups.reduce((n, g) => n + (g.subs?.length || 1), 0);
const len = (list: any) => (Array.isArray(list) ? list.length : 0);

/* ===================== படிவம் 12 — elected member counts ===================== */
// rows: /form8/name/list rows — { district_name, zone_name, seats, unopposed, aboveHalfQuorum, winners }
// seats is { sc_st, women, general, total } (Form4 committee seats); each of
// the other three is { sc_st: [], women: [], general: [] } or null
export const abstract12 = (rows: any[]): AbstractResult => {
  const groups: AbstractGroup[] = [
    { label: "தேர்தல் அறிவிப்புபடி தேர்தல் முடிவடைந்த சங்கங்கள்" },
    { label: "நிர்வாகக்குழு உறுப்பினர்களின் எண்ணிக்கை", subs: CAT4 },
    { label: "போட்டியின்றி தேர்ந்தெடுக்கப்பட்டவர்கள் — Full Board", subs: CAT4 },
    { label: "போட்டியின்றி தேர்ந்தெடுக்கப்பட்டவர்கள் — Partial Board", subs: CAT4 },
    { label: "வாக்குப்பதிவு மூலம் தேர்ந்தெடுக்கப்பட்டவர்கள்", subs: CAT4 },
    { label: "தேர்ந்தெடுக்கப்பட்ட மொத்த நிர்வாகக்குழு உறுப்பினர்கள்", subs: CAT4 },
  ];
  const zones = collector(size(groups));
  for (const r of rows || []) {
    if (r.stopped) continue;  // stopped at polling / counting: not an elected board
    const v = zones.get(r.district_name, r.zone_name);
    v[0] += 1;
    const s = r.seats || {};
    v[1] += s.sc_st || 0; v[2] += s.women || 0; v[3] += s.general || 0; v[4] += s.total || 0;
    [r.unopposed, r.aboveHalfQuorum, r.winners].forEach((n: any, i: number) => {
      if (!n) return;
      const o = 5 + i * 4;
      const sc = len(n.sc_st), w = len(n.women), g = len(n.general);
      v[o] += sc; v[o + 1] += w; v[o + 2] += g; v[o + 3] += sc + w + g;
      v[17] += sc; v[18] += w; v[19] += g; v[20] += sc + w + g;
    });
  }
  return { groups, zones: zones.list() };
};

/* ===================== படிவம் 13 — elections not completed ===================== */
// rows: /form8/incomplete/list rows — { district_name, zone_name, stage_form, marks[6] }
const STAGE_FORMS = ["படிவம் 1", "படிவம் 3", "படிவம் 4", "படிவம் 6", "படிவம் 7", "படிவம் 9", "படிவம் 10"];
const REASONS = [
  "சட்ட ஒழுங்கு", "இயற்கை பேரிடர்", "நீதிமன்ற தடையாணை",
  "ஆணையத்தால் தேர்தல் ரத்து", "சிற்றெண் குறைவு", "இதர காரணங்கள்",
];

export const abstract13 = (rows: any[]): AbstractResult => {
  const groups: AbstractGroup[] = [
    { label: "தேர்தல் முடிவடையாத சங்கங்கள்" },
    { label: "எத்தகைய தேர்தல் நடவடிக்கையின் போது நிறுத்தப்பட்டது / நடைபெறவில்லை", subs: STAGE_FORMS },
    { label: "தேர்தல் முடிவடையாத / நிறுத்தப்பட்டதற்கான காரணங்கள்", subs: REASONS },
  ];
  const zones = collector(size(groups));
  for (const r of rows || []) {
    const v = zones.get(r.district_name, r.zone_name);
    v[0] += 1;
    const s = STAGE_FORMS.indexOf(r.stage_form);
    if (s >= 0) v[1 + s] += 1;
    (r.marks || []).forEach((m: string, i: number) => { if (m) v[1 + STAGE_FORMS.length + i] += 1; });
  }
  return { groups, zones: zones.list() };
};

/* ===================== படிவம் 14 / 15 — president / vice-president ===================== */
// forms: /form9 (president) or /form10 (vice-president) list — { district, zone, societies[] }
export const abstract14 = (forms: any[], part: "a" | "b", office: "president" | "vice_president"): AbstractResult => {
  const who = office === "vice_president" ? "துணைத் தலைவர்" : "தலைவர்";
  const groups: AbstractGroup[] = part === "a"
    ? [
      { label: `${who} தேர்தல் நடைபெற வேண்டிய சங்கங்கள்` },
      { label: `${who} தேர்தலுக்கு தாக்கல் செய்யப்பட்ட வேட்பாளர்கள்` },
      { label: "பரிசீலனையில் நிராகரிக்கப்பட்ட வேட்பாளர்கள்" },
      { label: "தகுதிபெற்ற வேட்பாளர்கள்" },
      { label: "வேட்பு மனுவை திரும்ப பெற்ற வேட்பாளர்கள்" },
      { label: "இறுதி வேட்பாளர்கள்" },
      { label: `போட்டியின்றி தேர்ந்தெடுக்கப்பட்ட ${who}கள்` },
      { label: `${who} தேர்தலில் வாக்குப்பதிவு நடைபெறும் சங்கங்கள்` },
      { label: `${who} தேர்தலுக்கான இறுதி வேட்பாளர் பட்டியல்படி ${who} தேர்தலில் போட்டியிடும் நிர்வாகக்குழு உறுப்பினர்கள் (9-10)` },
    ]
    : [
      { label: `${who} தேர்தல் வாக்குப்பதிவுநடைபெற்ற சங்கங்கள்` },
      { label: "போட்டியிட்ட நிர்வாகக்குழு உறுப்பினர்கள்", subs: CAT3 },
      { label: "போட்டியிட்டவர்கள் பெற்ற வாக்குகள்", subs: CAT3 },
      { label: `வாக்குப்பதிவு மூலம் தேர்ந்தெடுக்கப்பட்ட ${who}கள்` },
      { label: `${who} தேர்தல் நிறுத்தப்பட்ட சங்கங்கள்` },
    ];
  const zones = collector(size(groups));
  const cats = ["sc_st", "women", "general"];

  for (const form of forms || []) {
    for (const s of form.societies || []) {
      const v = zones.get(form.district?.name || "-", form.zone?.name || "-");
      const stopped = !!s.is_stopped;
      const isPoll = !stopped && s.election_type === "POLL";
      const isUnopposed = !stopped && s.election_type === "UNOPPOSED";
      const finalList: any[] = s.final_candidates || s.table6_candidates || [];

      if (part === "a") {
        v[0] += 1;
        v[1] += len(s.table1_candidates || s.candidates);
        v[2] += len(s.table3_candidates);
        v[3] += len(s.table4_candidates);
        v[4] += len(s.table5_candidates);
        v[5] += stopped ? 0 : finalList.length;
        if (isUnopposed) v[6] += 1;
        if (isPoll) v[7] += 1;
        // members contesting the poll = the final list of polled societies
        if (isPoll) v[8] += finalList.length;
      } else {
        if (isPoll) {
          v[0] += 1;
          cats.forEach((c, i) => {
            const inCat = finalList.filter(x => String(x?.category_type || "").toLowerCase() === c);
            v[1 + i] += inCat.length;
            v[4 + i] += inCat.reduce((t, x) => t + (Number(x?.votes_obtained) || 0), 0);
          });
          v[7] += 1;
        }
        if (stopped) v[8] += 1;
      }
    }
  }
  return { groups, zones: zones.list() };
};

/* ===================== படிவம் 16 — members, president, vice-president ===================== */
// rows: /form8/office/list rows — { district_name, zone_name, counts{sc_st,women,general,total}, president, vicePresident }
export const abstract16 = (rows: any[]): AbstractResult => {
  const groups: AbstractGroup[] = [
    { label: "சங்கங்கள்" },
    { label: "தேர்ந்தெடுக்கப்பட்ட மொத்த நிர்வாகக்குழு உறுப்பினர்கள்", subs: CAT4 },
    { label: "தலைவர்", subs: CAT3 },
    { label: "துணைத் தலைவர்", subs: CAT3 },
  ];
  const zones = collector(size(groups));
  const cats = ["sc_st", "women", "general"];
  for (const r of rows || []) {
    const v = zones.get(r.district_name, r.zone_name);
    v[0] += 1;
    v[1] += Number(r.counts?.sc_st) || 0;
    v[2] += Number(r.counts?.women) || 0;
    v[3] += Number(r.counts?.general) || 0;
    v[4] += Number(r.counts?.total) || 0;
    const p = cats.indexOf(String(r.president?.category || ""));
    if (p >= 0) v[5 + p] += 1;
    const vp = cats.indexOf(String(r.vicePresident?.category || ""));
    if (vp >= 0) v[8 + vp] += 1;
  }
  return { groups, zones: zones.list() };
};
