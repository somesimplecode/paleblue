const GAME = {
  defaultSeconds: 10,
  showMeterNumbers: true,

  /* ---------- the board ---------- */
  minBoard: 4,   // below this many members, the board is dissolved
  seats: [
    { id: "eng",    title: "Head of Engineering" },
    { id: "reg",    title: "Head of Regulatory & Quality" },
    { id: "clin",   title: "Head of Clinical Affairs" },
    { id: "fin",    title: "Head of Finance" },
    { id: "people", title: "Head of People & Culture" }
  ],
  outsiderRoles: ["Reporter", "FDA investigator", "Patient advocate"],
  goPublic: { delta: { reputation: -15 } },

  /* ---------- termination reviews ----------
     When a meter falls below `threshold`, a review interrupts the game.
     It fires once per crossing; the meter re-arms if it climbs back up.
     On a timeout or split vote, the meter's `owner` seat is let go. */
  termination: {
    threshold: 30,
    seconds: 15,
    delta: {},   
    text: m => `${m.label} has fallen to ${m.value}. The CEO wants a name before this meeting ends. Who does the board let go?`,
    timeoutNote: seat => `The board couldn't choose, so with a heavy heart, the CEO decided to let the  ${seat.title} go. Your severance package will me in the mail.`,
    result: (seat, left) => `The ${seat.title} is escorted out. The board now has ${left} members.`,
    source: { case: "Scapegoating under pressure",
              note: "When something fails, organizations look for one person to hold responsible. Was it the right person, or the convenient one?" }
  },

  meters: {
    safety:     { label: "Patient safety",      start: 60, color: "var(--m-safety)",     owner: "eng" },
    financial:  { label: "Financial stability", start: 60, color: "var(--m-financial)",  owner: "fin" },
    reputation: { label: "Public reputation",   start: 60, color: "var(--m-reputation)", owner: "clin" },
    morale:     { label: "Employee morale",     start: 60, color: "var(--m-morale)",     owner: "people" }
  },
  flagLabels: {
    offLabelPush: "Off-label promotion left running",
    buriedSignal: "Complaints closed as “off-label use”",
    coachedConcealment: "Told sales to stop writing it down",
    lotPulled: "Pulled complaint data by lot",
    silentPatch: "Firmware bug patched without disclosure",
    flagsDisclosed: "Told transplant centers about false flags"
  },

  /* each string is one briefing screen; Space moves to the next */
  briefing: [
    `<h1>Welcome to PaleBlue.</h1>
     <p>PaleBlue is a medical device company that creates ingestible digital pills that emit data after being swallowed. Ingestible digital pills are an emerging technology used to track medication adherence or to quickly relay observable data about a patient's current condition.</p>
     <p>PaleBlue recently released its ingestible sensor system, <strong>PB-ISS-200</strong>, known as <strong>Dot</strong>. It is used primarily in adults after major surgery, to make sure they're taking their prescribed medication and to detect alarming internal changes.</p>
     <p>To keep Dot successful, we have elected all of you to the <strong>Product Safety Review Board</strong>.</p>`,

    `<h1>Your seats</h1>
     <p><strong>Head of Engineering.</strong> You maintain the firmware and hardware inside the pill, and work with Clinical Affairs on the pill's coating.</p>
     <p><strong>Head of Regulatory &amp; Quality.</strong> You keep the FDA happy: the relationship with the government, and complaint classification.</p>
     <p><strong>Head of Clinical Affairs.</strong> You communicate with doctors, patients, and insurers, and represent each party's concerns fairly.</p>
     <p><strong>Head of Finance.</strong> You keep the company afloat: revenue and sales, investors, and how much runway is left.</p>
     <p><strong>Head of People &amp; Culture.</strong> You maintain morale, shape the work environment, and lead internal communications as the driver of the company's mission and identity.</p>`,

    `<h1>A few disclaimers</h1>
     <p>We are all so glad to have you join us and continue to make a little mean a lot. As this board is experimental, please note:</p>
     <p>Your employment and participation on this board is at will. PaleBlue Medical Technologies, Inc. maintains the right to terminate your contract with the company or on this board at any moment.</p>
     <p>Board membership is contingent upon the collective performance and continued success of the team. <strong>Should membership fall below 4 members</strong>, the company's confidence in the board may be reconsidered, potentially resulting in the dissolution of the board and the termination of all participating members.</p>
     <p>Each decision gets one reading and ten seconds. If the board doesn't decide, someone else will decide for you.</p>
     <p><strong>Welcome to PaleBlue. Let's do great things!</strong></p>`
  ],

  prompts: [
    {
      id: "p01", act: "Act 1", when: "Week 2",
      channel: "Email forwarded from Sales, Northeast region",
      text: "Your top sales rep wrote to a GI clinic: “Off the record, Dot works fine for mild IBD. Plenty of docs are using it.” He is 40% of Northeast revenue, and the quarter closes in 9 days.",
      onTimeout: "B",
      timeoutNote: "Nobody stopped him. Silence reads as approval.",
      source: { case: "Off-label promotion settlements (GSK 2012, J&J Risperdal 2013)",
                note: "Doctors may prescribe off-label. Manufacturers may not promote it. Both companies paid billions over sales-force promotion." },
      options: [
        { key: "A", text: "Report him to Compliance today",
          delta: { safety: +6, financial: -8, morale: -4 }, flags: { repReported: true },
          result: "Compliance opens a file. His numbers stop, and so do the IBD referrals, for now." },
        { key: "B", text: "Let the quarter close, deal with it after",
          delta: { financial: +8 }, flags: { offLabelPush: 2 },
          result: "The quarter closes strong. Nobody mentions the email.",
          delayed: [{ after: 2, delta: { safety: -6 }, note: "GI clinic orders keep climbing. He never stopped." }] },
        { key: "C", text: "Quiet word: “Don't put that in writing”",
          delta: { financial: +4, morale: -2 }, flags: { offLabelPush: 1, coachedConcealment: true },
          result: "He stops writing it down. He doesn't stop saying it." },
        { key: "D", text: "Forward it to Legal and let them decide",
          delta: { reputation: +2, morale: -3 }, flags: { offLabelPush: 1 },
          result: "Legal says they'll review it.",
          delayed: [{ after: 3, delta: { safety: -4 }, note: "Legal's review is still pending. He closed his quarter." }] }
      ]
    },
    {
      id: "p02", act: "Act 1", when: "Week 6",
      channel: "Complaint queue, classification required",
      text: "Complaint #0419: severe abdominal pain, capsule not detected by the patch. Patient indication: ulcerative colitis. This is the fourth IBD complaint this month.",
      onTimeout: "A",
      timeoutNote: "The queue auto-closes stale tickets as “user error.”",
      source: { case: "Philips CPAP recall (2021) and PillCam retention labeling",
                note: "Philips received foam-degradation complaints for years before recalling. Capsule retention is documented and far likelier in Crohn's and strictures." },
      options: [
        { key: "A", text: "Classify as off-label use and close the ticket",
          delta: { safety: -10, financial: +5 }, flags: { buriedSignal: 1 },
          result: "Ticket closed. It's a defensible call: the patient shouldn't have been on Dot." },
        { key: "B", text: "Open a formal investigation on the coating lot",
          delta: { safety: +10, financial: -12, morale: +4 },
          result: "The investigation starts the FDA reporting clock. The psychiatric launch slips a quarter." },
        { key: "C", text: "Send prescribers a contraindication reminder",
          delta: { reputation: +5 },
          result: "Clinicians thank you for the reminder. Nothing about the capsule changes." },
        { key: "D", text: "Pull the complaint data by lot number yourself first",
          delta: { safety: +4, morale: +2 }, flags: { lotPulled: true }, nextSeconds: 5,
          result: "Three of the four IBD complaints trace to coating lot 22-114. It cost you a week: the next decision gets 5 seconds." }
      ]
    },
    {
      id: "p03", act: "Act 1", when: "Week 8",
      showIf: { flags: { offLabelPush: { gte: 2 } } },   // only if the rep was left running
      channel: "Q3 board dashboard",
      text: "GI clinic orders are up 41%. The board calls it “organic expansion into adjacent populations.” The CEO wants it on slide 3 of the investor deck.",
      onTimeout: "A",
      timeoutNote: "The deck went out on schedule.",
      source: { case: "Composite", note: "A growth number that quietly depends on off-label use." },
      options: [
        { key: "A", text: "Put it in the deck",
          delta: { financial: +10, reputation: +4 }, flags: { offLabelPush: 1 },
          result: "Investors love it.",
          delayed: [{ after: 2, delta: { reputation: -15 }, note: "An analyst asks why a transplant device is selling in gastroenterology." }] },
        { key: "B", text: "Tell the CEO the growth is probably off-label",
          delta: { financial: -4, morale: +3, reputation: +2 },
          result: "The CEO thanks you, and stops inviting you to board prep." },
        { key: "C", text: "Reword it as “broad clinician interest”",
          delta: { financial: +6 }, flags: { offLabelPush: 1 },
          result: "Technically true." },
        { key: "D", text: "Ask Medical Affairs for a safety review of IBD use",
          delta: { safety: +8, financial: -6 },
          result: "Medical Affairs starts pulling records. Someone in Sales calls you a narc." }
      ]
    },
    {
      id: "p04", act: "Act 2", when: "Week 9",
      channel: "Jira FW-2231, filed by a junior firmware engineer",
      text: "When the patch reconnects mid-sync, an ingestion event can be dropped. Twelve transplant patients were flagged “non-adherent” last month. One was moved down a kidney transplant waitlist.",
      onTimeout: "C",
      timeoutNote: "The ticket sat in triage. “Waiting on data” became the decision.",
      source: { case: "Therac-25 (1985–87) and Theranos whistleblowers",
                note: "Therac-25's race condition was dismissed as operator error across six overdoses. Theranos surveilled and threatened the employees who raised alarms." },
      options: [
        { key: "A", text: "Notify the transplant centers today",
          delta: { safety: +10, reputation: -8, financial: -6, morale: +6 }, flags: { flagsDisclosed: true },
          result: "Two centers suspend Dot pending review. The engineer who filed the ticket stays late to help." },
        { key: "B", text: "Patch it silently in firmware 2.1.4",
          delta: { safety: +4, morale: -6 }, flags: { silentPatch: true },
          result: "The bug is fixed going forward. The twelve flags stay in the patients' records.",
          delayed: [{ after: 3, delta: { reputation: -12, morale: -6 }, note: "The engineer emails: “Are we telling the centers or not?” She cc'd her personal address." }] },
        { key: "C", text: "Ask Data Science to confirm the twelve first",
          delta: { financial: +2, safety: -4 },
          result: "Data Science says two weeks.",
          delayed: [{ after: 2, delta: { safety: -8 }, note: "While you waited, a thirteenth patient was flagged." }] },
        { key: "D", text: "Escalate to the CEO",
          delta: { safety: -2, morale: -8 }, flags: { silentPatch: true },
          result: "The CEO chooses to patch it silently. Your team watched you hand it up." }
      ]
    }
  ],

  endings: [
    { early: true, when: s => s.seats.filter(x => !x.fired).length < GAME.minBoard, title: "Board dissolved",
      text: "The company has lost confidence in the board. Every remaining member is terminated, effective immediately. The CEO will make the remaining decisions alone." },
    { early: true, when: { meters: { safety: { lte: 0 } } }, title: "Recall by order",
      text: "The FDA stops waiting for you. A mandatory recall is announced before you can draft a statement." },
    { early: true, when: { meters: { financial: { lte: 0 } } }, title: "Out of runway",
      text: "Payroll fails on a Thursday. Thousands of patients are still wearing patches that report to servers nobody is paying for." },
    { early: true, when: { meters: { reputation: { lte: 0 } } }, title: "Front page",
      text: "The story runs with a photo of a recovering patient and the word “surveillance” in the headline." },
    { early: true, when: { meters: { morale: { lte: 0 } } }, title: "Exodus",
      text: "Your firmware team resigns together. The resignation letter is addressed to the board." },
    { when: { flags: { buriedSignal: { gte: 1 }, silentPatch: true } }, title: "The paper trail",
      text: "Every decision you made was defensible on its own. Laid end to end in a subpoena, they look like a pattern." },
    { when: { meters: { safety: { gte: 50 }, financial: { gte: 50 }, reputation: { gte: 50 }, morale: { gte: 50 } } }, title: "Balanced, for now",
      text: "Every meter held. Ask the room what that cost, and who paid it." },
    { title: "Still standing",
      text: "PaleBlue survives the year. Not everyone it touched can say the same." }
  ]
};

