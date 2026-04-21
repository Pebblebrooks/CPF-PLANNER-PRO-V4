import React from 'react';
import {
  Calculator, TrendingUp, ShieldCheck, Activity, Bell, Target, ArrowRightLeft,
  Split, Download, BookOpen, Home, Clock, Users, Gift,
  BarChart2 as BarChart3, User, Lightbulb, Link, Briefcase,
  AlignJustify as TableIcon,
} from 'lucide-react';
import { LEGAL_DISCLAIMER } from '../config/presets.js';
// WelcomeTab — static content only. No data props needed.

export default function WelcomeTab(() {}) {
  return (
              <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 28, borderRadius: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}><Lightbulb style={{ width: 22, height: 22, color: "var(--clr-emerald)" }} />CPF Planner Pro — Welcome Guide</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  {/* Page 1 */}
                  <div style={{ background: "var(--bg-muted)", borderRadius: 16, border: "1px solid var(--border-strong)", overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ background: "#10b98122", padding: 12, borderRadius: 12 }}><Calculator style={{ width: 24, height: 24, color: "var(--clr-emerald)" }} /></div>
                      <div><h4 style={{ fontSize: 18, fontWeight: 900, color: "#ecfdf5", marginBottom: 2 }}>Welcome to CPF Planner Pro</h4><p style={{ fontSize: 12, color: "#6ee7b7" }}>Your end-to-end Singapore retirement simulation engine</p></div>
                    </div>
                    <div style={{ padding: "20px 24px" }}>
                      <p style={{ color: "var(--text-main)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>This tool models your entire CPF journey — from today's balances through to monthly payouts in retirement — using <strong>2026 CPF Board rates and policies</strong>.</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                        {[["Year-by-year accumulation", TrendingUp], ["CPF LIFE plan comparison", ShieldCheck], ["Monte Carlo stress testing", Activity], ["Milestone alerts", Bell], ["Holistic Strategy & ⚡ Fill Gap", Target], ["OA Drawdown decumulation engine", ArrowRightLeft], ["Side-by-side scenario diff", Split], ["PDF & CSV export", Download], ["SRS tax-deferred savings", BookOpen], ["Property Monetisation (LBS / downgrade)", Home], ["Die with Zero draw-down planner", Clock], ["7 sample profiles to explore instantly", Users], ["PR G/G & F/G rates with auto-advancement", Users], ["Recurring / One-Time frequency toggles", ArrowRightLeft], ["OA→SA / OA→RA For Loved One transfers", Users], ["Annual Cashflow Ledger", TableIcon], ["OA Education Loan Scheme", BookOpen], ["PwD MRSS under-55 bypass", ShieldCheck], ["MMSS 5-year pilot (2026–2030)", Gift], ["Accumulation: SA pre-55 / RA from-55 split", BarChart3]].map(([text, Icon], i) => (
                          <div key={i} style={{ background: "var(--bg-base)", padding: "10px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--border-subtle)" }}>
                            <Icon style={{ width: 14, height: 14, color: "var(--clr-emerald)" }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-highlight)" }}>{text}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "var(--bg-base)", padding: 14, borderRadius: 10, border: "1px solid var(--border-subtle)", marginTop: 16 }}>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}><strong style={{ color: "var(--text-bright)" }}>Data stays on your device.</strong> Use <strong style={{ color: "var(--text-bright)" }}>Export Profile</strong> to back up your inputs as a JSON file, or Share to generate an encoded profile code. No server storage — everything runs locally in your browser. Hit <strong style={{ color: "var(--text-bright)" }}>Samples</strong> in the header to instantly load a pre-built profile and start exploring.</p>
                      </div>
                    </div>
                  </div>
                  {/* Page 2 */}
                  <div style={{ background: "var(--bg-muted)", borderRadius: 16, border: "1px solid var(--border-strong)", overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ background: "#3b82f622", padding: 12, borderRadius: 12 }}><User style={{ width: 24, height: 24, color: "var(--clr-blue)" }} /></div>
                      <div><h4 style={{ fontSize: 18, fontWeight: 900, color: "#eff6ff", marginBottom: 2 }}>Setting Up Your Profile</h4><p style={{ fontSize: 12, color: "#93c5fd" }}>Step 1 — The Input Engine (left panel)</p></div>
                    </div>
                    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      {[["1", "Enter your CPF balances & gender", "Type your current OA, SA, and MA balances. Select Male or Female — this sets the correct CPF LIFE payout ratio (~$540/mo vs ~$500/mo per $100k RA). Select SC or PR — PR members in Year 1 or 2 get lower contribution rates, with the engine automatically advancing from Yr 1 → Yr 2 → Yr 3+ rates each projection year.", "var(--clr-blue2)"], ["2", "Auto-Calc Contributions (SC / PR / SEP)", "For employed members: enter OW, AW, and Salary Growth %, then click ⚡ Auto-Calc. SC uses full rates. PR members: select tenure year (1 / 2 / 3+) and rate type — G/G (default, graduated employer) or F/G (full employer 17%, requires joint CPF application). Auto-Calc uses the correct rates and the engine advances tiers automatically year-by-year. SEP members use the Inflows (VC3A) panel instead.", "var(--clr-emerald)"], ["3", "Add voluntary top-ups & CPF Transfers", "RSTU top-ups to SA/RA, gov grants, MRSS/MMSS. Every inflow and outflow field has a Recurring / One-Time frequency toggle — use One-Time for lump sums that only apply in the current year. CPF Transfers: OA→SA/RA (For Self: internal move; For Loved One: OA outflow only, no FRS cap). CPFIS: OA above $20k and SA above $40k are investible separately.", "var(--clr-purple)"], ["4", "Review the Inflows panel limit", "The Inflows panel tracks the $37,740 CPF Annual Limit for VC contributions. It turns orange if your combined VC3A/RSTU inputs exceed your remaining allowance.", "var(--clr-amber)"], ["5", "Set your life-phase timelines", "Use Contrib Stop Age (when you retire) and Housing Stop Age (when your mortgage ends) to model transitions accurately. If selling property, enter Sell Property at Age — CPF requires refund of OA housing principal + 2.5%/yr accrued interest, credited back to OA.", "var(--clr-orange)"], ["6", "Configure SRS (optional)", "Enter your SRS balance, annual contribution (max $15,300/yr for SC/PR), and drawdown start age in the SRS panel. Contributions are tax-deductible; 50% of each withdrawal is taxable from age 63; full balance must be withdrawn within 10 years of first withdrawal. The engine models growth and drawdown separately.", "#0ea5e9"], ["7", "Plan decumulation income & Property Monetisation", "Set a Target Monthly Income in Decumulation & Goals. Click ⚡ Fill Gap to auto-set the OA Drawdown amount. If you plan to downgrade, use LBS, or sell and buy smaller, toggle Property Monetisation in the Property & Timelines section to add net cash proceeds and any RA top-up to the projection.", "#f43f5e"], ["8", "Try Die with Zero mode (optional)", "Toggle Die with Zero in Decumulation & Goals. Set a target depletion age — the tool automatically computes the exact monthly OA draw using the PMT annuity formula and applies it directly to the projection. The OA draw is shown as auto-applied in the panel. RA and CPF LIFE payouts are unaffected.", "var(--clr-green)"]].map(([num, title, desc, color]) => (
                        <div key={num} style={{ display: "flex", gap: 14 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${color}22`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{num}</div>
                          <div><h5 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", marginBottom: 4 }}>{title}</h5><p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Page 3 */}
                  <div style={{ background: "var(--bg-muted)", borderRadius: 16, border: "1px solid var(--border-strong)", overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg,#3b0764,#6b21a8)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ background: "#a855f722", padding: 12, borderRadius: 12 }}><LayoutDashboard style={{ width: 24, height: 24, color: "var(--clr-violet2)" }} /></div>
                      <div><h4 style={{ fontSize: 18, fontWeight: 900, color: "#faf5ff", marginBottom: 2 }}>Exploring the Dashboard</h4><p style={{ fontSize: 12, color: "#d8b4fe" }}>Step 2 — The right panel tabs</p></div>
                    </div>
                    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                      {[["Summary", PieChart, "var(--clr-emerald)", "Key metrics at a glance: total CPF at payout age, net worth breakdown doughnut chart, estate planning panel, milestone alerts, 20% RA-to-OA transfer notice, and What-If Explorer with SA/RA text override."], ["Strategy", Target, "#f43f5e", "Holistic income planner for retirement. Set your Target Monthly Income, then click ⚡ Fill Gap to auto-set the OA Drawdown needed to close the income gap. Gantt timeline shows all income streams. Income table shows CPF LIFE, OA Drawdown (with real exhaustion age), SRS, and Private Assets side by side."], ["Accumulation", BarChart3, "var(--clr-blue2)", "Stacked area chart of OA/SA/MA/RA year-by-year. Toggle Monte Carlo to overlay a P10–P90 confidence band from 200 simulations. Choose Mild (±0.5%), Base (±1%), or Stress (±2%) variance. Real vs Nominal dollar toggle adjusts for inflation."], ["LIFE Comparison", ShieldCheck, "var(--clr-purple)", "Side-by-side payout curves for Standard, Escalating, and Basic plans. Vertical lines mark exact break-even ages. Toggle between Bequest and Cumulative Payout views. Basic plan payout = PMT formula; bequest includes full premium refund during Phase 1."], ["Compare", Split, "var(--clr-orange)", "Save two scenarios (e.g. retire at 65 vs 70) and view a colour-coded diff table showing every metric that changes between them."], ["Data Table", TableIcon, "var(--clr-amber)", "Full year-by-year projection table with sticky Age column, Yield (B/S/E) amounts, and Yield IRR %. Download as CSV."]].map(([title, Icon, color, desc]) => (
                        <div key={title}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${color}15`, border: `1px solid ${color}33`, padding: "4px 10px", borderRadius: 8, marginBottom: 6 }}>
                            <Icon style={{ width: 12, height: 12, color }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color }}>{title}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Page 4 */}
                  <div style={{ background: "var(--bg-muted)", borderRadius: 16, border: "1px solid var(--border-strong)", overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg,#78350f,#92400e)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ background: "#fbbf2422", padding: 12, borderRadius: 12 }}><Lightbulb style={{ width: 24, height: 24, color: "var(--clr-amber)" }} /></div>
                      <div><h4 style={{ fontSize: 18, fontWeight: 900, color: "#fffbeb", marginBottom: 2 }}>Advanced Features & Disclaimer</h4><p style={{ fontSize: 12, color: "#fde68a" }}>Step 3 — Power tools and legal notice</p></div>
                    </div>
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 20 }}>
                        {[["Share Link", Link, "Encode your entire profile into a compact code. Send to a financial advisor or save as a bookmark."], ["PDF Report", Download, "Print-ready 6-page report: cover KPIs, input parameters & CPF LIFE estimates, charts, year-by-year projection & sensitivity, Decumulation Strategy (income table + OA exhaustion age), milestones & disclaimer."], ["SEP Mode", Briefcase, "Self-Employed mode: no mandatory contributions. VC3A up to $37,740/yr split proportionally across OA/SA/MA. BHS and ERS caps enforced."], ["Monte Carlo", Activity, "200 simulations with selectable variance: Mild ±0.5% / Base ±1% / Stress ±2%. Toggle in the Accumulation tab. Probability of Sufficiency badge shows the active band."], ["SRS", BookOpen, "Tax-deferred savings scheme — contributions deductible up to $15,300/yr (SC/PR). 50% of withdrawals taxable from age 63; full balance must be withdrawn within 10 years. Model in the SRS panel."], ["Property Monetisation", Home, "One-time event: downgrade, Lease Buyback Scheme, or Silver Housing Bonus. Net cash proceeds to private assets; RA top-up to RA. Now in the Property & Timelines panel."], ["Die with Zero", Clock, "PMT-based draw-down planner — toggle in Decumulation & Goals. Set a target depletion age; the OA draw is computed via PMT and auto-applied to the projection immediately. All liquid assets reach $0 at that age; RA/CPF LIFE unaffected."], ["Sample Profiles", Users, "7 pre-built scenarios from Blank Slate to Post-55 RA Builder. Load from the Samples button in the header (desktop) or hamburger menu (mobile) to explore the tool instantly."], ["PR G/G & F/G Rates", Users, "PR members in Year 1 or 2 can select G/G (graduated employer, default) or F/G (full employer 17% — requires joint CPF application). The engine automatically advances Yr 1 → Yr 2 → Yr 3+ rates in the projection."], ["Recurring / One-Time Toggles", ArrowRightLeft, "Every inflow/outflow field has a frequency toggle. 'Recurring' applies the amount every projection year. 'One-Time' applies it only in the first projection year — ideal for lump-sum top-ups or one-off withdrawals."], ["OA→SA / OA→RA For Loved One", Users, "CPF Transfers panel supports For Self (internal move with FRS/ERS cap) and For Loved One (OA outflow only, no headroom constraint on the recipient). Applies to both OA→SA (pre-55) and OA→RA (55+)."], ["Annual Cashflow Ledger", TableIcon, "In the Data Table tab, switch to Cashflow Ledger for a full year-by-year breakdown: mandatory, voluntary, grants, OA/SA/RA/MA interest, housing outflow, medical, OA drawdown, loved-one transfers, and CPFIS — with column totals."], ["Gender Toggle", Users, "Male/Female selection affects CPF LIFE payout. Female payouts are ~7% lower (0.93× male) due to longer life expectancy. Estimates use 2026 CPF Board data with linear interpolation."], ["OA Drawdown & ⚡ Fill Gap", Download, "Draw monthly cash from OA after CPF LIFE starts to close the income gap. Set a Target Monthly Income, then click ⚡ Fill Gap to auto-set the exact draw amount. OA Exhaustion Age badge updates live."], ["Property Sale & CPF Refund", Home, "Enter Sell Property at Age in Timelines & Property. On sale, CPF refunds OA housing principal + 2.5%/yr interest to OA. With pledge active, refund restores RA to FRS first."], ["OA Education Loan", BookOpen, "Model CPF Education Scheme withdrawals: use OA savings to fund tuition at approved local institutions. Engine enforces the 40% OA ceiling and age 55+ FRS-first rule. Modelled as a pure OA outflow."], ["PwD MRSS Bypass", ShieldCheck, "Enable the Person with Disabilities (PwD) flag in Profile to unlock MRSS below age 55. PwD members are exempt from the age-55 requirement for the Matched Retirement Savings Scheme."], ["Retirement Sum Growth", TrendingUp, "Control how fast FRS, BRS, ERS, and BHS targets rise each year (default 3%, CPF Board historical average). Preset buttons: 2% / 3% / 4%. Found in the Salary section."], ["Phased Salary & Career Break", Briefcase, "Model a growth rate change at a specific age (Phase 2) or a full contribution pause for a career break age range (sabbatical, NS, parental leave). Both affect mandatory contribution projections. Found in the Salary section."], ["Life Events", Activity, "Overlay stress-test events: Retrenchment, Career Break, Medical Crisis (draws OA/private), Windfall (one-off inflow), Early Retirement, or Hyperinflation. Coloured bands on the Accumulation chart and a row in the Strategy Gantt. Found in the Life Events panel."]].map(([title, Icon, desc]) => (
                          <div key={title} style={{ background: "var(--bg-base)", padding: "14px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <Icon style={{ width: 14, height: 14, color: "var(--clr-blue2)" }} />
                              <h5 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)" }}>{title}</h5>
                            </div>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "rgba(var(--clr-amber3-rgb),0.08)", border: "1px solid rgba(var(--clr-amber3-rgb),0.3)", padding: "14px", borderRadius: "10px" }}>
                        <p style={{ fontSize: 10, color: "var(--clr-amber)", lineHeight: 1.6, textAlign: "justify" }}><strong style={{ fontWeight: 800 }}>Legal Disclaimer:</strong> {LEGAL_DISCLAIMER}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  );
}
