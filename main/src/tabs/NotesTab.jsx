import React from "react";
import {
  Activity, BookOpen, Briefcase, Clock, Download, Home, LayoutDashboard,
  Percent, PieChart, Scale, ShieldCheck, Split, Target, TrendingUp, User, Users,
} from "lucide-react";
import { LIFE_EVENT_TYPES } from "../config/constants.js";

// NotesTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function NotesTab({ inputs, projection, milestones, intersectionEscVsStd, intersectionStdVsBasic, intersectionEscVsBasic }) {
  return (
              <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 28, borderRadius: 24 }}>
                {/* Sticky wrapper: title + anchor nav scroll together as one bar */}
                <div id="docs-sticky-nav" style={{ position: "sticky", top: -20, zIndex: 20, background: "var(--bg-panel)", backdropFilter: "blur(8px)", marginLeft: -28, marginRight: -28, marginTop: -28, paddingLeft: 28, paddingRight: 28, paddingTop: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}><BookOpen style={{ width: 22, height: 22, color: "var(--clr-green)" }} />User Guide & Financial Analysis</h3>
                  {/* Anchor navigation */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 10 }}>
                  {[
                    ["#doc-guide", "📖 User Guide"],
                    ["#doc-engine", "⚙️ Projection Engine"],
                    ["#doc-policy", "🛡 Policy Reference"],
                    ["#doc-planning", "🎯 Planning Tools"],
                    ["#doc-srs", "💳 SRS"],
                    ["#doc-propmon", "🏠 Property Monetisation"],
                    ["#doc-dwz", "⏳ Die with Zero"],
                    ["#doc-sep", "💼 SEP Rules"],
                    ["#doc-yield", "📈 Yield & XIRR"],
                    ["#doc-montecarlo", "🎲 Monte Carlo"],
                    ["#doc-minor", "👶 Minor & PwD"],
                    ["#doc-eduloan", "🎓 Education Loan"],
                    ["#doc-rsgrowth", "📈 RS Growth Rate"],
                    ["#doc-phasedsalary", "💼 Phased Salary"],
                    ["#doc-lifeevents", "⚡ Life Events"],
                  ].map(([href, label]) => (
                    <a key={href} href={href} style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "var(--bg-input)", color: "var(--text-highlight)", border: "1px solid var(--border-strong)", textDecoration: "none", cursor: "pointer" }}
                      onClick={e => {
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (!target) return;
                        // Dynamically measure the sticky nav bar's actual rendered bottom so the
                        // scroll offset is always correct regardless of how many button rows wrap
                        // at the current viewport width. scrollIntoView({ block:'start' }) with a
                        // fixed scrollMarginTop fails when the bar wraps to 3+ rows (bar bottom ~176px
                        // but old scrollMarginTop was only 160px, hiding the section heading).
                        const stickyBar = document.getElementById('docs-sticky-nav');
                        const scrollEl = target.closest('.cpf-tab-content');
                        if (scrollEl && stickyBar) {
                          // delta = how far to scroll so target top lands just below sticky bar bottom
                          const delta = target.getBoundingClientRect().top
                                      - stickyBar.getBoundingClientRect().bottom
                                      - 8; // 8px breathing room below the bar
                          scrollEl.scrollBy({ top: delta, behavior: 'smooth' });
                        } else {
                          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}>
                      {label}
                    </a>
                  ))}
                  </div>
                </div>{/* end sticky wrapper */}
                <div style={{ display: "flex", flexDirection: "column", gap: 32, fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)" }}>

                  {/* User Guide */}
                  <section id="doc-guide">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-blue)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><LayoutDashboard style={{ width: 18, height: 18 }} />Step-by-Step User Guide</h4>
                    {[
                      ["1", "Setup Your Profile", "var(--clr-blue)", "rgba(var(--clr-blue2-rgb),0.08)", "rgba(var(--clr-blue2-rgb),0.2)", "Enter your current OA, SA, and MA balances. Select Male/Female (affects CPF LIFE payout ratio). Select SC or PR — PR members select their tenure year (1 / 2 / 3+) and rate type (G/G default or F/G). The engine automatically advances Yr 1 → Yr 2 → Yr 3+ rates each projection year. Progress bars compare balances against the 2026 FRS ($220,400), ERS ($440,800), and BHS ($79,000) milestones."],
                      ["2", "Auto-Calc Contributions (SC / PR / SEP)", "var(--clr-emerald)", "rgba(var(--clr-emerald-rgb),0.08)", "rgba(var(--clr-emerald-rgb),0.2)", "Enter OW (Monthly Gross), AW (Annual Bonus), and Salary Growth %, then click ⚡ Auto-Calc. SC uses full rates. PR G/G: graduated employer — no application needed. PR F/G: full employer 17%, employee pays graduated rate — requires joint CPF application. OW ceiling $8,000/mo, AW ceiling $102,000/yr. SEP members use the Inflows (VC3A) panel. Important: if citizenship is PR (Year 1 or 2) and Monthly Gross is left at $0, a validation warning will appear — the engine derives PR contributions from salary so gross pay must be entered before Auto-Calc can apply the correct rates."],
                      ["3", "Add Voluntary Top-Ups & CPF Transfers", "var(--clr-purple)", "rgba(var(--clr-purple-rgb),0.08)", "rgba(var(--clr-purple-rgb),0.2)", "Every inflow and outflow field has a Recurring / One-Time frequency toggle — use One-Time for lump sums that only apply in the first projection year. RSTU tops up SA (pre-55) or RA (post-55). CPF Transfers support For Self (internal move with FRS/ERS cap) and For Loved One (OA outflow only). CPFIS: OA above $20k and SA above $40k are investible separately with their own frequency toggles."],
                      ["4", "Compare CPF LIFE Plans", "var(--clr-amber)", "rgba(var(--clr-amber3-rgb),0.08)", "rgba(var(--clr-amber3-rgb),0.2)", "Open the LIFE Comparison tab to evaluate Standard, Escalating, and Basic plans. Vertical lines explicitly mark age intersections for total yield and payouts. Toggle between Bequest and Cumulative Payout views."],
                      ["5", "Save Scenarios & Compare", "var(--clr-orange)", "rgba(249,115,22,0.08)", "rgba(249,115,22,0.2)", "Go to the Compare tab. Save your current inputs as Scenario A, adjust parameters (e.g. delay payout age to 70), then save as Scenario B for a colour-coded side-by-side diff."],
                      ["6", "Share & Export", "#f43f5e", "rgba(244,63,94,0.08)", "rgba(244,63,94,0.2)", "Use Share to encode your entire profile into a URL. Download a PDF report or CSV. On mobile, all actions (Share, PDF, Export, Import, Samples, Reset) are in the ☰ hamburger menu. Keyboard shortcuts: Ctrl+S (Share), Ctrl+Shift+R (Reset), Ctrl+]/[ (switch tabs)."],
                      ["7", "Load a Sample Profile", "#0ea5e9", "rgba(14,165,233,0.08)", "rgba(14,165,233,0.2)", "Click Samples in the header (desktop) or ☰ hamburger menu (mobile) to choose from 7 pre-built scenarios: Blank Slate, Typical Employee (35), Late Starter (50), Self-Employed (40), High Earner (40), Near Retirement (54), and Post-55 RA Builder (57). Loading a sample overwrites current inputs — export your profile first."],
                      ["8", "Annual Cashflow Ledger", "#2dd4bf", "rgba(45,212,191,0.08)", "rgba(45,212,191,0.2)", "In the Data Table tab, switch to the Cashflow Ledger sub-tab for a complete year-by-year breakdown of every flow: mandatory contributions, voluntary top-ups, gov grants/WIS, OA/SA-RA/MA interest, housing outflow, medical, OA drawdown, loved-one transfers, and CPFIS — with a column totals row at the bottom. Download as CSV."],
                    ].map(([num, title, color, bg, border, text]) => (
                      <div key={num} style={{ background: "var(--bg-muted)", borderRadius: 14, border: "1px solid var(--border-strong)", overflow: "hidden", marginBottom: 12 }}>
                        <div style={{ background: bg, borderBottom: `1px solid ${border}`, borderLeft: `4px solid ${color}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 24, height: 24, borderRadius: "50%", background: bg, border: `1px solid ${border}`, color, fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{num}</span>
                          <h5 style={{ fontWeight: 700, color, fontSize: 14 }}>{title}</h5>
                        </div>
                        <div style={{ padding: "14px 18px", fontSize: 12, color: "var(--text-muted)" }}>{text}</div>
                      </div>
                    ))}
                  </section>

                  {/* ── Projection Engine ── */}
                  <section id="doc-engine">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-green)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Activity style={{ width: 18, height: 18 }} />Projection Engine — How the Numbers Are Computed</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Annual Loop Model:</strong> The engine runs one iteration per year of life, from your current age to age 95. Each iteration applies inflows, outflows, transfers, interest, and growth in a fixed sequence. This is a standard annual actuarial approximation — CPF Board's own simplified calculators use the same approach. A full monthly model (12× iterations, lowest-monthly-balance tracking) would be 12× slower with minimal practical difference for multi-decade projections.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Mid-Year (June) Interest Convention:</strong> Interest is computed on the <em>average</em> of the opening balance (before any inflows or outflows) and the closing balance (after all inflows and outflows). Formula: <code>Interest = ((Opening + Closing) / 2) × Annual Rate</code>. This gives each inflow approximately 6 months of interest and each outflow approximately 6 months of lost interest — matching the June actuarial mid-year convention and closely approximating CPF's actual rule (contributions earn from the month after receipt, withdrawals lose interest from the month they occur).</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Interest Rates & Bonus Tiers:</strong> OA: 2.5%/yr. SA, RA, MA: 4%/yr. <strong>Bonus tiers (also on average balance):</strong> +1% on the first $60,000 combined (OA capped at $20k). Members aged 55+: additional +1% on the first $30,000 of RA (priority), then SA+MA, then OA (up to $20k). These bonus tiers are computed on average balances using the same mid-year convention.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Recurring vs One-Time Frequency:</strong> Each inflow and outflow field has a Recurring / One-Time toggle. <strong>Recurring</strong> (stored as <code>'annual'</code> internally): the amount is applied every projection year until the relevant stop age. <strong>One-Time</strong>: the amount is applied only in the first year of the projection (the year you are currently at). Use One-Time for lump-sum top-ups, one-off withdrawals, or events that happen just once. The engine checks <code>isFirstYear</code> — if false and the field is One-Time, the effective amount is zeroed out for that year.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-orange)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>PR Tier Auto-Advancement:</strong> When citizenship is set to PR and tenure year is 1 or 2, the engine automatically advances the rate tier each projection year: Year 1 → Year 2 → Year 3+ (full rates). The <code>currentPrYear</code> counter increments at the end of each loop iteration and is capped at 3. Auto-Calc fills the Year 1 (or Year 2) contributions into the mandatory fields; the engine then advances automatically without further input.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f472b6", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>CPFIS Engine Enforcement:</strong> OA CPFIS: only OA above $20,000 is investible each year — engine caps to <code>Max(0, OA − $20,000)</code>. SA CPFIS: only SA above $40,000 is investible, and only before age 55 — SA CPFIS is silently skipped after 55 (SA is closed). Both deductions are accumulated into the annual Cashflow Ledger under "CPFIS Out." Investment returns on CPFIS funds are <strong>not modelled</strong> — only the outflow from CPF is applied.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>MRSS Engine Enforcement:</strong> The engine enforces all MRSS eligibility conditions automatically: <strong>SC only</strong> (PR members receive $0 regardless of input); <strong>age 55+</strong>; <strong>RA must be below the current-year BRS</strong> (inflation-adjusted at 3%/yr from 2026); and a <strong>$20,000 lifetime cap</strong> tracked via a cumulative counter. Once the lifetime cap is reached, no further MRSS is credited even if you enter a non-zero amount. The income gate (≤ $4,000/mo) uses the same monthly income variable as MMSS — for employees this is the OW-based gross; for SEPs it is NTI ÷ 12. The app validates these constraints in real time and shows warnings at the input field.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>MMSS Engine Enforcement:</strong> SC only; age 55–70; MA must be below half of BHS (inflation-adjusted). All three conditions are checked per year — if MA rises above the half-BHS threshold in a later year (e.g. due to MA top-ups), MMSS stops being credited automatically. The engine never applies MMSS outside the 55–70 age window.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-indigo)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Salary Growth:</strong> The engine applies compound salary growth (<code>gf = (1 + rate)^yearsElapsed</code>) to mandatory contributions and to PR-rate-derived contributions each year. The salary growth multiplier is displayed in the PR Tier Progression table in the Auto-Calc breakdown. OW ceiling ($8,000/mo) is enforced after growth is applied.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-red)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>What Is Not Modelled:</strong> CPFIS investment returns (only the outflow is tracked). Full monthly compounding and lowest-monthly-balance interest (annual approximation used). CPF LIFE insurance pool internals (payouts are calculated from an actuarial ratio applied to RA at payout age). Tax implications of SRS withdrawals (50% taxable shown as a note only). Means-tested government assistance schemes other than WIS, MRSS, and MMSS.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* CPF Policy Reference */}
                  <section id="doc-policy">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "#2dd4bf", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><ShieldCheck style={{ width: 18, height: 18 }} />CPF 2026 Policy Reference</h4>

                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", marginBottom: 16, overflowX: "auto" }}>
                      <h5 style={{ fontWeight: 700, color: "#2dd4bf", marginBottom: 12 }}>CPF Contribution Rates by Age (From 1 Jan 2026)</h5>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
                        <thead>
                          <tr style={{ background: "var(--bg-base)" }}>
                            <th style={{ padding: "8px", textAlign: "left", color: "var(--text-muted)", borderBottom: "1px solid var(--border-strong)" }}>Age Band</th>
                            <th style={{ padding: "8px", textAlign: "center", color: "var(--clr-blue)", borderBottom: "1px solid var(--border-strong)" }}>Total</th>
                            <th style={{ padding: "8px", textAlign: "center", color: "var(--text-highlight)", borderBottom: "1px solid var(--border-strong)" }}>Emp</th>
                            <th style={{ padding: "8px", textAlign: "center", color: "var(--text-highlight)", borderBottom: "1px solid var(--border-strong)" }}>Employer</th>
                            <th style={{ padding: "8px", textAlign: "center", color: "var(--clr-green)", borderBottom: "1px solid var(--border-strong)" }}>OA</th>
                            <th style={{ padding: "8px", textAlign: "center", color: "var(--clr-purple)", borderBottom: "1px solid var(--border-strong)" }}>SA</th>
                            <th style={{ padding: "8px", textAlign: "center", color: "#f472b6", borderBottom: "1px solid var(--border-strong)" }}>MA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["≤ 35", "37%", "20%", "17%", "23%", "6%", "8%"],
                            ["36 – 45", "37%", "20%", "17%", "21%", "7%", "9%"],
                            ["46 – 50", "37%", "20%", "17%", "19%", "8%", "10%"],
                            ["51 – 55", "37%", "20%", "17%", "15%", "11.5%", "10.5%"],
                            ["56 – 60", "34%", "17%", "17%", "12%", "11.5%", "10.5%"],
                            ["61 – 65", "25%", "13%", "12%", "3.5%", "11%", "10.5%"],
                            ["66 – 70", "16.5%", "7.5%", "9%", "1%", "5%", "10.5%"],
                            ["> 70", "12.5%", "5%", "7.5%", "1%", "1%", "10.5%"]
                          ].map(([age, tot, e1, e2, oa, sa, ma], i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                              <td style={{ padding: "8px", fontWeight: 700, color: "var(--text-highlight)" }}>{age}</td>
                              <td style={{ padding: "8px", textAlign: "center", color: "var(--clr-blue)", fontWeight: 800 }}>{tot}</td>
                              <td style={{ padding: "8px", textAlign: "center", color: "var(--text-muted)" }}>{e1}</td>
                              <td style={{ padding: "8px", textAlign: "center", color: "var(--text-muted)" }}>{e2}</td>
                              <td style={{ padding: "8px", textAlign: "center", color: "var(--clr-green)" }}>{oa}</td>
                              <td style={{ padding: "8px", textAlign: "center", color: "var(--clr-purple)" }}>{sa}</td>
                              <td style={{ padding: "8px", textAlign: "center", color: "#f472b6" }}>{ma}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="docs-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)" }}>
                        <h5 style={{ fontWeight: 700, color: "#2dd4bf", marginBottom: 12 }}>2026 Retirement Sum Thresholds</h5>
                        {[["Basic Retirement Sum (BRS)", "$110,200", "Minimum RA at 55", "var(--clr-amber)"], ["Full Retirement Sum (FRS)", "$220,400", "Standard RA target; 2× BRS", "var(--clr-green)"], ["Enhanced Retirement Sum (ERS)", "$440,800", "Maximum RA top-up; 4× BRS", "var(--clr-blue)"], ["Basic Healthcare Sum (BHS)", "$79,000", "MA cap; excess flows to SA/RA", "var(--clr-violet)"]].map(([label, val, note, color]) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
                            <div><p style={{ color: "var(--text-highlight)", fontWeight: 600, fontSize: 12 }}>{label}</p><p style={{ color: "var(--text-muted)", fontSize: 10 }}>{note}</p></div>
                            <span style={{ color, fontWeight: 900, fontSize: 14, flexShrink: 0, marginLeft: 10 }}>{val}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)" }}>
                        <h5 style={{ fontWeight: 700, color: "#2dd4bf", marginBottom: 12 }}>CPF Interest Rates</h5>
                        {[["OA", "2.5% p.a.", "Guaranteed floor rate"], ["SA", "4.0% p.a.", "Long-term savings rate"], ["MA", "4.0% p.a.", "Same as SA"], ["RA", "4.0% p.a.", "Retirement Account after 55"], ["Extra (first $60k)", "+1.0% p.a.", "Combined balances; OA capped $20k"], ["Extra 55+ (first $30k)", "+1.0% p.a.", "Additional bonus for 55+ members"]].map(([label, val, note]) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
                            <div><p style={{ color: "var(--text-highlight)", fontWeight: 600, fontSize: 12 }}>{label}</p><p style={{ color: "var(--text-muted)", fontSize: 10 }}>{note}</p></div>
                            <span style={{ color: "var(--clr-green)", fontWeight: 900, fontSize: 14, flexShrink: 0, marginLeft: 10 }}>{val}</span>
                          </div>
                        ))}
                        {/* Timing Assumption box */}
                        <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: 8 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#2dd4bf", marginBottom: 6 }}>⏱ Computation Timing Assumption</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 4 }}>
                            This model uses an <strong style={{ color: "var(--text-bright)" }}>annual, beginning-of-year (BOY) convention</strong>:
                          </p>
                          <ul style={{ fontSize: 10, color: "var(--text-muted)", paddingLeft: 14, lineHeight: 1.7, margin: 0 }}>
                            <li><strong style={{ color: "var(--text-bright)" }}>Step 1 — Transitions:</strong> Age-55 SA closure, pledge withdrawal, and OA withdrawal are applied at the start of the age-55 year, before contributions or interest.</li>
                            <li><strong style={{ color: "var(--text-bright)" }}>Step 2 — Contributions & inflows:</strong> All annual contributions (mandatory, VC3A, RSTU, grants, WIS) are credited at the start of each year.</li>
                            <li><strong style={{ color: "var(--text-bright)" }}>Step 3 — Interest:</strong> Interest is calculated on the <em>opening balance after contributions</em> for each account and credited for the full year.</li>
                            <li><strong style={{ color: "var(--text-bright)" }}>Step 4 — Outflows:</strong> Housing loan deductions and medical expenses are deducted after interest is applied.</li>
                            <li><strong style={{ color: "var(--text-bright)" }}>Step 5 — Record:</strong> End-of-year balances are recorded in the Data Table and charts.</li>
                          </ul>
                          <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 6 }}>In practice CPF credits interest monthly (OA) and annually (SA/MA/RA). This model simplifies to annual compounding, which is a standard actuarial approximation. The difference from monthly compounding is less than 0.2% per year.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* New Planning Tools Policy Reference */}
                  <section id="doc-planning">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-blue)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Target style={{ width: 18, height: 18 }} />Planning Tools — Policy Reference <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>(Assumptions)</span></h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Gender &amp; CPF LIFE Payout Ratio:</strong> Male members receive ~$540/mo per $100k RA at 65; female members ~$500/mo, reflecting longer female life expectancy. CPF LIFE payouts increase by up to 7% compound per year of deferral past 65 — approximately $37/mo per year for a $540 base, giving ~$730/mo at age 70. Select gender in the Profile section — the LIFE comparison cards highlight the selected gender and show both for reference.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>20% RA-to-OA Transfer:</strong> At payout age, CPF transfers 20% of the <em>eligible</em> RA to OA. Eligible RA = RA at payout − cumulative SA/RA cash top-ups (RSTU, gov grants, MRSS, MMSS, housing grants, all voluntary SA/RA top-ups) − cumulative interest earned on SA/RA. <strong>CPF LIFE payouts are calculated on the RA remaining after this transfer</strong> — the deducted 20% reduces the RA balance and lowers monthly payouts accordingly. The Summary tab shows all components.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>OA → SA / OA → RA Transfer:</strong> Before age 55: transfer OA savings to SA, capped at FRS. At age 55 and above: SA is closed; you may instead transfer OA savings to RA, capped at ERS ($440,800 in 2026). Both directions earn 4% instead of 2.5%. All transfers are irreversible. Not counted toward the Annual Limit. CPF-to-CPF transfers do NOT qualify for income tax relief — only voluntary cash top-ups under RSTU are tax-relievable. Available in the <strong>CPF Transfers panel</strong>.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>OA → MA Transfer:</strong> Transfer OA savings to MA to earn 4% instead of 2.5%, or to top up MA towards BHS. Subject to BHS cap. Irreversible. Available in the CPF Transfers panel.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f472b6", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>CPFIS — CPF Investment Scheme:</strong> Annual amounts moved from OA and/or SA into investments. OA: only savings <strong>above $20,000</strong> are investible (the first $20k must stay in OA). SA: only savings <strong>above $40,000</strong> are investible, and SA CPFIS is only available before age 55 (SA closes at 55). You can invest from both accounts simultaneously. Investment returns are <strong>not</strong> modelled — only the cash outflows from OA and SA are applied. Age 18+. Available in the Outflows panel.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-emerald)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>VC3A — Cash Only, Auto-Split:</strong> Voluntary Contribution to 3 Accounts is cash-only — you cannot split existing CPF balances across accounts via VC3A. Enter a single annual lump-sum in the Inflows panel; the engine automatically allocates it across OA/SA/MA using your age-band rates. Counts toward the $37,740 Annual Limit. <strong>No tax relief</strong> for employees. SEPs can use VC3A up to the full $37,740/yr.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>RSTU — Cash Top-ups and CPF Transfers:</strong> The Retirement Sum Topping-Up Scheme allows both (1) cash top-ups to SA/RA (tax-relievable up to $8,000/yr own + $8,000 for loved ones; capped at FRS for SA or ERS for RA) and (2) CPF OA→SA/RA transfers (no tax relief — CPF-to-CPF transfers do not qualify). Enter cash top-ups in the Inflows panel (RSTU field); enter CPF transfers in the CPF Transfers panel.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-emerald)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>MMSS — Matched MediSave Scheme (1 Jan 2026 – 31 Dec 2030):</strong> A five-year pilot where the government matches voluntary cash MA top-ups dollar-for-dollar up to <strong>$1,000/year</strong>. Eligibility (assessed as at 31 Dec each year): Singapore Citizens aged 55–70, MA balance below half of BHS (~$39,500 in 2026), average monthly income ≤ $4,000, own no more than one property with AV ≤ $21,000. Pilot runs from 1 January 2026 to 31 December 2030 — the engine enforces both the 2026 start and 2030 end bounds. Matching grant is credited to MA at the <strong>beginning of the following year</strong> (e.g. top-ups made in 2026 are credited in January 2027). The engine models this one-year carry correctly. Cash top-ups attracting MMSS match are <strong>not eligible</strong> for income tax relief.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>WIS — Workfare Income Supplement:</strong> For employees: 60% of the WIS award goes to CPF accounts allocated via age-band rates (OA/SA/MA), and 40% is paid as cash (not modelled). For SEPs: 90% goes to MA (subject to BHS cap) and 10% cash. Enter your annual WIS award amount in the Inflows panel — only the CPF portion is applied.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>OA Lump-Sum Withdrawal at Age 55:</strong> After SA closure and RA funding, members may withdraw OA savings above BRS as cash. Applied once. Input in the <strong>Outflows panel</strong>. Note: this is for general OA cash-out — for Property Pledge withdrawals, use the separate <strong>Pledge RA Withdrawal</strong> fields (shown in Property & Timelines when pledge is ON).</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>OA Drawdown (Decumulation):</strong> After CPF LIFE starts, members may supplement monthly income by drawing down the OA balance. The engine deducts the monthly draw annually, respects the bequest floor (OA never falls below the floor), and shows the projected <strong>OA Exhaustion Age</strong>. A sustainability warning fires when the annual draw exceeds the annual OA interest (2.5%), meaning principal is being eroded. Use <strong>⚡ Fill Gap</strong> in the OA Drawdown panel to automatically calculate the draw amount needed to reach your Target Monthly Income (Target − CPF LIFE − SRS − Private Assets). OA drawdown does not affect RA or CPF LIFE payouts.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-orange)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Property Pledge (BRS Mode):</strong> Use your property as security so only BRS ($110,200) needs to remain in RA at age 55. This makes you <em>eligible</em> to apply to CPF to withdraw RA savings above BRS as cash to your bank account — the pledged funds remain in RA (earning 4%) until the actual withdrawal is made. <strong>Important:</strong> Pledging does not automatically transfer funds to OA or anywhere else. To model the cash withdrawal in this tool, use the <strong>Pledge RA Withdrawal</strong> fields (Amount and Age) in the Outflows panel — these appear automatically when the Property Pledge toggle is ON. The funds are withdrawn directly from RA, not via OA. Property must be a completed Singapore property (HDB or private) with a remaining lease lasting to at least age 95. HDB 2-room Flexi flats and properties under the Lease Buyback Scheme are ineligible. If the property is sold, the pledged amount must be refunded to CPF. Monthly CPF LIFE payouts will be significantly lower (~$730–$790/mo vs ~$1,350–$1,450/mo at FRS) because less RA enters the LIFE pool.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-emerald)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Property CPF Refund on Sale:</strong> When you sell your HDB or private property, CPF Board requires you to refund the CPF Ordinary Account monies used for housing — including the principal withdrawn and the accrued interest at the OA rate of 2.5%/yr from the time of each withdrawal. The refund is credited back to your OA. If a Property Pledge was active (only BRS held in RA at 55), the refund first restores RA up to FRS; any surplus stays in OA. ERS top-up from OA is always optional. Model this using the <strong>Sell Property at Age</strong> field in Timelines &amp; Property.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>MRSS — Matched Retirement Savings Scheme:</strong> Government matches RSTU cash top-ups to RA dollar-for-dollar up to $2,000/year (lifetime cap $20,000) for Singapore Citizens aged 55 and above (or any age if PwD is enabled) with RA below the Basic Retirement Sum (BRS) and monthly income ≤ $4,000. Automatically assessed — no application needed. <strong>No separate input required</strong>: the engine computes the MRSS match automatically each projection year based on your RSTU entry and eligibility conditions. An MRSS eligibility badge appears under the RSTU field in the Inflows panel showing the auto-credited amount. The $20,000 lifetime cap is tracked cumulatively across all projection years.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>AW Ceiling ($102,000/Year):</strong> AW Ceiling = $102,000 − Total Ordinary Wages subject to CPF for the year (not the CPF contributions themselves). E.g. if your annual OW subject to CPF is $96,000 ($8,000/mo × 12), the AW ceiling is $6,000. The Auto-Calc applies this correctly.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-violet)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>CPF LIFE — Eligibility:</strong> CPF LIFE is available to <strong>Singapore Citizens and Permanent Residents</strong> born in <strong>1958 or after</strong>. Members with <strong>RA ≥ $60,000</strong> at their payout age are automatically enrolled; those below $60,000 may apply to join voluntarily. Payout start age is between 65 and 70 — deferring earns approximately <strong>+7% per year</strong> of additional monthly payout. Payouts are for life regardless of how long you live. This tool's projections assume CPF LIFE enrolment; members with very low RA balances may not qualify for auto-enrolment.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* SRS */}
                  <section id="doc-srs">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0ea5e9", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><BookOpen style={{ width: 18, height: 18 }} />Supplementary Retirement Scheme (SRS)</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>What it is:</strong> SRS is a voluntary government-administered scheme that lets you save for retirement with immediate tax benefits. Contributions are deducted from your chargeable income in the year made — reducing your personal income tax bill.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Annual contribution cap:</strong> Singapore Citizens and PRs: <strong>$15,300/yr</strong>. Foreigners: <strong>$35,700/yr</strong>. Contributions are made to your SRS account at a participating bank (DBS, OCBC, UOB) and can be invested in stocks, ETFs, unit trusts, fixed deposits, and insurance products.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--clr-green)" }}>Withdrawal rules:</strong> You can begin withdrawing from age 63 (statutory retirement age). <strong>Only 50% of each withdrawal is taxable</strong> — the other 50% is tax-free. All funds must be fully withdrawn within <strong>10 years</strong> of your first withdrawal; failure to do so triggers a 5% penalty on the undistributed balance, and the full amount becomes taxable.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Premature withdrawal:</strong> Withdrawing before age 63 incurs a <strong>5% penalty</strong> plus full taxation on the withdrawn amount. Exceptions apply for death, medical grounds, and bankruptcy.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>How this tool models SRS:</strong> Enter your current SRS balance, annual contribution amount, the age you plan to stop contributing, your expected return rate (%), the age you plan to start withdrawing (min 63), and the drawdown window (1–10 years). The engine grows contributions at your chosen rate and divides the balance evenly over the drawdown window. The monthly draw appears in the Strategy tab income table. The Die with Zero panel uses the PMT formula on the SRS balance separately.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>SRS vs CPF SA/RA:</strong> SRS is more flexible (you can invest freely and withdraw early with penalty), but unlike CPF SA/RA it earns bank-rate interest if left uninvested (often 0.05% p.a.), so the onus is on you to invest the funds. The tax savings from contributions can be significant for high earners — at a 22% marginal rate, a $15,300 contribution saves ~$3,366 in tax annually.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Property Monetisation */}
                  <section id="doc-propmon">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-orange)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Home style={{ width: 18, height: 18 }} />Property Monetisation</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-orange)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>What it covers:</strong> Three main approaches to unlocking value from your home in retirement: (1) <strong>Downgrading</strong> — sell your current home and buy a smaller/cheaper one, pocketing the difference as cash; (2) <strong>Lease Buyback Scheme (LBS)</strong> — sell a portion of your HDB flat's remaining lease back to HDB in exchange for a lump-sum annuity premium deposited into your CPF RA plus a cash bonus; (3) <strong>Silver Housing Bonus (SHB)</strong> — downgrade to a 3-room or smaller flat and receive a cash bonus plus a CPF RA top-up of up to $30,000.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--clr-green)" }}>Net Cash Proceeds:</strong> Enter the amount that actually reaches your bank account <em>after</em> deducting the cost of your replacement home, CPF housing refund (principal + accrued interest), agent fees, and stamp duty. This sum is credited to your private assets in the projection and earns your chosen private growth rate from that point forward.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>RA Top-up Component:</strong> For LBS, the annuity premium HDB pays to your RA to fund the monthly LBS payout. For SHB, the CPF portion of the bonus (up to $30,000). Enter this amount in the RA Top-up field — it is credited directly to RA and increases your CPF LIFE payouts. For a standard open-market downgrade with no scheme, leave this at $0.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Monetisation Age:</strong> Set to the age at which the event occurs. The tool models this as a one-time event — property value is removed from your net worth at this age (if Sell Property at Age is also set) and the cash proceeds / RA top-up are applied in the same year. The Strategy tab income table shows the cash proceeds as a one-time income line.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>How to use in this tool:</strong> Enable the toggle in the <strong>Property &amp; Timelines → Property Monetisation</strong> panel. Select the scheme type, set the age, enter Net Cash Proceeds and RA Top-up. The cash proceeds grow at your private asset growth rate from the monetisation age onward and appear as a supplemental income source in the Strategy tab.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Die with Zero */}
                  <section id="doc-dwz">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "#f43f5e", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Clock style={{ width: 18, height: 18 }} />Die with Zero Mode</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f43f5e", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>The concept:</strong> Based on Bill Perkins' <em>Die with Zero</em> — the idea that unspent wealth at death is unlived life. Rather than preserving capital indefinitely, this mode computes the mathematically optimal monthly draw from each liquid asset so that all balances reach exactly $0 at your chosen target age. RA and CPF LIFE are excluded — they are governed by CPF Board rules and cannot be freely depleted.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--clr-green)" }}>The PMT formula:</strong> For each liquid asset (OA, SRS, Private Assets), the tool solves for the fixed periodic payment that depletes the balance to $0 over the remaining years, factoring in the asset's interest/growth rate. The formula is: <strong>Monthly Draw = PV × r / (1 − (1+r)^−n) / 12</strong>, where PV = balance at drawdown start, r = annual rate, n = years to depletion. If r = 0, the draw is simply PV / (n × 12).</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>SRS constraint:</strong> IRAS requires full SRS withdrawal within 10 years of first withdrawal. If your Die with Zero target age exceeds the 10-year SRS window, a warning is shown and the SRS draw is calculated over the 10-year window regardless.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>MA cannot be depleted:</strong> MediSave Account funds are ring-fenced by CPF Board for approved medical expenses, MediShield Life premiums, and CareShield Life premiums. They cannot be freely drawn down and are not included in the Die with Zero calculation.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>How to use:</strong> Toggle <strong>Die with Zero</strong> in the <strong>Decumulation &amp; Goals</strong> panel. Set your target depletion age (e.g. 85 or 90). The OA draw is computed via PMT annuity formula and <strong>auto-applied to the projection immediately</strong> — no extra button press required. The panel shows the computed monthly draws per asset (OA, SRS, Private, CPF LIFE) and a green ✓ badge confirms the draw is active. The OA Drawdown sidebar dims and locks while Die with Zero is ON.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Self-Employed Policy */}
                  <section id="doc-sep">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-orange)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Briefcase style={{ width: 18, height: 18 }} />Self-Employed Person (SEP) — VC3A Rules</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-orange)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>No Mandatory OA/SA Contributions:</strong> SEPs are not required to contribute to OA or SA. Only MA contributions are compulsory if net trade income exceeds $6,000/year (at the employee rate).</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-orange)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>VC3A Annual Limit — $37,740:</strong> SEPs may voluntarily contribute up to $37,740/year (the CPF Annual Limit) into their CPF accounts. This is the same as the total mandatory + voluntary ceiling for employees.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--clr-green)" }}>Proportional Allocation (CPF Board Policy):</strong> Per CPF Board: <em>"The allocation of VC to the three CPF accounts will follow the allocation rates for mandatory CPF contributions."</em> VC3A funds are split across OA/SA/MA using the same <strong>age-based ratios</strong> as mandatory contributions (e.g. age ≤35: OA 62.2%, SA 16.2%, MA 21.6% of total). MA excess above BHS spills to SA (if &lt;55) or RA (if ≥55), but only up to the Full Retirement Sum (FRS). Once SA/RA hits the FRS, any remaining MA excess flows to OA. This is NOT a waterfall to MA first.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Tax Relief:</strong> VC3A contributions qualify for tax relief under the CPF Relief for Self-Employed scheme, subject to the prevailing income tax rules.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>How to Use in This Tool:</strong> Toggle <strong>SEP?</strong> in the Mandatory Contribs panel. Mandatory OA/SA inputs are hidden. Enter your desired annual VC3A amount in the Voluntary Top-ups panel — the engine splits funds proportionally across OA/SA/MA using your age-band allocation rates (same ratios as mandatory contributions). MA excess above BHS spills to SA/RA. For members aged 55+, SA is permanently closed — VC3A contributions that would go to SA are routed to RA instead, up to the Full Retirement Sum (FRS); once FRS is met, excess flows to OA.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Monte Carlo + Actuarial Math */}
                  <section id="doc-montecarlo">
                    {/* ── Monte Carlo ── */}
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-violet)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Activity style={{ width: 18, height: 18 }} />Monte Carlo Simulation</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
                      <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text-highlight)" }}>What it does:</strong> Monte Carlo runs your entire retirement projection <strong style={{ color: "var(--text-bright)" }}>200 times</strong> in parallel. Each run uses the same inputs you entered, but CPF interest rates are randomly varied each year by a user-selectable band. This produces a realistic spread of outcomes rather than a single deterministic line.</p>
                      <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text-highlight)" }}>How to enable:</strong> Go to the <strong>Accumulation</strong> tab and click the <strong>Show Monte Carlo (200 runs)</strong> button. A purple shaded band appears on the chart alongside three overlay lines.</p>
                      <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text-highlight)" }}>Variance presets:</strong> Three preset buttons appear below the Monte Carlo toggle — <strong style={{ color: "var(--clr-blue)" }}>Mild ±0.5%</strong> (stable rate environment), <strong style={{ color: "var(--clr-violet)" }}>Base ±1%</strong> (default, moderate uncertainty), and <strong style={{ color: "var(--clr-red)" }}>Stress ±2%</strong> (volatile rates). The active preset is displayed on the Probability of Sufficiency badge (e.g. "±1% rate variance"). Under Base, OA could earn 1.5%–3.5% and SA/RA/MA could earn 3%–5% in any given year.</p>
                      <p style={{ marginBottom: 12 }}><strong style={{ color: "var(--text-highlight)" }}>Reading the band:</strong></p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                        {[
                          ["P90 — Optimistic", "Top edge of the purple band. 90% of simulations fell below this value — only 10% of runs produced an outcome this good or better. Treat as a best-case ceiling.", "var(--clr-violet)"],
                          ["P50 — Median (dashed)", "The dashed purple line running through the band. Half of all 200 runs landed above this, half below. This is the most likely single-number outcome under rate uncertainty.", "#c4b5fd"],
                          ["P10 — Pessimistic", "Bottom edge of the band. 90% of simulations did better than this. Only 1 in 10 runs produced an outcome this low. Treat as a stress-test floor.", "var(--clr-purple2)"],
                        ].map(([title, desc, color]) => (
                          <div key={title} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(var(--clr-purple2-rgb),0.07)", border: `1px solid ${color}55` }}>
                            <p style={{ fontWeight: 700, color, marginBottom: 6, fontSize: 11 }}>{title}</p>
                            <p style={{ fontSize: 11, lineHeight: 1.5 }}>{desc}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text-highlight)" }}>Probability of Sufficiency:</strong> Shown as a large percentage badge when Monte Carlo is active. It answers: <em>"What share of my 200 simulated futures reached the projected FRS by payout age?"</em> A result of <strong style={{ color: "var(--clr-green)" }}>80%+</strong> suggests a robust plan. Below <strong style={{ color: "var(--clr-red)" }}>50%</strong> means more than half your simulated futures fell short — consider increasing top-ups or deferring payout age.</p>
                      <p style={{ marginBottom: 0 }}><strong style={{ color: "var(--text-highlight)" }}>Limitations:</strong> Only CPF interest rates are randomised. Salary growth, contribution amounts, housing outflows, and SRS returns remain fixed at your inputs. Monte Carlo here measures <em>rate risk only</em> — it does not model job loss, medical crises, or policy changes. For those scenarios, use the What-If Explorer in the Summary tab.</p>
                    </div>

                    {/* ── Actuarial Math (kept here — content still relevant to CPF LIFE analysis) ── */}
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--clr-orange)", marginBottom: 10, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}><PieChart style={{ width: 16, height: 16 }} />Actuarial Math & Depletion Models</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue2)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Age-Adjusted Actuarial Ratio:</strong> This engine uses ~$540 per $100k RA at age 65, scaling by 7% compound per year of deferral — approximately $730/mo at age 70. Correctly applies CPF Board deferral credit. Correctly applies deferral credit without double-counting standard interest.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-emerald)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Standard & Escalating (Full Premium):</strong> 100% of your RA deducted. Bequest tracked as <code>Premium - Payouts</code>. Pool absorbs the 4% interest.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber3)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--clr-orange)" }}>Basic Plan (The Slow-Draw):</strong> A premium is deducted from RA and paid into CPF's insurance pool. <strong>Note: The Basic Plan premium % is not user-configurable</strong> — it is set by CPF Board actuaries based on your age and gender to fund the mortality pool from age 90. It typically lands between 10% and 20%. The slider in this tool is an approximation aid only. You retain the remainder in your personal RA earning 4%. The monthly payout equals the PMT from the standard annuity formula — this is also the rate at which your personal RA depletes to $0 around age 90. <strong>Bequest Phase 1 (before age 90)</strong> = remaining personal RA balance <em>plus</em> a full refund of the CPF LIFE premium. <strong>Bequest Phase 2 (age 90+)</strong> = unused pool premium after deducting all payouts funded from the pool since age 90. Higher premium % → larger pool, smaller retained RA, lower Phase 1 payout.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Bonus Interest Cascading:</strong> +1% on first $60k combined (OA capped $20k), plus extra +1% on first $30k for 55+. Early contributions compound dramatically over decades.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Minor Members & PwD */}
                  <section id="doc-minor">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-green)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Users style={{ width: 18, height: 18 }} />Minor Members &amp; Person with Disabilities (PwD)</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Under 16 — Parent/Guardian Managed:</strong> CPF accounts for members under 16 are administered by a parent or guardian. Cash top-ups to SA and MA (VC3A, RSTU, VCMA), and OA→SA/RA transfers are supported. CPF nominations require age 16+. CPFIS requires age 18+. The app locks cash top-up fields and shows a field-level note when current age is below 16.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Age 16–17 — Nominations Available, CPFIS Locked:</strong> Members aged 16 and above may make a CPF nomination to direct their CPF savings to nominees on death. CPFIS remains locked until age 18. The sidebar shows an info note in this age range, and the CPFIS field is disabled.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber3)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>MRSS PwD Bypass (age &lt; 55):</strong> The Matched Retirement Savings Scheme (MRSS) normally requires age 55+. Members certified as a Person with Disabilities (PwD) by an approved medical professional are exempt from this age requirement and may receive MRSS matching at any age, subject to all other eligibility criteria (SC only, RA/OA+SA below BRS, income ≤ $4,000/mo, lifetime cap $20,000). Enable the <strong>PwD toggle</strong> in the Profile section. The MRSS match badge under RSTU will reflect eligibility automatically.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Engine Enforcement Summary:</strong> VC3A/RSTU/VCMA cash top-ups blocked below age 16. CPFIS OA and SA blocked below age 18. MRSS blocked below age 55 unless PwD flag is set. MMSS enforced to age 55–70 window and 2030 pilot end. All gates apply automatically — no manual overrides needed.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Education Loan */}
                  <section id="doc-eduloan">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-indigo)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><BookOpen style={{ width: 18, height: 18 }} />OA Education Loan Scheme</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-indigo)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>What It Is:</strong> The CPF Education Loan Scheme allows you (or an immediate family member) to use OA savings to pay subsidised tuition fees at approved local institutions — NUS, NTU, SMU, SIT, SUTD, SUSS, polytechnics, LASALLE, and NAFA. The loan accrues 2.5%/yr interest from the date of each withdrawal.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Withdrawal Limit:</strong> Maximum 40% of accumulated OA savings (current balance plus any OA amounts previously used for education or investment, excluding housing). The app enforces this cap and shows a validation warning if the entered amount exceeds it.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber3)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Age 55+ Rule:</strong> Members aged 55 and above must first set aside the Full Retirement Sum (FRS) in their RA before any OA education withdrawal is permitted. The engine enforces this automatically.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f43f5e", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Repayment — Not Modelled:</strong> In reality, the graduate must repay the loan in cash within 12 years of graduation, starting 1 year after. The app models the withdrawal as a pure OA outflow only — repayments back to OA are not projected. This produces a conservative (lower) OA trajectory. Plan accordingly.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>How to Use:</strong> Enter the annual loan amount in the <strong>OA Education Loan</strong> field in the Outflows section. Use the frequency toggle to select Recurring (e.g. annual draw over a 3-year course) or One-Time (single lump-sum).</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* ── Retirement Sum Growth ── */}
                  <section id="doc-rsgrowth">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-green)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp style={{ width: 18, height: 18 }} />Retirement Sum Growth Rate</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-green)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>What it controls:</strong> Every year CPF Board typically raises the Full Retirement Sum (FRS), Basic Retirement Sum (BRS), Enhanced Retirement Sum (ERS), and Basic Healthcare Sum (BHS) by approximately 3%. This field lets you override that assumption — raising it makes future targets harder to reach; lowering it makes them easier. The change cascades through all projection years: contribution stop checks, CPFIS investible limits, MRSS BRS eligibility, and the accumulation chart lines all use this rate.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Where to find it:</strong> Salary section of the left panel, below Salary Growth Rate. Preset buttons: <strong>2%</strong> (conservative), <strong>3%</strong> (base / CPF Board historical average), <strong>4%</strong> (optimistic / inflation-driven). Valid range: 0–10%. Values above 6% show an advisory warning.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-amber3)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Practical use:</strong> Run the same profile at 2%, 3%, and 4% to bracket your FRS target uncertainty. A member who comfortably hits FRS at 3% but misses at 4% should consider increasing top-ups or deferring payout age to build in a buffer.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* ── Phased Salary & Career Break ── */}
                  <section id="doc-phasedsalary">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-orange)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Briefcase style={{ width: 18, height: 18 }} />Phased Salary &amp; Career Break</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-orange)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Phase 2 Salary Growth:</strong> Enter a <strong>Phase 2 Start Age</strong> and a <strong>Phase 2 Growth %</strong> in the Salary section. Before that age, contributions compound at Phase 1 growth rate (Salary Growth %). From that age onward, they compound at Phase 2 rate. Example: 4%/yr to age 45 then 1%/yr models a mid-career plateau. Setting Phase 2 rate to 0% models a frozen salary from that age.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f43f5e", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Career Break:</strong> Enter a <strong>Break Start Age</strong> and <strong>Break End Age</strong>. During those years (inclusive), the salary growth factor drops to zero — mandatory contributions pause entirely, as if salary is $0. This models sabbaticals, full-time caregiving, national service commitments, or parental leave. Both OA/SA/MA mandatory contributions and the employer component are paused.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Stacking:</strong> Phase 2 and Career Break can be used together. Example: Phase 2 starts at 40 (1%/yr), Career Break at 43–45 (contributions paused), then Phase 2 resumes at 46. The engine handles all three periods correctly using the same compounding formula as the base salary growth.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Auto-Calc note:</strong> The ⚡ Auto-Calc button computes Year 1 contributions only, using Phase 1 rates. It does not attempt to preview Phase 2 or break years — those are modelled automatically in the projection engine. An advisory note appears in the Auto-Calc panel when Phase 2 or a Career Break is active.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* ── Life Events / Stress Testing ── */}
                  <section id="doc-lifeevents">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "#ef4444", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Activity style={{ width: 18, height: 18 }} />Life Events &amp; Stress Testing</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
                      <p style={{ marginBottom: 12 }}>The Life Events panel (between Timelines and Decumulation in the left sidebar) lets you overlay named stress-test scenarios onto your projection. Events are processed by the engine each year and appear as coloured markers on the Accumulation chart and a dedicated row in the Strategy Gantt timeline.</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        {Object.entries(LIFE_EVENT_TYPES).map(([key, meta]) => (
                          <div key={key} style={{ padding: "12px 14px", borderRadius: 10, background: `${meta.color}0d`, border: `1px solid ${meta.color}33` }}>
                            <p style={{ fontWeight: 700, color: meta.color, marginBottom: 6, fontSize: 11 }}>{meta.icon} {meta.label}</p>
                            <p style={{ fontSize: 11, lineHeight: 1.5 }}>{meta.description}</p>
                          </div>
                        ))}
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>How to add an event:</strong> Open the Life Events panel, click <strong>+ Add Life Event</strong>, select a type, fill in the label, age range, and magnitude, then click <strong>Save Event</strong>. The projection updates immediately. Use the ON/OFF toggle on each event to compare your plan with and without it — or use Disable All to see your baseline.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-purple)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Medical Crisis — Draw Source:</strong> Choose where the annual cost is drawn from: <em>OA only</em> (debits CPF OA each year), <em>Private only</em> (debits private assets), or <em>OA → Private</em> (default: OA first, remainder from private assets if OA is exhausted). This appears in the <strong>Events Out</strong> column of the Cashflow Ledger.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-emerald)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Windfall — Destination:</strong> Choose where a one-off inflow lands: <em>Private Assets</em> (full amount goes to private investment account), <em>OA</em> (credited to CPF OA, capped at remaining Annual Limit headroom), or <em>SRS</em> (credited to SRS balance, capped at the annual SRS contribution cap). This appears in the <strong>Events In</strong> column of the Cashflow Ledger.</div>
                        </li>
                        <li style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Hyperinflation:</strong> The magnitude sets an alternative annual inflation rate (%) active during the event age range. This overrides the global Inflation Rate for purchasing-power calculations in those years — useful for stress-testing a supply shock or stagflation scenario on your real retirement income.</div>
                        </li>
                        <li style={{ display: "flex", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-blue)", marginTop: 6, flexShrink: 0 }} />
                          <div><strong style={{ color: "var(--text-highlight)" }}>Chart markers:</strong> When the <strong>Show Events</strong> button is active on the Accumulation chart, point events (Windfall, Early Retirement) appear as labelled dashed vertical lines; range events appear as translucent shaded bands in the event's colour. The Strategy Gantt shows all enabled events as a single Life Events row with icon-labelled blocks or dots.</div>
                        </li>
                      </ul>
                    </div>
                  </section>

                  {/* Yield Math */}
                  <section id="doc-yield">
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--clr-amber)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Scale style={{ width: 18, height: 18 }} />Yield Intersections & "The Flatline"</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
                      <p><strong style={{ color: "var(--text-highlight)" }}>The Flatline:</strong> Total Yield = Payouts Received + Remaining Bequest. Since Bequest = Initial Premium − Payouts, the formula nets out to exactly your Initial Premium. Total Yield flatlines until your Bequest hits $0 (~late 70s), then every payout becomes "pure profit" drawn from the mortality pool.</p>
                    </div>
                    <div className="yield-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        ["Standard vs. Escalating", "Escalating starts ~20% lower but grows 2%/yr. Takes decades for cumulative total yield to catch up. Break-Even Age shows when Escalating surpasses Standard.", intersectionEscVsStd, "var(--clr-amber)", "rgba(var(--clr-amber3-rgb),0.08)", "rgba(var(--clr-amber3-rgb),0.3)"],
                        ["Standard vs. Basic", "In early retirement, Basic yields more total value because the 90% retained RA earns compound interest into your bequest. Once Basic RA depletes at 90, Standard overtakes.", intersectionStdVsBasic, "var(--clr-blue)", "rgba(var(--clr-blue2-rgb),0.08)", "rgba(var(--clr-blue2-rgb),0.3)"],
                        ["Escalating vs. Basic", "Basic's high early bequest makes it lead initially, but Escalating's 2% annual growth compounds fastest over the extreme long term, eventually surpassing Basic.", intersectionEscVsBasic, "var(--clr-violet2)", "rgba(var(--clr-purple-rgb),0.08)", "rgba(var(--clr-purple-rgb),0.3)"]
                      ].map(([title, desc, age, color, bg, border]) => (
                        <div key={title} style={{ background: bg, padding: 16, borderRadius: 14, border: `1px solid ${color}44` }}>
                          <h5 style={{ fontWeight: 700, color, marginBottom: 8, fontSize: 13 }}>{title}</h5>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>{desc}</p>
                          <div style={{ background: "var(--bg-base)", padding: "14px 16px", borderRadius: 10, border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "monospace", letterSpacing: "-0.5px", textAlign: "center" }}>{age ? `Age ${age}` : "Beyond Age 95"}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── XIRR sub-section ── */}
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--clr-violet)", marginBottom: 10, marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}><Percent style={{ width: 16, height: 16 }} />XIRR — Internal Rate of Return</h4>
                    <div style={{ background: "var(--bg-muted)", padding: 18, borderRadius: 14, border: "1px solid var(--border-strong)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 12 }}>
                      <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text-highlight)" }}>What XIRR measures:</strong> The XIRR column in the Data Table shows the <em>Extended Internal Rate of Return</em> of the highlighted CPF LIFE plan at each projection age. It answers: <em>"If I treat all my CPF contributions as money out and all my payouts + final bequest as money in, what annual return did I earn on the whole strategy?"</em> A positive XIRR above the CPF SA/RA rate (4%) means your overall strategy is generating value faster than simply leaving money in SA/RA.</p>
                      <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text-highlight)" }}>How it is computed:</strong> The engine builds a cashflow timeline: contributions made each year are negative (money leaving your pocket), and CPF LIFE payouts received each year plus the terminal bequest value are positive (money coming back). Newton-Raphson iteration then finds the single discount rate that makes the net present value of that entire cashflow stream equal to zero. That rate is the XIRR. Up to 100 iterations per age-point are run; if it fails to converge, the cell shows <strong>—</strong>.</p>
                      <p style={{ marginBottom: 12 }}><strong style={{ color: "var(--text-highlight)" }}>Colour coding in the Data Table:</strong></p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                        {[
                          ["🟢  > 4%", "Beats the SA/RA base rate. Your contributions have compounded at a rate better than what CPF would have earned passively in SA or RA. This is the target zone.", "var(--clr-green)", "rgba(var(--clr-green-rgb),0.07)", "rgba(var(--clr-green-rgb),0.3)"],
                          ["🟡  2% – 4%", "Moderate return — below SA/RA rate but still positive real growth. Typical in early accumulation years before payout compounding kicks in.", "var(--clr-amber)", "rgba(var(--clr-amber-rgb),0.07)", "rgba(var(--clr-amber-rgb),0.3)"],
                          ["🔴  < 2%", "Below CPF's floor rates. Common in very early years when contributions have been made but payouts have not yet started, so the numerics are dominated by outflows.", "var(--clr-red)", "rgba(var(--clr-red-rgb),0.07)", "rgba(var(--clr-red-rgb),0.3)"],
                        ].map(([title, desc, color, bg, border]) => (
                          <div key={title} style={{ padding: "12px 14px", borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
                            <p style={{ fontWeight: 700, color, marginBottom: 6, fontSize: 11 }}>{title}</p>
                            <p style={{ fontSize: 11, lineHeight: 1.5 }}>{desc}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ marginBottom: 10 }}><strong style={{ color: "var(--text-highlight)" }}>Why it shows — before payout age:</strong> XIRR requires at least one positive cashflow (a payout or bequest) to produce a meaningful result. Before your payout age, the entire cashflow series is negative contributions with no inflows yet — the IRR is mathematically undefined, so the column shows <strong>—</strong> for all pre-payout rows.</p>
                      <p style={{ marginBottom: 0 }}><strong style={{ color: "var(--text-highlight)" }}>Display cap ±10%:</strong> To prevent extreme outliers from distorting the table, XIRR results are clamped to a ±10% display range. Any computed value outside this range is pinned at the boundary. This is a display-only cap — the underlying Newton-Raphson result is unchanged.</p>
                    </div>
                  </section>

                </div>
              </div>
            )}
  );
}