/* ==================================================================
   ENGINE — Animations and button clicks
   ================================================================== */
const $ = s => document.querySelector(s);
const screen = $("#screen");
const LETTERS = "ABCDE";
const S = {};

function reset(){
  cancelAnimationFrame(S.raf);
  Object.assign(S, {
    phase: "briefing", briefPage: 0, idx: -1, decisions: 0, current: null,
    meters: Object.fromEntries(Object.entries(GAME.meters).map(([k, m]) => [k, m.start])),
    flags: {}, queue: [], history: [], nextSeconds: null,
    seats: GAME.seats.map(s => ({ ...s, fired: false, firedAt: "", reason: "", role: null, leaked: "" })),
    tripped: {}, pendingReviews: [], lastBoard: null,
    endAt: 0, remaining: 0, paused: false, raf: 0
  });
  document.body.classList.remove("is-paused");
  renderMeters({});
}

const active = () => S.seats.filter(s => !s.fired);
const majority = () => Math.floor(active().length / 2) + 1;
const labelOf = p => p ? [p.act, p.when].filter(Boolean).join(", ") : "";

/* ---------- conditions ---------- */
function test(val, rule){
  if (rule === null || typeof rule !== "object") return val === rule;
  const ok = (op, f) => rule[op] === undefined || f(rule[op]);
  return ok("lt", r => val < r) && ok("lte", r => val <= r) && ok("gt", r => val > r)
      && ok("gte", r => val >= r) && ok("eq", r => val === r);
}
function matches(cond){
  if (!cond) return true;
  if (typeof cond === "function") return cond(S);
  for (const [k, r] of Object.entries(cond.meters || {})) if (!test(S.meters[k], r)) return false;
  for (const [k, r] of Object.entries(cond.flags || {})) {
    const v = S.flags[k] ?? (typeof r === "boolean" ? false : 0);
    if (!test(v, r)) return false;
  }
  return true;
}

