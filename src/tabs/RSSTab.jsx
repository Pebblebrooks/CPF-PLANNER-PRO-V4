import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CPF_RATES } from "../config/constants.js";
import { formatCurrency } from "../utils/helpers.js";

// RSSTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function RSSTab({ debouncedInputs, projection, displayAccumulation, accumulationByAge, isRSSMode }) {
  return (
              const isRSSMode = debouncedInputs.cpfScheme === 'rss';
              if (!isRSSMode) return null;
              // Extract RSS-specific values from the projection array
              const rssStartAge = Number(debouncedInputs.rssPayoutStartAge) || 65;
              const rssMonthlyAmt = Number(debouncedInputs.rssMonthlyPayout) || 0;
              // Depletion age: read from the last row that has it set (propagated forward)
              const depletionAge = (() => { for (let i = displayAccumulation.length - 1; i >= 0; i--) { if (displayAccumulation[i]?.rssDepletionAge != null) return displayAccumulation[i].rssDepletionAge; } return null; })();
              // RA drawdown chart data: rows from rssPayoutStart onwards
              const raChartData = displayAccumulation.filter(r => r.age >= rssStartAge);
              // Bug 2 fix: accumulationByAge only covers currentAge → 95.
              // When rssStartAge < currentAge (payout already began years ago), the Map
              // lookup returns undefined → $0.  Fall back to the current RA input (saBalance)
              // which is the best available proxy for the actual balance right now.
              const currentAgeForRss = Number(debouncedInputs.currentAge) || 65;
              const raAtPayoutStartIsCurrent = rssStartAge < currentAgeForRss;
              const raAtPayoutStart = raAtPayoutStartIsCurrent
                ? (Number(debouncedInputs.saBalance) || 0)
                : (accumulationByAge.get(rssStartAge)?.ra || 0);
              return (
              <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Header + eligibility bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-bright)", margin: 0 }}>RSS — Retirement Sum Scheme Drawdown</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(var(--clr-blue-rgb),0.06)", border: "1px solid rgba(var(--clr-blue-rgb),0.2)", fontSize: 10, color: "var(--text-muted)" }}>
                    {[
                      ["🏛 Eligibility", "SC & PR born before 1958"],
                      ["💵 Monthly Payout", rssMonthlyAmt > 0 ? formatCurrency(rssMonthlyAmt) + "/mo" : "Not set"],
                      ["📅 Drawdown started", `Age ${rssStartAge}`],
                      ["⚠ Depletion risk", "RA depletes when balance = $0 — payouts stop"],
                      ["🔄 Migration option", debouncedInputs.lifeMigrationAge > 0 ? `CPF LIFE at age ${debouncedInputs.lifeMigrationAge}` : "None configured"],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontWeight: 700, color: "var(--clr-blue)" }}>{label}:</span><span>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Depletion age alert — prominent if < 85 */}
                {depletionAge != null && (
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: depletionAge < 85 ? "rgba(239,68,68,0.1)" : "rgba(var(--clr-green-rgb),0.08)", border: `1px solid ${depletionAge < 85 ? "rgba(239,68,68,0.4)" : "rgba(var(--clr-green-rgb),0.3)"}`, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{depletionAge < 85 ? "⚠" : "✅"}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: depletionAge < 85 ? "var(--clr-red)" : "var(--clr-green)", margin: "0 0 4px" }}>
                        {depletionAge < 85 ? `RSS payouts stop at age ${depletionAge} — RA depleted` : `RA projected to last to age ${depletionAge}`}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                        {depletionAge < 85
                          ? `With ${formatCurrency(rssMonthlyAmt)}/mo drawdown from age ${rssStartAge}, RA (${formatCurrency(raAtPayoutStart)}) depletes at age ${depletionAge}. Consider migrating to CPF LIFE before age 80 for lifetime income.`
                          : `RA is projected to sustain payouts of ${formatCurrency(rssMonthlyAmt)}/mo well beyond age 85. Your balance is healthy relative to your drawdown rate.`}
                      </p>
                    </div>
                  </div>
                )}
                {depletionAge == null && rssMonthlyAmt === 0 && (
                  <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(var(--clr-amber-rgb),0.08)", border: "1px solid rgba(var(--clr-amber-rgb),0.3)", fontSize: 11, color: "#fcd34d" }}>
                    ⚠ Enter your RSS monthly payout amount in the sidebar to see your drawdown projection.
                  </div>
                )}

                {/* Bug 3 fix: amber banner when payout < RA interest — RA grows rather than depletes.
                    Uses 4% base rate as a conservative floor (actual effective rate is higher due to
                    extra interest on first $30k/$60k, so this banner may trigger even slightly below
                    the true break-even). Shown only when a payout amount has been entered. */}
                {rssMonthlyAmt > 0 && (() => {
                  const currentRaBal = (accumulationByAge.get(currentAgeForRss) || displayAccumulation[0])?.ra
                    || Number(debouncedInputs.saBalance) || 0;
                  const annualInterestFloor = currentRaBal * CPF_RATES.RA; // 4% base — conservative lower bound
                  const annualPayout = rssMonthlyAmt * 12;
                  if (annualPayout >= annualInterestFloor) return null;
                  const breakEvenMonthly = Math.ceil(annualInterestFloor / 12);
                  return (
                    <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(var(--clr-amber-rgb),0.08)", border: "1px solid rgba(var(--clr-amber-rgb),0.45)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>⚠</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fcd34d", margin: "0 0 4px" }}>
                          RA is growing — your payout is below the interest your RA earns
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                          Your monthly payout ({formatCurrency(rssMonthlyAmt)}/mo) is less than the interest your RA earns at the
                          4% base rate (~{formatCurrency(breakEvenMonthly)}/mo on {formatCurrency(currentRaBal)}). Your RA will grow, not
                          deplete — hence the upward chart. To project a depletion date, increase your monthly payout
                          above ~{formatCurrency(breakEvenMonthly)}/mo. The actual break-even is slightly higher because your RA also
                          earns an extra 1% on the first $60k and an additional 1% on the first $30k.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* KPI cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  {[
                    [raAtPayoutStartIsCurrent ? "Current RA" : "RA at Payout Start", formatCurrency(raAtPayoutStart), "var(--clr-blue)", raAtPayoutStartIsCurrent ? `Current RA balance (payout started at age ${rssStartAge}, before the simulation window — using current balance as proxy)` : `RA balance at age ${rssStartAge} when drawdowns began`],
                    ["Monthly Payout", rssMonthlyAmt > 0 ? formatCurrency(rssMonthlyAmt) + "/mo" : "Not set", rssMonthlyAmt > 0 ? "var(--clr-green)" : "var(--clr-red)", "Fixed CPF Board RSS monthly amount"],
                    ["Annual Drawdown", rssMonthlyAmt > 0 ? formatCurrency(rssMonthlyAmt * 12) + "/yr" : "—", "var(--clr-blue)", "Total annual RA debit"],
                    ["Est. Depletion Age", depletionAge != null ? `Age ${depletionAge}` : rssMonthlyAmt > 0 ? ">95" : "Set payout", depletionAge != null && depletionAge < 85 ? "var(--clr-red)" : "var(--clr-green)", "Age when RA balance hits $0"],
                  ].map(([label, val, col, tip]) => (
                    <div key={label} title={tip} style={{ background: "var(--bg-muted)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border-subtle)", cursor: "help" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: col, fontFamily: "monospace", margin: 0 }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* RA Drawdown Area Chart */}
                {raChartData.length > 0 && rssMonthlyAmt > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-highlight)", margin: "0 0 10px" }}>RA Balance — Drawdown Curve</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={raChartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="rssRaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="var(--clr-blue)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--clr-blue)" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="age" tick={{ fontSize: 10, fill: "var(--chart-text)" }} tickLine={false} />
                        <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "var(--chart-text)" }} tickLine={false} width={52} />
                        <Tooltip formatter={(v) => [formatCurrency(v), "RA Balance"]} labelFormatter={(l) => `Age ${l}`} contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid var(--tooltip-border)", borderRadius: 8, fontSize: 10 }} />
                        {depletionAge != null && <ReferenceLine x={depletionAge} stroke="var(--clr-red)" strokeDasharray="4 2" label={{ value: `Depleted age ${depletionAge}`, fill: "var(--clr-red)", fontSize: 9, position: "insideTopRight" }} />}
                        <Area type="monotone" dataKey="ra" stroke="var(--clr-blue)" fill="url(#rssRaGrad)" strokeWidth={2} dot={false} name="RA Balance" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Year-by-year drawdown table */}
                {raChartData.length > 0 && rssMonthlyAmt > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-highlight)", margin: "0 0 10px" }}>Year-by-Year Drawdown</p>
                    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: "var(--bg-muted)" }}>
                            {["Age", "RA (Start of Year)", "Interest Earned", "Payout", "RA (End of Year)", "Mode"].map(h => (
                              <th key={h} style={{ padding: "8px 12px", textAlign: h === "Age" ? "center" : "right", fontWeight: 700, color: "var(--text-highlight)", fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {raChartData.slice(0, 35).map((row, idx) => {
                            const prevRa = idx === 0 ? raAtPayoutStart : (raChartData[idx - 1]?.ra || 0);
                            const isDepleted = row.rssDepletionAge != null && row.age === row.rssDepletionAge;
                            const isAfterDepletion = row.rssDepletionAge != null && row.age > row.rssDepletionAge;
                            const isMigrationYear = row.migrationActivated && (idx === 0 ? false : !raChartData[idx-1]?.migrationActivated);
                            const interest = row.age >= 55 ? Math.round(row.yearSaRaInterest || 0) : 0;
                            const modeLabel = row.migrationActivated ? "CPF LIFE" : "RSS";
                            const modeColor = row.migrationActivated ? "var(--clr-purple)" : "var(--clr-blue)";
                            return (
                              <tr key={row.age} style={{ background: isMigrationYear ? "rgba(var(--clr-purple-rgb),0.08)" : isDepleted ? "rgba(239,68,68,0.08)" : isAfterDepletion ? "rgba(239,68,68,0.03)" : idx % 2 === 0 ? "transparent" : "var(--bg-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                                <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: 700, color: isDepleted ? "var(--clr-red)" : isMigrationYear ? "var(--clr-purple)" : "var(--text-bright)", fontFamily: "monospace" }}>{row.age}{isDepleted ? " ⚠" : isMigrationYear ? " 🔄" : ""}</td>
                                <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "monospace", color: "var(--text-muted)" }}>{formatCurrency(prevRa)}</td>
                                <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "monospace", color: "var(--clr-green)" }}>+{formatCurrency(interest)}</td>
                                <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "monospace", color: row.rssPayoutThisYear > 0 ? (row.migrationActivated ? "var(--clr-purple)" : "var(--clr-red)") : "var(--text-muted)" }}>
                                  {row.rssPayoutThisYear > 0 ? (row.migrationActivated ? formatCurrency(row.rssPayoutThisYear) + "/yr" : "−" + formatCurrency(row.rssPayoutThisYear)) : "—"}
                                </td>
                                <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: row.ra <= 0 ? "var(--clr-red)" : "var(--text-bright)" }}>{formatCurrency(row.ra)}</td>
                                <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 10, color: modeColor, fontWeight: 700 }}>{modeLabel}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Migration Comparison Panel — only shown when lifeMigrationAge > 0 */}
                {(() => {
                  const migAge = Number(debouncedInputs.lifeMigrationAge) || 0;
                  if (migAge === 0) return null;
                  // Get first post-migration row to read postMigrationPayout
                  const firstMigrRow = displayAccumulation.find(r => r.migrationActivated);
                  const postMigrMonthly = firstMigrRow?.postMigrationPayout || 0;
                  const migrWarning = displayAccumulation.find(r => r.migrationRaWarning);
                  // Migration comparison chart data: annotate each row with the "stay on RSS" scenario
                  // We build a secondary dataset showing what RSS-only depletion would look like
                  // by finding the rssDepletionAge from a no-migration projection.
                  // For simplicity in PR-3 we show: actual (with migration) vs RSS-only (no migration)
                  // The no-migration data is the pre-migration rows extended with $0 after depletion.
                  const migChartData = raChartData.map(r => ({
                    age: r.age,
                    ra_actual: r.ra,
                    payout_actual: Math.round(r.rssPayoutThisYear / 12), // monthly for display
                    isMigrated: r.migrationActivated,
                  }));
                  return (
                    <div style={{ background: "rgba(var(--clr-purple-rgb),0.05)", border: "1px solid rgba(var(--clr-purple-rgb),0.25)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--clr-violet2)", margin: 0 }}>🔄 Migration to CPF LIFE at Age {migAge}</p>
                        {migrWarning && (
                          <div style={{ fontSize: 10, color: "var(--clr-amber)", background: "rgba(var(--clr-amber-rgb),0.1)", border: "1px solid rgba(var(--clr-amber-rgb),0.3)", borderRadius: 6, padding: "4px 8px" }}>
                            ⚠ RA was below $60,000 at migration age — migration skipped by engine. Increase your RSTU top-up or choose an earlier migration age.
                          </div>
                        )}
                      </div>

                      {!migrWarning && postMigrMonthly > 0 && (
                        <>
                          {/* KPI row */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            {[
                              ["RSS Payout (pre-migration)", rssMonthlyAmt > 0 ? formatCurrency(rssMonthlyAmt) + "/mo" : "—", "var(--clr-blue)"],
                              ["CPF LIFE Payout (post-migration)", postMigrMonthly > 0 ? formatCurrency(postMigrMonthly) + "/mo" : "Computing...", "var(--clr-purple)"],
                              ["Payout difference", postMigrMonthly > 0 && rssMonthlyAmt > 0 ? `${postMigrMonthly > rssMonthlyAmt ? "+" : ""}${formatCurrency(postMigrMonthly - rssMonthlyAmt)}/mo` : "—", postMigrMonthly >= rssMonthlyAmt ? "var(--clr-green)" : "var(--clr-red)"],
                            ].map(([label, val, col]) => (
                              <div key={label} style={{ background: "var(--bg-muted)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border-subtle)" }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
                                <p style={{ fontSize: 14, fontWeight: 900, color: col, fontFamily: "monospace", margin: 0 }}>{val}</p>
                              </div>
                            ))}
                          </div>

                          {/* Monthly payout over time chart */}
                          {migChartData.length > 0 && (
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)", margin: "0 0 8px" }}>Monthly Payout — RSS Phase → CPF LIFE Phase</p>
                              <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={migChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                                  <defs>
                                    <linearGradient id="rssPayGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%"  stopColor="var(--clr-blue)" stopOpacity={0.5} />
                                      <stop offset="95%" stopColor="var(--clr-blue)" stopOpacity={0.05} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                                  <XAxis dataKey="age" tick={{ fontSize: 10, fill: "var(--chart-text)" }} tickLine={false} />
                                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10, fill: "var(--chart-text)" }} tickLine={false} width={48} />
                                  <Tooltip formatter={(v, n) => [formatCurrency(v) + "/mo", n === "payout_actual" ? (migChartData.find(r => r.isMigrated) ? "CPF LIFE / RSS payout" : "RSS payout") : n]} labelFormatter={l => `Age ${l}`} contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid var(--tooltip-border)", borderRadius: 8, fontSize: 10 }} />
                                  {migAge > 0 && <ReferenceLine x={migAge} stroke="var(--clr-purple)" strokeDasharray="4 2" label={{ value: `Migration age ${migAge}`, fill: "var(--clr-purple)", fontSize: 9, position: "insideTopLeft" }} />}
                                  <Area type="monotone" dataKey="payout_actual" stroke="var(--clr-blue)" fill="url(#rssPayGrad)" strokeWidth={2} dot={false} name="Monthly Payout" />
                                </AreaChart>
                              </ResponsiveContainer>
                              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "6px 0 0" }}>
                                Payout jumps/drops at age {migAge} when RSS fixed drawdown converts to CPF LIFE Standard plan.
                                CPF LIFE payout is guaranteed for life — no depletion risk post-migration.
                              </p>
                            </div>
                          )}

                          {/* Decision summary */}
                          <div style={{ background: "var(--bg-muted)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border-subtle)", fontSize: 11, lineHeight: 1.7, color: "var(--text-muted)" }}>
                            <strong style={{ color: "var(--text-highlight)" }}>Migration trade-off summary:</strong>
                            {" "}Migrating at age {migAge} converts your RSS drawdown to a CPF LIFE Standard annuity paying{" "}
                            <strong style={{ color: "var(--clr-purple)" }}>{formatCurrency(postMigrMonthly)}/mo for life</strong>.
                            {" "}Under RSS you currently receive <strong style={{ color: "var(--clr-blue)" }}>{formatCurrency(rssMonthlyAmt)}/mo</strong>{depletionAge != null ? ` until age ${depletionAge}, then $0` : " until RA depletes"}.
                            {" "}CPF LIFE eliminates longevity risk — you receive payouts regardless of how long you live.
                          </div>
                        </>
                      )}
                      {!migrWarning && postMigrMonthly === 0 && (
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Migration comparison will appear once the projection has computed the post-migration payout. Check your RSS Monthly Payout and RA balance in the sidebar.</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              );
            })()}

  );
}
