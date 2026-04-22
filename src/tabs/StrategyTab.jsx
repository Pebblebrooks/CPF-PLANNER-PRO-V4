import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { BarChart2 as BarChart3, Clock, ShieldCheck, AlignJustify as TableIcon, Target } from "lucide-react";
import { LIFE_EVENT_TYPES } from "../config/constants.js";
import { formatCurrency } from "../utils/helpers.js";

// StrategyTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function StrategyTab({ inputs, debouncedInputs, projection, projectionByAge, payoutProjection, payoutByAge, strategyChartData, oaExhaustAge, effectiveOaDrawMonthly, effectiveOaDrawStartAge, payoutAge65, highlightPlan, isForeigner }) {
  return (
              const pa = payoutAge65; // CQ-2 fix: use debounced value to match payoutProjection data (cpfLifeMonthly at L9137)
              const ca = Number(inputs.currentAge) || 35;
              const target = Number(inputs.targetMonthlyIncome) || 0;
              const srsStart = Math.max(Number(inputs.srsDrawdownStartAge) || 63, 63);
              const srsYears = Math.min(Math.max(Number(inputs.srsDrawdownYears) || 10, 1), 10);
              const oaDrawStart = effectiveOaDrawStartAge;
              const contribStop = Number(inputs.contributionStopAge) || 65;
              const propMonAge = Number(inputs.propMonetiseAge) || 65;
              const propEnabled = inputs.propMonetiseEnabled === true;

              // Gantt span: current age (min 25) to 95
              const ganttStart = Math.min(ca, 25);
              const ganttEnd = 95;
              const ganttSpan = ganttEnd - ganttStart;
              const ganttPct = (start, end) => ({
                left: `${Math.max(0, ((Math.max(start, ganttStart) - ganttStart) / ganttSpan) * 100).toFixed(2)}%`,
                width: `${Math.max(0, ((Math.min(end, ganttEnd) - Math.max(start, ganttStart)) / ganttSpan) * 100).toFixed(2)}%`,
              });
              const ganttDot = (age) => ({
                left: `${Math.max(0, Math.min(100, ((age - ganttStart) / ganttSpan) * 100)).toFixed(2)}%`,
              });

              // Build summary table rows from strategyChartData
              const summaryRows = [];
              // R3 fix: for RSS members, show RSS drawdown as the primary income stream
              // instead of CPF LIFE. cpfLifeMonthly will be 0 for RSS (payoutByAge uses LIFE tables).
              const isRSSStrategy = debouncedInputs.cpfScheme === 'rss';
              if (isRSSStrategy) {
                const rssMonthlyStrat = Number(debouncedInputs.rssMonthlyPayout) || 0;
                const rssStartStrat   = Number(debouncedInputs.rssPayoutStartAge) || 65;
                const rssDepAgeStrat  = (() => {
                  for (let i = projection.length - 1; i >= 0; i--) {
                    if (projection[i]?.rssDepletionAge != null) return projection[i].rssDepletionAge;
                  }
                  return null;
                })();
                const rssEndStrat = rssDepAgeStrat || 95;
                if (rssMonthlyStrat > 0) {
                  summaryRows.push({
                    label: `RSS Drawdown`,
                    startAge: rssStartStrat,
                    endAge:   rssDepAgeStrat || ">95",
                    monthly:  rssMonthlyStrat,
                    total:    rssMonthlyStrat * 12 * (rssEndStrat - rssStartStrat + 1),
                    color:    "var(--clr-blue)",
                  });
                }
              }
              const cpfLifeMonthly = !isForeigner ? (payoutByAge.get(pa)?.[`${highlightPlan}Monthly`] || 0) : 0; // E5 fix: O(1)
              if (cpfLifeMonthly > 0) {
                summaryRows.push({ label: `CPF LIFE (${highlightPlan.charAt(0).toUpperCase() + highlightPlan.slice(1)})`, startAge: pa, endAge: "Life", monthly: cpfLifeMonthly, total: cpfLifeMonthly * 12 * (95 - pa + 1), color: "var(--clr-purple)" });
              }
              if (oaDrawStart > 0 && effectiveOaDrawMonthly > 0) {
                const oaMo = effectiveOaDrawMonthly;
                const oaEnd = oaExhaustAge ?? 95;
                summaryRows.push({ label: "OA Drawdown", startAge: oaDrawStart, endAge: oaEnd, monthly: oaMo, total: oaMo * 12 * (oaEnd - oaDrawStart + 1), color: "var(--clr-amber)" });
              }
              const hasSRS = Number(inputs.srsBalance) > 0 || Number(inputs.srsAnnualContribution) > 0;
              if (hasSRS) {
                // REM-2c fix: replaced O(n) projection.find() with O(1) projectionByAge.get()
                const srsRowAtStart = projectionByAge.get(srsStart);
                const srsBalAtStart = srsRowAtStart?.srsBalance || 0;
                const srsRateSS = Math.max(0, (Number(inputs.srsReturnRate) || 0) / 100);
                const srsMo = srsYears > 0
                  ? Math.round((srsRateSS > 0
                      ? srsBalAtStart * srsRateSS / (1 - Math.pow(1 + srsRateSS, -srsYears))
                      : srsBalAtStart / srsYears) / 12)
                  : 0;
                if (srsMo > 0) summaryRows.push({ label: "SRS Drawdown", startAge: srsStart, endAge: srsStart + srsYears - 1, monthly: srsMo, total: srsMo * 12 * srsYears, color: "#0ea5e9" });
              }
              const avgPrivMo = Math.round(strategyChartData.reduce((s, r) => s + r.privateAsset, 0) / Math.max(strategyChartData.length, 1));
              if (avgPrivMo > 0) {
                const totalPriv = strategyChartData.reduce((s, r) => s + r.privateAsset * 12, 0);
                summaryRows.push({ label: "Private Assets", startAge: pa, endAge: 95, monthly: avgPrivMo, total: totalPriv, color: "var(--clr-emerald)", note: "avg/mo" });
              }
              if (propEnabled && (Number(inputs.propMonetiseCashProceeds) || 0) > 0) {
                const propCash = Number(inputs.propMonetiseCashProceeds) || 0;
                summaryRows.push({ label: `Property Mon. (${inputs.propMonetiseScheme || "downgrade"})`, startAge: propMonAge, endAge: propMonAge, monthly: Math.round(propCash / 12), total: propCash, color: "var(--clr-orange)", note: "one-time" });
              }

              const totalCombined = summaryRows.filter(r => r.label !== `Property Mon. (${inputs.propMonetiseScheme || "downgrade"})`).reduce((s, r) => s + r.monthly, 0);
              const shortfall = target > 0 ? target - totalCombined : 0;

              return (
                <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* ── Header ── */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ background: "rgba(244,63,94,0.15)", padding: 10, borderRadius: 12 }}>
                        <Target style={{ width: 22, height: 22, color: "#f43f5e" }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "var(--text-bright)" }}>Holistic Retirement Strategy</h3>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                          {isForeigner
                            ? "SRS + Private Assets · No CPF account — CPF LIFE not applicable"
                            : isRSSStrategy
                              ? `All income streams · Age ${Number(debouncedInputs.rssPayoutStartAge) || 65}–95 · RSS drawdown active`
                              : `All income streams · Age ${pa}–95 · ${highlightPlan.charAt(0).toUpperCase() + highlightPlan.slice(1)} CPF LIFE plan active`}
                        </p>
                      </div>
                    </div>
                    {target > 0 && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ background: "rgba(var(--clr-purple-rgb),0.1)", border: "1px solid rgba(var(--clr-purple-rgb),0.3)", borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", fontWeight: 700 }}>Target</p>
                          <p style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: "var(--clr-purple)", margin: 0 }}>{formatCurrency(target)}/mo</p>
                        </div>
                        <div style={{ background: shortfall <= 0 ? "rgba(var(--clr-emerald-rgb),0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${shortfall <= 0 ? "rgba(var(--clr-emerald-rgb),0.3)" : "rgba(244,63,94,0.3)"}`, borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", fontWeight: 700 }}>{shortfall <= 0 ? "Surplus" : "Shortfall"}</p>
                          <p style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: shortfall <= 0 ? "var(--clr-emerald)" : "#f43f5e", margin: 0 }}>{shortfall <= 0 ? "+" : "-"}{formatCurrency(Math.abs(shortfall))}/mo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* No target nudge */}
                  {target === 0 && (
                    <div style={{ background: "rgba(var(--clr-purple-rgb),0.08)", border: "1px solid rgba(var(--clr-purple-rgb),0.25)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                      <Target style={{ width: 14, height: 14, color: "var(--clr-purple)", flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: "var(--clr-violet2)", margin: 0 }}>Set a <strong>Target Retirement Income</strong> in the Private Assets &amp; Strategy panel (sidebar) to activate shortfall analysis and the goal line on the chart below.</p>
                    </div>
                  )}

                  {/* ── SECTION 1: Stacked Income AreaChart ── */}
                  <div style={{ background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 18, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <BarChart2 style={{ width: 15, height: 15, color: "#f43f5e" }} />
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-bright)", margin: 0 }}>Combined Monthly Income Stack (Age {pa}–95)</h4>
                    </div>
                    <div style={{ height: 320 }}>
                      <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={strategyChartData} margin={{ top: 10, right: 14, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                          <XAxis dataKey="age" stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "Age", position: "insideBottomRight", offset: -5, fill: "var(--chart-text)", fontSize: 9 }} />
                          <YAxis tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`} stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "Monthly Income ($)", angle: -90, position: "insideLeft", offset: 14, fill: "var(--chart-text)", fontSize: 9, style: { textAnchor: "middle" } }} />
                          <Tooltip
                            contentStyle={{ background: "var(--tooltip-bg)", backdropFilter: "blur(6px)", border: "1px solid var(--tooltip-border)", borderRadius: 10, fontSize: 11, padding: "10px 14px" }}
                            itemStyle={{ padding: "2px 0", color: "var(--tooltip-text)" }}
                            labelStyle={{ fontSize: 11, color: "var(--tooltip-label)", marginBottom: 6, fontWeight: 800 }}
                            formatter={(v, n) => v > 0 ? [formatCurrency(v) + "/mo", n] : null}
                            wrapperStyle={{ pointerEvents: "none" }}
                          />
                          <Legend verticalAlign="top" height={32} iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 600, color: "var(--text-main)" }} />
                          {target > 0 && (
                            <ReferenceLine y={target} stroke="#f43f5e" strokeWidth={2} strokeDasharray="7 4"
                              label={{ position: "insideTopRight", value: `Target ${formatCurrency(target)}/mo`, fill: "#f43f5e", fontSize: 9, fontWeight: "bold" }} />
                          )}
                          {/* S4 fix: RSS payout area — shown for RSS members in place of CPF LIFE.
                              cpfLife is 0 for RSS (payoutByAge uses LIFE tables), so without this
                              Area the entire income stack chart was blank for RSS members. */}
                          {isRSSStrategy && <Area isAnimationActive={false} type="monotone" dataKey="rssDrawdown" stackId="1" stroke="var(--clr-blue)" fill="var(--clr-blue)" fillOpacity={0.82} name="RSS Drawdown" />}
                          {!isForeigner && !isRSSStrategy && <Area isAnimationActive={false} type="monotone" dataKey="cpfLife"      stackId="1" stroke="var(--clr-purple2)" fill="var(--clr-purple2)" fillOpacity={0.82} name="CPF LIFE" />}
                          <Area isAnimationActive={false} type="monotone" dataKey="oaDraw"       stackId="1" stroke="var(--clr-amber2)" fill="var(--clr-amber2)" fillOpacity={0.78} name="OA Drawdown" />
                          <Area isAnimationActive={false} type="monotone" dataKey="srs"          stackId="1" stroke="#0369a1" fill="#0369a1" fillOpacity={0.78} name="SRS" />
                          <Area isAnimationActive={false} type="monotone" dataKey="privateAsset" stackId="1" stroke="#065f46" fill="#065f46" fillOpacity={0.78} name="Private Assets" />
                          <Area isAnimationActive={false} type="monotone" dataKey="propMon"      stackId="1" stroke="#9a3412" fill="#9a3412" fillOpacity={0.78} name="Property Mon." />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                      {[["CPF LIFE", "var(--clr-purple2)"], ["OA Drawdown", "var(--clr-amber2)"], ["SRS", "#0369a1"], ["Private Assets", "#065f46"], ["Property Mon.", "#9a3412"]].map(([name, color]) => (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-muted)" }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.85 }} />
                          <span>{name}</span>
                        </div>
                      ))}
                      {target > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#f43f5e" }}>
                          <div style={{ width: 18, height: 2, background: "#f43f5e", borderRadius: 1 }} />
                          <span>Target Income</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── SECTION 2: Life Journey Timeline (Gantt) ── */}
                  <div style={{ background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 18, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                      <Clock style={{ width: 15, height: 15, color: "var(--clr-blue)" }} />
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-bright)", margin: 0 }}>Life Journey Timeline</h4>
                    </div>

                    {/* Age axis ticks */}
                    <div style={{ display: "flex", marginBottom: 4 }}>
                      <div style={{ width: "clamp(90px, 22vw, 160px)", flexShrink: 0 }} />
                      <div style={{ flex: 1, position: "relative", height: 18 }}>
                        {[25, 35, 45, 55, 65, 75, 85, 95].filter(a => a >= ganttStart && a <= ganttEnd).map(a => (
                          <span key={a} style={{ position: "absolute", fontSize: 8, color: "var(--text-subtle)", fontFamily: "monospace", fontWeight: 700, transform: "translateX(-50%)", ...ganttDot(a) }}>{a}</span>
                        ))}
                      </div>
                    </div>

                    {/* Gantt rows */}
                    {[
                      { label: "Accumulation", color: "var(--clr-blue2)", bands: [{ start: ca, end: contribStop }] },
                      { label: "Housing Loan", color: "#64748b", bands: [{ start: ca, end: Number(inputs.housingStopAge) || 55 }] },
                      ...(hasSRS ? [{ label: "SRS Contribs", color: "#38bdf8", bands: [{ start: ca, end: Number(inputs.srsContribStopAge) || 63 }] }] : []),
                      ...(hasSRS ? [{ label: "SRS Drawdown", color: "#0369a1", bands: [{ start: srsStart, end: srsStart + srsYears - 1 }] }] : []),
                      ...(oaDrawStart > 0 && effectiveOaDrawMonthly > 0 ? [{ label: "OA Drawdown", color: "var(--clr-amber2)", bands: [{ start: oaDrawStart, end: 95 }] }] : []),
                      // R3 Gantt fix: show RSS drawdown bar for RSS members instead of CPF LIFE bar.
                      // Both are mutually exclusive — RSS members never have a CPF LIFE payout row.
                      ...(isRSSStrategy
                        ? (Number(debouncedInputs.rssMonthlyPayout) > 0
                            ? [{ label: "RSS Drawdown", color: "var(--clr-blue)", bands: [{ start: Number(debouncedInputs.rssPayoutStartAge) || 65, end: 95 }] }]
                            : [])
                        : [{ label: `CPF LIFE (${highlightPlan.charAt(0).toUpperCase() + highlightPlan.slice(1)})`, color: "var(--clr-purple2)", bands: [{ start: pa, end: 95 }] }]),
                    ].map(({ label, color, bands }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ width: "clamp(90px, 22vw, 160px)", flexShrink: 0, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", paddingRight: 10, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
                        <div style={{ flex: 1, position: "relative", height: 18, background: "var(--bg-panel)", borderRadius: 4, border: "1px solid var(--border-subtle)" }}>
                          {(bands || []).map((b, bi) => (
                            <div key={bi} title={`Age ${b.start}–${b.end}`} style={{ position: "absolute", top: 2, bottom: 2, borderRadius: 4, background: color, opacity: 0.82, ...ganttPct(b.start, b.end) }} />
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Property monetisation pulse */}
                    {propEnabled && (Number(inputs.propMonetiseCashProceeds) || 0) > 0 && (
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ width: "clamp(90px, 22vw, 160px)", flexShrink: 0, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", paddingRight: 10, textAlign: "right" }}>Property Mon.</div>
                        <div style={{ flex: 1, position: "relative", height: 18, background: "var(--bg-panel)", borderRadius: 4, border: "1px solid var(--border-subtle)" }}>
                          <div title={`Property monetisation at age ${propMonAge}`} style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)", width: 16, height: 16, borderRadius: "50%", background: "var(--clr-orange)", border: "2px solid var(--bg-muted)", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", ...ganttDot(propMonAge) }}>
                            <span style={{ fontSize: 8, color: "#fff", fontWeight: 900 }}>$</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rev #D2: Life Events Gantt row — one block per enabled event */}
                    {(inputs.lifeEvents || []).filter(e => e.enabled !== false).length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ width: "clamp(90px, 22vw, 160px)", flexShrink: 0, fontSize: 10, fontWeight: 600, color: "#ef4444", paddingRight: 10, textAlign: "right", whiteSpace: "nowrap" }}>Life Events</div>
                        <div style={{ flex: 1, position: "relative", height: 18, background: "var(--bg-panel)", borderRadius: 4, border: "1px solid rgba(239,68,68,0.2)" }}>
                          {(inputs.lifeEvents || []).filter(e => e.enabled !== false).map((ev, idx) => {
                            const meta = LIFE_EVENT_TYPES[ev.type] || {};
                            const color = meta.color || "#ef4444";
                            const sa = Number(ev.startAge);
                            const ea = Number(ev.endAge);
                            const isPoint = ev.type === 'windfall' || ev.type === 'early_retirement' || sa === ea;
                            if (isPoint) {
                              return (
                                <div key={idx} title={`${ev.label || meta.label} · Age ${sa}`}
                                  style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: color, border: "2px solid var(--bg-muted)", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default", ...ganttDot(sa) }}>
                                  <span style={{ fontSize: 7, color: "#fff", fontWeight: 900 }}>{meta.icon || "⚡"}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={idx} title={`${ev.label || meta.label} · Age ${sa}–${ea}`}
                                style={{ position: "absolute", top: 2, bottom: 2, borderRadius: 4, background: color, opacity: 0.75, display: "flex", alignItems: "center", paddingLeft: 3, cursor: "default", overflow: "hidden", ...ganttPct(sa, ea) }}>
                                <span style={{ fontSize: 7, color: "#fff", fontWeight: 800, whiteSpace: "nowrap" }}>{meta.icon} {ev.label || meta.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Current age + payout age marker row */}
                    <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                      <div style={{ width: "clamp(90px, 22vw, 160px)", flexShrink: 0 }} />
                      <div style={{ flex: 1, position: "relative", height: 24 }}>
                        <div style={{ position: "absolute", top: 4, bottom: 0, width: 1.5, background: "var(--clr-green)", opacity: 0.9, ...ganttDot(ca) }}>
                          <span style={{ position: "absolute", bottom: 4, left: 3, fontSize: 8, color: "var(--clr-green)", fontWeight: 800, whiteSpace: "nowrap" }}>Now ({ca})</span>
                        </div>
                        {/* R3 Gantt marker fix: show RSS payout start age for RSS members, CPF LIFE payout age otherwise */}
                        {isRSSStrategy ? (
                          <div style={{ position: "absolute", top: 4, bottom: 0, width: 1.5, background: "var(--clr-blue)", opacity: 0.9, ...ganttDot(Number(debouncedInputs.rssPayoutStartAge) || 65) }}>
                            <span style={{ position: "absolute", bottom: 4, left: 3, fontSize: 8, color: "var(--clr-blue)", fontWeight: 800, whiteSpace: "nowrap" }}>RSS ({Number(debouncedInputs.rssPayoutStartAge) || 65})</span>
                          </div>
                        ) : (
                          <div style={{ position: "absolute", top: 4, bottom: 0, width: 1.5, background: "var(--clr-purple)", opacity: 0.9, ...ganttDot(pa) }}>
                            <span style={{ position: "absolute", bottom: 4, left: 3, fontSize: 8, color: "var(--clr-purple)", fontWeight: 800, whiteSpace: "nowrap" }}>LIFE ({pa})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 3: Lifetime Strategy Summary Table ── */}
                  <div style={{ background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 18, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <TableIcon style={{ width: 15, height: 15, color: "var(--clr-emerald)" }} />
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-bright)", margin: 0 }}>Lifetime Income Summary</h4>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                            {["Income Stream", "Start Age", "End Age", "Monthly Income", "Lifetime Total"].map(h => (
                              <th key={h} style={{ padding: "8px 12px", textAlign: h === "Income Stream" ? "left" : "right", fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {summaryRows.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--text-subtle)", fontSize: 12 }}>
                                No income streams active — configure CPF LIFE payout age, OA Drawdown, SRS, or Private Assets in the sidebar.
                              </td>
                            </tr>
                          )}
                          {summaryRows.map((row, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.1s" }}>
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                                  <span style={{ fontWeight: 700, color: "var(--text-bright)" }}>{row.label}</span>
                                  {row.note && <span style={{ fontSize: 9, color: "var(--text-subtle)", background: "var(--bg-base)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border-subtle)" }}>{row.note}</span>}
                                </div>
                              </td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-muted)", fontFamily: "monospace" }}>{row.startAge}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-muted)", fontFamily: "monospace" }}>{row.endAge}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: row.color, fontFamily: "monospace" }}>{formatCurrency(row.monthly)}/mo</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-highlight)", fontFamily: "monospace" }}>{formatCurrency(row.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: "2px solid var(--border-strong)", background: "var(--bg-panel)" }}>
                            <td colSpan={3} style={{ padding: "12px 12px", fontWeight: 800, color: "var(--text-bright)", fontSize: 13 }}>Total Combined (excl. one-time) @ Age {pa}</td>
                            <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 900, fontFamily: "monospace", fontSize: 15, color: target > 0 ? (shortfall <= 0 ? "var(--clr-emerald)" : "var(--clr-amber)") : "var(--text-bright)" }}>{formatCurrency(totalCombined)}/mo</td>
                            <td style={{ padding: "12px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{formatCurrency(summaryRows.reduce((s, r) => s + r.total, 0))}</td>
                          </tr>
                          {target > 0 && (
                            <tr style={{ background: shortfall <= 0 ? "rgba(var(--clr-emerald-rgb),0.08)" : "rgba(244,63,94,0.08)", border: `1px solid ${shortfall <= 0 ? "rgba(var(--clr-emerald-rgb),0.2)" : "rgba(244,63,94,0.2)"}` }}>
                              <td colSpan={3} style={{ padding: "10px 12px", fontWeight: 800, color: shortfall <= 0 ? "var(--clr-emerald)" : "#f43f5e", fontSize: 12 }}>
                                {shortfall <= 0 ? "✓ Income Goal Met" : "⚠ Income Shortfall vs Target"}
                              </td>
                              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 900, fontFamily: "monospace", fontSize: 14, color: shortfall <= 0 ? "var(--clr-emerald)" : "#f43f5e" }}>
                                {shortfall <= 0 ? "+" : "-"}{formatCurrency(Math.abs(shortfall))}/mo vs {formatCurrency(target)}
                              </td>
                              <td />
                            </tr>
                          )}
                        </tfoot>
                      </table>
                    </div>

                    {/* Gap bridging tip */}
                    {target > 0 && shortfall > 0 && (
                      <div style={{ marginTop: 14, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.22)", borderRadius: 10, padding: "12px 16px", fontSize: 11, color: "#fca5a5", lineHeight: 1.6 }}>
                        <strong style={{ color: "#f43f5e" }}>Closing the {formatCurrency(shortfall)}/mo gap:</strong> Use <strong>⚡ Fill Gap</strong> in the OA Drawdown panel (sidebar) to automatically set the exact monthly OA draw needed. You can also boost Private Asset savings, maximise SRS contributions, or enable Property Monetisation (in Property &amp; Timelines) to top up your RA.
                        {oaExhaustAge && <span> At the current draw rate, OA reaches its floor at <strong style={{ color: "var(--clr-amber)" }}>age {oaExhaustAge}</strong> — adjust the bequest floor or draw amount to extend coverage.</span>}
                      </div>
                    )}
                    {target > 0 && shortfall <= 0 && (
                      <div style={{ marginTop: 14, background: "rgba(var(--clr-emerald-rgb),0.07)", border: "1px solid rgba(var(--clr-emerald-rgb),0.22)", borderRadius: 10, padding: "12px 16px", fontSize: 11, color: "#6ee7b7", lineHeight: 1.6 }}>
                        <strong style={{ color: "var(--clr-emerald)" }}>Income goal met with a {formatCurrency(Math.abs(shortfall))}/mo surplus</strong> at payout age {pa}. Your combined income streams comfortably cover your retirement target.
                      </div>
                    )}
                  </div>

                  {/* ── Footer note ── */}
                  <div style={{ background: "var(--bg-muted)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <ShieldCheck style={{ width: 13, height: 13, color: isRSSStrategy ? "var(--clr-blue)" : "var(--clr-purple)", flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                      {/* S9 fix: suppress CPF LIFE reference for RSS members — they have no LIFE plan
                          and the instruction to "switch plans in the LIFE tab" is incorrect for them. */}
                      {isRSSStrategy
                        ? <>RSS Drawdown reflects your fixed monthly payout from the sidebar. OA Drawdown end age reflects the projected exhaustion point from your inputs. Switch to <strong style={{ color: "var(--clr-purple)" }}>CPF LIFE</strong> in the sidebar to compare Standard, Escalating, and Basic plan payouts.</>
                        : <>CPF LIFE amounts reflect the <strong style={{ color: "var(--clr-purple)" }}>{highlightPlan.charAt(0).toUpperCase() + highlightPlan.slice(1)} Plan</strong> — switch plans in the LIFE tab to see how Standard, Escalating, or Basic payouts change your strategy. OA Drawdown end age reflects the projected exhaustion point from your inputs.</>
                      }
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>{/* /tab content panels */}
        </section>
      </div>
      </div>{/* /rootRef */}
      </ErrorBoundary>
    </TooltipContext.Provider>
  );
}