/* ---------- effects ---------- */
function apply(eff){
  const changes = {};
  for (const [k, d] of Object.entries(eff.delta || {})) {
    if (!(k in S.meters)) continue;
    const before = S.meters[k];
    S.meters[k] = Math.max(0, Math.min(100, before + d));
    changes[k] = (changes[k] || 0) + (S.meters[k] - before);
  }
  for (const [k, v] of Object.entries(eff.flags || {})) {
    S.flags[k] = typeof v === "number" ? (S.flags[k] || 0) + v : v;
  }
  return changes;
}
function merge(a, b){ for (const k in b) a[k] = (a[k] || 0) + b[k]; return a; }
function fireDue(all = false){
  const fired = [], changes = {};
  S.queue = S.queue.filter(item => {
    if (all || item.due <= S.decisions) { merge(changes, apply(item)); fired.push(item); return false; }
    return true;
  });
  return { fired, changes };
}

/* ---------- board ---------- */
function fireSeat(id, reason){
  const s = S.seats.find(x => x.id === id);
  if (!s || s.fired) return;
  const r = GAME.outsiderRoles, out = S.seats.filter(x => x.fired).length;
  s.fired = true; s.reason = reason; s.role = r[out % r.length];
  s.firedAt = labelOf(S.current) || "Between decisions";
}
/* G key: the next fired member who hasn't leaked takes the last decision public */
function goPublic(){
  if (S.phase !== "result") return;
  const s = S.seats.find(x => x.fired && !x.leaked);
  if (!s) return;
  const last = S.history[S.history.length - 1];
  s.leaked = labelOf(last.prompt);
  last.leakedBy = s.role;
  const changes = apply(GAME.goPublic);
  renderMeters(changes);
  $("#resultSlot .result").insertAdjacentHTML("beforeend",
    `<div class="later"><strong>Leaked by the ${s.role.toLowerCase()}</strong>The board's decision is now public. ${deltaText(changes)}</div>`);
}

