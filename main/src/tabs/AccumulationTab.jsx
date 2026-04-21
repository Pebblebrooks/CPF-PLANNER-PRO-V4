import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import { Activity, AlertTriangle, Bell, Clock, MinusCircle, Percent } from "lucide-react";
import { RETIREMENT_SUMS_2026, LIFE_EVENT_TYPES } from "../config/constants.js";
import { formatCurrency } from "../utils/helpers.js";

// AccumulationTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function AccumulationTab({ inputs, setInputs, debouncedInputs, projection, displayAccumulation, accumulationByAge, payoutAge65, monteCarloData, baselineProjection, milestones, isForeigner, showMonteCarlo, setShowMonteCarlo, showBaseline, setShowBaseline }) {
  return (
              <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24 }}>
                {/* S1 fix: detect RSS mode — the "accumulation phase to payoutAge" framing is wrong
                    for RSS members who are already past payout start. For them we show the full
                    projection window (currentAge → 95) as a drawdown view instead. */}
                {(() => {
                  const isRSSGrowth = debouncedInputs.cpfScheme === 'rss';
                  const rssStartAgeG = Number(debouncedInputs.rssPayoutStartAge) || 65;
                  const rssMonthlyG  = Number(debouncedInputs.rssMonthlyPayout) || 0;
                  return isRSSGrowth ? (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(var(--clr-blue-rgb),0.07)", border: "1px solid rgba(var(--clr-blue-rgb),0.3)", marginBottom: 16, fontSize: 10, color: "var(--clr-blue)", lineHeight: 1.6 }}>
                      <Clock style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                      <span>
                        <strong>RSS mode:</strong> Showing full projection from current age ({debouncedInputs.currentAge}) to 95.
                        RA drawdown began at age {rssStartAgeG}{rssMonthlyG > 0 ? ` at ${formatCurrency(rssMonthlyG)}/mo` : " — payout amount not yet set"}.
                        See the <strong>RSS tab</strong> for the dedicated drawdown curve, depletion age, and migration analysis.
                      </span>
                    </div>
                  ) : null;
                })()}
                {/* Foreigner context — CPF lines are all $0 but SRS + Private Assets still plot */}
                {isForeigner && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(var(--clr-amber-rgb),0.07)", border: "1px solid rgba(var(--clr-amber-rgb),0.3)", marginBottom: 16, fontSize: 10, color: "var(--clr-amber)", lineHeight: 1.6 }}>
                    <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                    <span>
                      <strong>Foreigner mode:</strong> CPF accounts (OA / SA / MA / RA) are not applicable — those lines will show $0.
                      The chart reflects <strong>SRS</strong> and <strong>Private Assets</strong> accumulation only.
                      Switch citizenship to <strong>SC</strong> or <strong>PR</strong> in the Profile panel to model CPF balances.
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  {/* S1: title adapts — RSS members are in drawdown, not accumulation */}
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                    {debouncedInputs.cpfScheme === 'rss'
                      ? `Full Projection — RSS Drawdown (Age ${debouncedInputs.currentAge} → 95)`
                      : `Accumulation Phase (To Age ${inputs.payoutAge})`}
                  </h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowBaseline(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${showBaseline ? "rgba(148,163,184,0.5)" : "var(--border-strong)"}`, background: showBaseline ? "rgba(148,163,184,0.12)" : "var(--bg-input)", color: showBaseline ? "var(--clr-slate)" : "var(--text-muted)", cursor: "pointer" }}>
                      <MinusCircle style={{ width: 13, height: 13 }} />{showBaseline ? "Hide" : "Show"} Baseline
                    </button>
                    <button onClick={() => setShowMonteCarlo(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${showMonteCarlo ? "rgba(139,92,246,0.5)" : "var(--border-strong)"}`, background: showMonteCarlo ? "rgba(139,92,246,0.15)" : "var(--bg-input)", color: showMonteCarlo ? "var(--clr-violet)" : "var(--text-muted)", cursor: "pointer" }}>
                      <Activity style={{ width: 13, height: 13 }} />{showMonteCarlo ? "Hide" : "Show"} Monte Carlo (200 runs)
                    </button>
                    {/* Rev #D2: Events toggle — only shown when life events exist */}
                    {(inputs.lifeEvents || []).filter(e => e.enabled !== false).length > 0 && (
                      <button onClick={() => setShowLifeEventMarkers(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${showLifeEventMarkers ? "rgba(239,68,68,0.5)" : "var(--border-strong)"}`, background: showLifeEventMarkers ? "rgba(239,68,68,0.12)" : "var(--bg-input)", color: showLifeEventMarkers ? "#ef4444" : "var(--text-muted)", cursor: "pointer" }}>
                        <Bell style={{ width: 13, height: 13 }} />{showLifeEventMarkers ? "Hide" : "Show"} Events
                      </button>
                    )}
                  </div>
                </div>
                  {/* Rev #MC: variance preset buttons — only shown when MC is active */}
                  {showMonteCarlo && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -12, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Rate variance:</span>
                      {[["Mild ±0.5%", 0.5, "var(--clr-blue)"], ["Base ±1%", 1, "var(--clr-violet)"], ["Stress ±2%", 2, "var(--clr-red)"]].map(([lbl, val, clr]) => {
                        const active = (Number(inputs.mcVariancePct) || 1) === val;
                        return (
                          <button key={lbl} onClick={() => setInputs(p => ({ ...p, mcVariancePct: val }))}
                            style={{ padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: `1px solid ${active ? clr : "var(--border-strong)"}`, background: active ? `${clr}22` : "transparent", color: active ? clr : "var(--text-muted)", cursor: "pointer" }}>
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  )}
                {showMonteCarlo && monteCarloData?.probSufficiency != null && (() => {
                  const prob = monteCarloData.probSufficiency;
                  const c = prob >= 80 ? "var(--clr-green)" : prob >= 50 ? "var(--clr-amber)" : "var(--clr-red)";
                  return (<>
                    <div style={{ marginBottom: 12, padding: 16, borderRadius: 14, border: `1px solid ${c}33`, background: `${c}11`, display: "flex", alignItems: "center", gap: 16 }}>
                      <Percent style={{ width: 20, height: 20, color: c, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}><p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Probability of Sufficiency</p><p style={{ fontSize: 10, color: "var(--text-muted)" }}>% of 200 runs where CPF at age {inputs.payoutAge} ≥ projected FRS ({formatCurrency(monteCarloData.frsAtPayout)}) · ±{Number(inputs.mcVariancePct) || 1}% rate variance</p></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 100, height: 6, background: "var(--bg-input)", borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 999, background: c, width: `${prob}%` }} /></div>
                        <span style={{ fontSize: 28, fontWeight: 900, color: c, fontFamily: "monospace" }}>{prob}%</span>
                      </div>
                    </div>
                    {/* Plain-English Monte Carlo explanation */}
                    <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <p style={{ fontWeight: 700, color: "var(--clr-violet)", marginBottom: 8, fontSize: 12 }}>🎲 What is Monte Carlo simulation?</p>
                      <p style={{ marginBottom: 8 }}>A Monte Carlo simulation runs your retirement projection <strong style={{ color: "var(--text-bright)" }}>200 times</strong>, each time with slightly different CPF interest rates. The variance band is user-selectable: <strong style={{ color: "var(--clr-blue)" }}>Mild ±0.5%</strong>, <strong style={{ color: "var(--clr-violet)" }}>Base ±1%</strong> (default), or <strong style={{ color: "var(--clr-red)" }}>Stress ±2%</strong>. This mimics real-world rate uncertainty. The result is a <strong style={{ color: "var(--text-bright)" }}>range of possible outcomes</strong>, not just one single prediction.</p>
                      <p style={{ fontWeight: 700, color: "var(--clr-violet)", marginBottom: 6 }}>How to read the chart bands:</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8, alignItems: "stretch" }}>
                        {[
                          ["Purple band (shaded)", "The full range between the worst 10% of outcomes (P10) and best 10% of outcomes (P90). Wider = more uncertainty.", "rgba(var(--clr-purple2-rgb),0.15)"],
                          ["Dashed purple line (P50)", "The median outcome — half the simulations finished above this line, half below. Think of it as the most likely single scenario.", "rgba(var(--clr-violet-rgb),0.15)"],
                          ["Probability of Sufficiency", "The % of all 200 runs where your CPF at payout age was enough to meet the FRS target. 80%+ is strong; below 50% suggests risk.", "rgba(var(--clr-green-rgb),0.1)"],
                        ].map(([title, desc, bg]) => (
                          <div key={title} style={{ padding: "8px 10px", borderRadius: 8, background: bg, border: "1px solid rgba(139,92,246,0.2)", display: "flex", flexDirection: "column" }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: "var(--clr-violet)", marginBottom: 3 }}>{title}</div>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5, flex: 1 }}>{desc}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 10, color: "var(--text-subtle)" }}>💡 <strong>What to do with this:</strong> If the probability is low, consider increasing your RSTU top-ups or deferring your payout age. The What-If Explorer (Summary tab) lets you test these adjustments instantly.</p>
                    </div>
                  </>);
                })()}
                <div style={{ height: 380 }}>
                  <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={(() => {
                      // S1 fix: for RSS members, payoutAge65 (= 65) < currentAge (= 68), so the old
                      // filter `d.age <= payoutAge65` returns zero rows → blank chart.
                      // RSS members see the full projection window (currentAge → 95).
                      // CPF LIFE members keep the existing filter (accumulation up to payout age).
                      const isRSSChart = debouncedInputs.cpfScheme === 'rss';
                      const ageLimit = isRSSChart ? 95 : payoutAge65;
                      const base = displayAccumulation.filter(d => d.age <= ageLimit).map(row => ({
                        ...row,
                        // SA is closed at 55 — zero it out post-55 so the area ends cleanly.
                        // RA only exists post-55 — zero it out pre-55 so it doesn't ghost below the axis.
                        sa: row.age >= 55 ? 0 : (row.sa || 0),
                        ra: row.age < 55 ? 0 : (row.ra || 0),
                      }));
                      let merged = base;
                      if (showMonteCarlo && monteCarloData) {
                        merged = merged.map(row => { const mc = monteCarloData.rows.find(m => m.age === row.age); return mc ? { ...row, mcP10: mc.p10, mcP90: mc.p90, mcP50: mc.p50 } : row; });
                      }
                      if (showBaseline && baselineProjection) {
                        merged = merged.map(row => { const bl = baselineProjection.find(b => b.age === row.age); return bl ? { ...row, baselineTotal: bl.baselineTotal } : row; });
                      }
                      return merged;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="age" stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "Age", position: "insideBottomRight", offset: -5, fill: "var(--chart-text)", fontSize: 9 }} />
                      <YAxis tickFormatter={v => `$${v > 999 ? (v / 1000).toFixed(0) + "k" : v}`} stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "CPF Balance ($)", angle: -90, position: "insideLeft", offset: 14, fill: "var(--chart-text)", fontSize: 9, style: { textAnchor: "middle" } }} />
                      <Tooltip contentStyle={{ background: "var(--tooltip-bg)", backdropFilter: "blur(4px)", border: "1px solid var(--tooltip-border)", borderRadius: 8, fontSize: 10, padding: "6px 8px" }} itemStyle={{ padding: 0, color: "var(--tooltip-text)" }} labelStyle={{ fontSize: 10, color: "var(--tooltip-label)", marginBottom: 2 }} formatter={(v, n) => { if (n === "MC Band") return null; return [formatCurrency(v), n]; }} wrapperStyle={{ pointerEvents: "none" }} />
                      <Legend verticalAlign="top" height={28} iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 600, color: "var(--text-main)" }} />
                      {milestones.filter(m => m.age <= (debouncedInputs.cpfScheme === 'rss' ? 95 : payoutAge65)).map((m, idx) => { // S1: RSS shows milestones to 95
                        const sc = m.type === "success" ? "var(--clr-emerald)" : m.type === "gold" ? "var(--clr-amber3)" : m.type === "warning" ? "#f97316" : "#ef4444";
                        return <ReferenceLine key={idx} x={m.age} stroke={sc} strokeWidth={1.5} strokeDasharray="3 3" label={{ position: "insideTopRight", value: `Age ${m.age}`, fill: sc, fontSize: 8, fontWeight: "bold" }} />;
                      })}
                      {/* Rev #D2: Life event markers — bands for range events, lines for point events */}
                      {showLifeEventMarkers && (inputs.lifeEvents || []).filter(e => e.enabled !== false).map((ev, idx) => {
                        const meta = LIFE_EVENT_TYPES[ev.type] || {};
                        const color = meta.color || "#ef4444";
                        const sa = Number(ev.startAge);
                        const ea = Number(ev.endAge);
                        const isPoint = ev.type === 'windfall' || ev.type === 'early_retirement' || sa === ea;
                        const labelVal = `${meta.icon || "⚡"} ${ev.label || meta.label}`;
                        if (isPoint) {
                          return <ReferenceLine key={`le-${idx}`} x={sa} stroke={color} strokeWidth={2} strokeDasharray="5 3"
                            label={{ position: "insideTopLeft", value: labelVal, fill: color, fontSize: 8, fontWeight: "bold" }} />;
                        }
                        return <ReferenceArea key={`le-${idx}`} x1={sa} x2={Math.min(ea, debouncedInputs.cpfScheme === 'rss' ? 95 : payoutAge65)} fill={color} fillOpacity={0.08}
                          stroke={color} strokeOpacity={0.4} strokeWidth={1}
                          label={{ position: "insideTop", value: labelVal, fill: color, fontSize: 8, fontWeight: "bold" }} />;
                      })}
                      <Area isAnimationActive={false} type="monotone" dataKey="oa" stackId="1" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.85} name="OA" />
                      <Area isAnimationActive={false} type="monotone" dataKey="sa" stackId="1" stroke="#b45309" fill="#b45309" fillOpacity={0.85} name="SA (pre-55)" />
                      <Area isAnimationActive={false} type="monotone" dataKey="ma" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.85} name="MA" />
                      <Area isAnimationActive={false} type="monotone" dataKey="ra" stackId="1" stroke="var(--clr-purple2)" fill="var(--clr-purple2)" fillOpacity={0.85} name="RA (from 55)" />
                      {/* MC band rendered AFTER stacked areas so it overlays on top without
                          hiding the account breakdown. P90 = semi-transparent upper bound fill;
                          no bg-base "eraser" (the old eraser covered the stacked areas entirely).
                          P50 dashed median line sits on top of everything. */}
                      {showMonteCarlo && monteCarloData && <><Area isAnimationActive={false} type="monotone" dataKey="mcP90" stroke="var(--clr-violet2)" strokeWidth={0.5} strokeDasharray="2 2" fill="var(--clr-purple2)" fillOpacity={0.18} name="MC Band (P10–P90)" legendType="square" /><Line isAnimationActive={false} type="monotone" dataKey="mcP50" stroke="var(--clr-violet)" strokeWidth={2} strokeDasharray="4 3" dot={false} name="MC Median (P50)" /></>}
                      {showBaseline && baselineProjection && <Line isAnimationActive={false} type="monotone" dataKey="baselineTotal" stroke="var(--clr-slate)" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Mandatory-only baseline" />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {showBaseline && baselineProjection && (() => {
                  const pa = payoutAge65; // CQ-2 fix: use debounced value to match displayAccumulation data
                  const withRow = accumulationByAge.get(pa) || {}; // CQ-2 perf: O(1) Map lookup
                  const withTotal = (withRow.oa || 0) + (withRow.sa || 0) + (withRow.ma || 0) + (withRow.ra || 0);
                  const blRow = baselineProjection.find(r => r.age === pa) || {};
                  const blTotal = blRow.baselineTotal || 0;
                  const uplift = withTotal - blTotal;
                  const upliftPct = blTotal > 0 ? Math.round((uplift / blTotal) * 100) : 0;
                  return (
                    <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.2)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <MinusCircle style={{ width: 16, height: 16, color: "var(--clr-slate)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-slate)", marginBottom: 2 }}>Mandatory-Only Baseline (dashed line)</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                          Without voluntary top-ups, transfers, or grants — mandatory contributions only. At age {pa}: <strong style={{ color: "var(--clr-slate)" }}>{formatCurrency(blTotal)}</strong> baseline vs <strong style={{ color: "var(--clr-green)" }}>{formatCurrency(withTotal)}</strong> with your current strategy.
                        </p>
                      </div>
                      {uplift > 0 && (
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--clr-green)" }}>+{formatCurrency(uplift)}</div>
                          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>+{upliftPct}% uplift from voluntary strategy</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "var(--bg-panel-muted)", border: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {debouncedInputs.cpfScheme === 'rss' ? (
                    <>
                      <p style={{ fontWeight: 700, color: "var(--text-highlight)", marginBottom: 8, fontSize: 12 }}>📊 How to read this chart (Age {inputs.currentAge} → 95)</p>
                      <p style={{ marginBottom: 8 }}>This stacked area chart shows your CPF balances from your current age ({inputs.currentAge}) to age 95. Under RSS, your RA is drawn down each month by your fixed payout — watch the RA band shrink over time. OA and MA continue to accumulate interest.</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8, marginBottom: 10 }}>
                        {[
                          ["OA (Ordinary Account)", "#1d4ed8", "2.5% p.a. Continues to grow — use OA Drawdown to supplement your RSS income."],
                          ["MA (MediSave)", "#059669", "4.0% p.a. Healthcare reserve. Capped at BHS ($79,000)."],
                          ["RA (Retirement Account)", "var(--clr-purple2)", `4.0% p.a. Being drawn down at ${formatCurrency(Number(inputs.rssMonthlyPayout) || 0)}/mo under RSS. Balance reaches $0 at depletion age.`],
                        ].map(([name, col, desc]) => (
                          <div key={name} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--bg-muted)", border: `1px solid ${col}44` }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: col, marginBottom: 3 }}>{name}</div>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text-bright)" }}>Key transitions to watch for:</strong></p>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10 }}>
                        <li><strong style={{ color: "var(--clr-purple2)" }}>RA declining:</strong> Fixed payout exceeds interest → RA balance falls. If payout &lt; interest, RA grows (amber banner on RSS tab).</li>
                        <li><strong style={{ color: "#1d4ed8" }}>OA growth:</strong> OA continues earning 2.5% p.a. — set an OA Drawdown to supplement your RSS income after RA depletes.</li>
                        <li><strong style={{ color: "var(--clr-green)" }}>Migration option:</strong> You can migrate to CPF LIFE at any age up to 80. See the RSS tab for the migration analysis.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, color: "var(--text-highlight)", marginBottom: 8, fontSize: 12 }}>📊 How to read this chart (Age {inputs.currentAge} → {inputs.payoutAge})</p>
                      <p style={{ marginBottom: 8 }}>This stacked area chart shows how your CPF savings accumulate year by year from your current age ({inputs.currentAge}) until your chosen payout age ({inputs.payoutAge}). Each coloured band represents one account:</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8, marginBottom: 10 }}>
                        {[
                          ["OA (Ordinary Account)", "#1d4ed8", "2.5% p.a. Used for housing, investments. Contributions stop at Contrib Stop Age."],
                          ["SA (Special Account)", "#b45309", "4.0% p.a. Locked for retirement — cannot be used for housing. Closed permanently at age 55 and merged into RA."],
                          ["MA (MediSave)", "#059669", "4.0% p.a. Used for healthcare. Capped at BHS ($79,000). Excess above BHS flows to SA/RA."],
                          ["RA (Retirement Account)", "var(--clr-purple2)", "4.0% p.a. Created at age 55 from SA. Funds the CPF LIFE pool at payout age."],
                        ].map(([name, col, desc]) => (
                          <div key={name} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--bg-muted)", border: `1px solid ${col}44` }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: col, marginBottom: 3 }}>{name}</div>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ marginBottom: 6 }}><strong style={{ color: "var(--text-bright)" }}>Key transitions to watch for:</strong></p>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10 }}>
                        <li><strong style={{ color: "#b45309" }}>Age 55 — SA Closure:</strong> SA balance merges into RA. Only FRS (~${Math.round((RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (Number(inputs.currentYear) || 2026) + Math.max(0, 55 - (Number(inputs.currentAge) || 35)) - 2026))) / 1000)}k at age 55) goes to RA; any excess stays in OA.</li>
                        <li><strong style={{ color: "#1d4ed8" }}>Housing outflow:</strong> OA may shrink if Housing Loan deductions exceed contributions. This stops at Housing Stop Age ({inputs.housingStopAge}).</li>
                        <li><strong style={{ color: "var(--clr-purple2)" }}>Age {inputs.payoutAge} — LIFE pool:</strong> RA transfers into the CPF LIFE pool. Monthly payouts begin. The chart stops here; the LIFE tab shows payouts from age {inputs.payoutAge} to 95.</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
  );
}