/* ---------- termination reviews ---------- */
function checkThresholds(){
  const th = GAME.termination.threshold;
  for (const k of Object.keys(GAME.meters)) {
    if (S.meters[k] >= th) S.tripped[k] = false;
    else if (!S.tripped[k]) { S.tripped[k] = true; S.pendingReviews.push(k); }
  }
}
function startReview(k){
  const T = GAME.termination, m = GAME.meters[k], seats = active();
  const owner = seats.find(s => s.id === m.owner) || seats[seats.length - 1];
  const options = seats.map((s, i) => ({
    key: LETTERS[i], text: s.title, fire: s.id, delta: T.delta,
    result: T.result(s, seats.length - 1)
  }));
  S.current = {
    id: "review-" + k, isReview: true, act: "Termination review", when: m.label,
    channel: "Office of the CEO",
    text: T.text({ label: m.label, value: S.meters[k] }),
    onTimeout: options.find(o => o.fire === owner.id).key,
    timeoutNote: T.timeoutNote(owner),
    source: T.source, options
  };
  S.seconds = T.seconds;
  S.phase = "reading";
  renderPrompt();
}

/* ---------- rendering ---------- */
function deltaText(changes){
  return Object.entries(changes).filter(([, d]) => d)
    .map(([k, d]) => `${GAME.meters[k].label} ${d > 0 ? "+" : ""}${d}.`).join(" ");
}
function renderMeters(changes){
  const th = GAME.termination.threshold;
  $("#meters").innerHTML = Object.entries(GAME.meters).map(([k, m]) => {
    const v = S.meters[k], c = changes[k];
    const chip = c ? `<span class="chip ${c > 0 ? "up" : "down"}" data-chip>${c > 0 ? "+" : ""}${c}</span>` : "";
    return `<div class="meter ${v < th ? "low" : ""}">
      <div class="row"><span>${m.label}${chip}</span>
      <span class="val">${GAME.showMeterNumbers ? v : ""}</span></div>
      <div class="bar"><div class="fill" style="width:${v}%;background:${m.color}"></div><i class="tick" style="left:${th}%"></i></div></div>`;
  }).join("") + boardTile();
  requestAnimationFrame(() => document.querySelectorAll("[data-chip]").forEach(c => c.classList.add("show")));
  renderPanel();
}
/* facilitator panel: hidden flags and consequences still waiting to land */
function renderPanel(){
  const flags = Object.entries(S.flags).map(([k, v]) =>
    `<dt>${GAME.flagLabels?.[k] || k}</dt><dd>${v === true ? "Yes" : v === false ? "No" : v}</dd>`).join("");
  const queue = S.queue.map(q => `<dt>in ${q.due - S.decisions}</dt><dd>${q.note || deltaText(q.delta || {}) || "(no note)"}</dd>`).join("");
  $("#facFlags").innerHTML = flags || "<dt>None yet</dt><dd></dd>";
  $("#facQueue").innerHTML = queue || "<dt>None</dt><dd></dd>";
}
function togglePanel(){
  const open = $("#facPanel").classList.toggle("open");
  $("#facBtn").setAttribute("aria-expanded", open);
}
function boardTile(){
  const n = active().length, c = n - (S.lastBoard ?? n);
  S.lastBoard = n;
  const chip = c ? `<span class="chip down" data-chip>${c}</span>` : "";
  const segs = S.seats.map(s => `<i class="${s.fired ? "out" : ""}" title="${s.title}${
    s.fired ? `: outside as ${s.role}${s.leaked ? ", went public" : ""}` : ""}"></i>`).join("");
  return `<div class="meter board ${n <= GAME.minBoard ? "low" : ""}">
    <div class="row"><span>Board${chip}</span><span class="val">${n}/${S.seats.length}</span></div>
    <div class="seats">${segs}</div></div>`;
}
function deltaList(changes){
  const parts = Object.entries(changes).filter(([, d]) => d).map(([k, d]) =>
    `<span>${GAME.meters[k].label} ${d > 0 ? "+" : ""}${d}</span>`);
  return parts.length ? `<div class="deltas">${parts.join("")}</div>` : "";
}
function votingHint(){
  const last = LETTERS[S.current.options.length - 1];
  return `${active().length} voting members, ${majority()} needed for a majority. Press A–${last}, or S for a split vote.`;
}

function showBriefing(){
  S.phase = "briefing";
  const pages = [].concat(GAME.briefing);
  const lastPage = S.briefPage >= pages.length - 1;
  screen.innerHTML = `<section class="panel">${pages[S.briefPage]}
    <button class="bigbtn" data-act="advance">${lastPage ? "Begin" : "Continue"}</button></section>`;
}

function nextPrompt(){
  let i = S.idx + 1;
  while (i < GAME.prompts.length && !matches(GAME.prompts[i].showIf)) i++;
  if (i >= GAME.prompts.length) return finish();
  S.idx = i; S.current = GAME.prompts[i]; S.phase = "reading";
  S.seconds = S.nextSeconds ?? S.current.seconds ?? GAME.defaultSeconds;
  S.nextSeconds = null;
  renderPrompt();
}

function renderPrompt(){
  const p = S.current;
  screen.innerHTML = `<section class="stage ${S.phase} ${p.isReview ? "review" : ""}">
    <div class="clock" id="timer"><div class="fill" id="timerFill"></div><span class="num" id="timerNum">${S.seconds}</span></div>
    <div class="stage-main">
      <p class="where">${labelOf(p)}</p>
      ${p.channel ? `<span class="channel">${p.channel}</span>` : ""}
      <p class="prompt-text">${p.text}</p>
      <div class="options">${p.options.map(o =>
        `<button class="opt" data-key="${o.key}" ${S.phase === "voting" ? "" : "disabled"}><b>${o.key}</b><span>${o.text}</span></button>`).join("")}
      </div>
      <div class="controls">
        <p class="hint" id="hint">Read the prompt aloud, then press Space or click the timer to start the clock.</p>
      </div>
      <div id="resultSlot"></div>
    </div></section>`;
}

function startClock(){
  S.phase = "voting";
  $(".stage").classList.replace("reading", "voting");
  document.querySelectorAll(".opt").forEach(b => b.disabled = false);
  $("#hint").textContent = votingHint();
  $("#timer").classList.add("running");
  S.remaining = S.seconds * 1000;
  S.endAt = performance.now() + S.remaining;
  tick();
}
function tick(){
  if (S.phase !== "voting") return;
  if (!S.paused) {
    const left = Math.max(0, S.endAt - performance.now());
    S.remaining = left;
    const frac = left / (S.seconds * 1000);
    $("#timerFill").style.transform = `scaleX(${frac})`;
    $("#timerNum").textContent = Math.ceil(left / 1000);
    $("#timer").classList.toggle("late", left <= 3000);
    if (left <= 0) return choose(S.current.onTimeout || S.current.options[0].key, "timeout");
  }
  S.raf = requestAnimationFrame(tick);
}
function togglePause(){
  if (S.phase !== "voting") return;
  S.paused = !S.paused;
  if (!S.paused) S.endAt = performance.now() + S.remaining;
  document.body.classList.toggle("is-paused", S.paused);
}

/* mode: null (the board chose), "timeout", or "split" */
function choose(key, mode = null){
  if (S.phase !== "voting") return;
  const p = S.current, opt = p.options.find(o => o.key === key);
  if (!opt) return;
  cancelAnimationFrame(S.raf);
  S.paused = false; document.body.classList.remove("is-paused");

  const changes = apply(opt);
  let later = { fired: [], changes: {} };
  if (!p.isReview) {
    S.decisions++;
    (opt.delayed || []).forEach(d => S.queue.push({ ...d, due: S.decisions + (d.after || 1), from: p.id }));
    later = fireDue();
    merge(changes, later.changes);
    if (opt.nextSeconds) S.nextSeconds = opt.nextSeconds;
  }
  S.history.push({ prompt: p, option: opt, mode });
  S.phase = "result";
  if (opt.fire) fireSeat(opt.fire, mode ? "Named by the CEO" : "Named by the board");

  const why = mode === "split" ? "The board split." : mode === "timeout" ? "Time ran out." : "";
  document.querySelectorAll(".opt").forEach(b => { b.disabled = true; b.classList.toggle("picked", b.dataset.key === key); });
  $("#hint").textContent = "Press Space to continue.";
  $(".controls").insertAdjacentHTML("beforeend", `<button class="bigbtn" data-act="advance">Continue</button>`);
  $("#resultSlot").innerHTML = `<div class="result">
    ${mode ? `<p class="timeout">${why} ${p.timeoutNote || ""}</p>` : ""}
    <h3>${opt.key}. ${opt.text}</h3>
    ${opt.result ? `<p>${opt.result}</p>` : ""}
    ${deltaList(changes)}
    ${later.fired.map(f => `<div class="later"><strong>An earlier decision catches up</strong>${f.note || ""}</div>`).join("")}
  </div>`;
  renderMeters(changes);
}

function afterResult(){
  const early = GAME.endings.find(e => e.early && matches(e.when));
  if (early) return showEnding(early);
  checkThresholds();
  if (S.pendingReviews.length) return startReview(S.pendingReviews.shift());
  nextPrompt();
}

function finish(){
  const late = fireDue(true);
  renderMeters(late.changes);
  const ending = GAME.endings.find(e => !e.early && matches(e.when));
  showEnding(ending, late);
}

function showEnding(ending, late){
  S.phase = "ending";
  const lateHtml = late && late.fired.length
    ? `<p><strong>Before the year closed:</strong></p>${late.fired.map(f => `<div class="result"><p>${f.note}</p></div>`).join("")}` : "";
  screen.innerHTML = `<section class="panel">
    <h1>${ending ? ending.title : "The end"}</h1>
    <p>${ending ? ending.text : ""}</p>${lateHtml}
    <button class="bigbtn" data-act="advance">Show the debrief</button></section>`;
}

function showDebrief(){
  S.phase = "debrief";
  const how = h => h.mode === "split" ? "<small class='timeout'>Split vote, default applied</small>"
                 : h.mode === "timeout" ? "<small class='timeout'>Chosen by timeout</small>" : "";
  const rows = S.history.map(h => `<tr>
      <td>${labelOf(h.prompt)}</td>
      <td>${h.option.key}. ${h.option.text}${how(h)}${h.leakedBy ? `<small>Leaked by the ${h.leakedBy.toLowerCase()}</small>` : ""}</td>
      <td>${h.prompt.source ? `${h.prompt.source.case}<small>${h.prompt.source.note || ""}</small>` : ""}</td></tr>`).join("");
  const board = S.seats.map(s => `<li><span>${s.title}</span><strong>${s.fired
      ? `${s.reason} (${s.firedAt}). Outside as ${s.role}${s.leaked ? `, went public on ${s.leaked}` : ""}.`
      : "Served to the end"}</strong></li>`).join("");
  const flags = Object.entries(S.flags).filter(([k]) => GAME.flagLabels[k]).map(([k, v]) =>
    `<li><span>${GAME.flagLabels[k]}</span><strong>${v === true ? "Yes" : v === false ? "No" : v}</strong></li>`).join("");
  screen.innerHTML = `<section class="panel" style="max-width:none">
    <h1>Debrief</h1>
    <p>Every decision the board made, and the real case it came from.</p>
    <div class="table-scroll"><table class="debrief">
      <thead><tr><th>When</th><th>The board chose</th><th>Drawn from</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    <h3 style="margin-top:40px">The board</h3><ul class="flags board-list">${board}</ul>
    ${flags ? `<h3 style="margin-top:40px">What the meters didn't show</h3><ul class="flags">${flags}</ul>` : ""}
    <button class="bigbtn" data-act="restart">Play again</button></section>`;
}

/* ---------- input ---------- */
function advance(){
  if (S.phase === "briefing") {
    if (S.briefPage < [].concat(GAME.briefing).length - 1) { S.briefPage++; showBriefing(); }
    else nextPrompt();
  }
  else if (S.phase === "reading") startClock();
  else if (S.phase === "result") afterResult();
  else if (S.phase === "ending") showDebrief();
}
function openGame(){
  $("#site").classList.remove("active"); $("#game").classList.add("active");
  window.scrollTo(0, 0); reset(); showBriefing();
}
function closeGame(){
  cancelAnimationFrame(S.raf); S.phase = "site";
  $("#game").classList.remove("active"); $("#site").classList.add("active");
}

$("#openPortal").addEventListener("click", openGame);
// close a nav dropdown after one of its links is clicked
document.querySelectorAll(".menu a").forEach(a => a.addEventListener("click", () => a.blur()));
$("#exitBtn").addEventListener("click", closeGame);
$("#facBtn").addEventListener("click", togglePanel);
screen.addEventListener("click", e => {
  if (e.target.closest("#timer") && S.phase === "reading") return startClock();
  const opt = e.target.closest(".opt");
  if (opt && !opt.disabled) return choose(opt.dataset.key);
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "advance") advance();
  if (act === "restart") { reset(); showBriefing(); }
});
document.addEventListener("keydown", e => {
  if (!$("#game").classList.contains("active")) return;
  if (e.target.closest?.("button") && (e.key === " " || e.key === "Enter")) e.target.blur();
  const k = e.key.toLowerCase();
  if (k === " " || k === "enter") { e.preventDefault(); advance(); }
  else if (k.length === 1 && "abcde".includes(k)) choose(k.toUpperCase());
  else if (k === "s" && S.phase === "voting") choose(S.current.onTimeout || S.current.options[0].key, "split");
  else if (k === "g") goPublic();
  else if (k === "p") togglePause();
  else if (k === "h") togglePanel();
  else if (k === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  else if (k === "r" && e.shiftKey) { reset(); showBriefing(); }
});