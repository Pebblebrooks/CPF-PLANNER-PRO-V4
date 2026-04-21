import React from "react";
import { Download, ExternalLink, Printer, Split, AlignJustify as TableIcon } from "lucide-react";
import { formatCurrency } from "../utils/helpers.js";

// TableTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function TableTab({ inputs, projection, displayProjection, displayAccumulation, accumulationByAge, scenarioA, scenarioB, scenarioLabelA, scenarioLabelB, xirrByAge, highlightPlan, payoutAge65, isRSSMode, is55Plus, tableSubTab, setTableSubTab, showDataTableGuide, setShowDataTableGuide, handleExportCSV, handleExportLedgerCSV, handlePrintTable, showToast }) {
  return (
              <div>
                {/* Scenario context banner */}
                {(scenarioA || scenarioB) && (
                  <div style={{ marginBottom: 10, padding: "8px 14px", borderRadius: 10, background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>Viewing:</span>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(var(--clr-emerald-rgb),0.1)", color: "var(--clr-green)", border: "1px solid rgba(var(--clr-emerald-rgb),0.3)", fontWeight: 700, textTransform: "capitalize" }}>{highlightPlan} Plan</span>
                    {scenarioA && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(var(--clr-blue2-rgb),0.1)", color: "var(--clr-blue)", border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", fontSize: 10 }}>Slot A: {scenarioLabelA || "Scenario A"}</span>}
                    {scenarioB && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)", fontSize: 10 }}>Slot B: {scenarioLabelB || "Scenario B"}</span>}
                    <span style={{ fontSize: 10, color: "var(--text-subtle)", marginLeft: "auto" }}>Data shows current inputs · switch plans via LIFE tab</span>
                  </div>
                )}
                {/* Sub-tab toggle + guide button */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                  {[["projection", "📋 Projection Table"], ["ledger", "💰 Cashflow Ledger"]].map(([id, label]) => (
                    <button key={id} onClick={() => setTableSubTab(id)} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid", cursor: "pointer",
                      background: tableSubTab === id ? "rgba(var(--clr-emerald-rgb),0.15)" : "transparent",
                      color: tableSubTab === id ? "var(--clr-green)" : "var(--text-muted)",
                      borderColor: tableSubTab === id ? "rgba(var(--clr-emerald-rgb),0.4)" : "var(--border-strong)" }}>
                      {label}
                    </button>
                  ))}
                  {tableSubTab === "projection" && (
                    <button onClick={() => setShowDataTableGuide(v => !v)}
                      style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        border: `1px solid ${showDataTableGuide ? "rgba(var(--clr-blue-rgb),0.5)" : "var(--border-strong)"}`,
                        background: showDataTableGuide ? "rgba(var(--clr-blue-rgb),0.12)" : "transparent",
                        color: showDataTableGuide ? "var(--clr-blue)" : "var(--text-muted)", cursor: "pointer" }}>
                      {showDataTableGuide ? "Hide Guide" : "Show Guide"}
                    </button>
                  )}
                </div>

                {/* ── CASHFLOW LEDGER ── */}
                {tableSubTab === "ledger" && (() => {
                  const pa = Number(inputs.payoutAge) || 65;
                  const ledgerRows = displayAccumulation;
                  const fc2 = v => v === 0 ? "—" : `$${(v/1000).toFixed(1)}k`;
                  return (
                    <div>
                      <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 12, background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-muted)" }}>
                        <p style={{ fontWeight: 700, color: "var(--text-highlight)", marginBottom: 6, fontSize: 12 }}>💰 Annual Cashflow Ledger — every inflow, outflow, and interest component year by year</p>
                        <p style={{ fontSize: 10, lineHeight: 1.6, margin: 0 }}>
                          <strong style={{ color: "var(--clr-green)" }}>Inflows:</strong> Mandatory contributions · Voluntary (VC3A/RSTU/VHR/Cash MA) · Gov grants/MRSS/MMSS/WIS &nbsp;|&nbsp;
                          <strong style={{ color: "var(--clr-blue)" }}>Interest:</strong> OA (2.5%) · {is55Plus ? "RA" : "SA"} (4%) · MA (4%) &nbsp;|&nbsp;
                          <strong style={{ color: "#f472b6" }}>Outflows:</strong> Housing loan · Medical · OA Drawdown · CPFIS (OA+SA) · Education Loan · Loved-one transfers
                        </p>
                      </div>
                      {/* Export bar — matches projection table style */}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                        <button onClick={handleExportLedgerCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(var(--clr-emerald-rgb),0.15)", color: "var(--clr-green)", border: "1px solid rgba(var(--clr-emerald-rgb),0.3)", cursor: "pointer" }}>
                          <Download style={{ width: 11, height: 11 }} />Download CSV
                        </button>
                      </div>
                      {/* Single scroll container handles both axes — required for position:sticky
                          on thead to work correctly. Split outer/inner divs break sticky on mobile
                          because the thead's scroll parent becomes the inner div which loses its
                          fixed height context when the page reflows to height:auto on small screens. */}
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 540, borderRadius: 16, background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", WebkitOverflowScrolling: "touch" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: "monospace" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                            <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border-strong)" }}>
                              {["Age", "Mandatory", "Voluntary", "Grants/WIS", "OA Int.", is55Plus ? "RA Int." : "SA Int.", "MA Int.", "▶ Total In", "Housing Out", "Medical Out", "OA Draw", "Edu Loan Out", "Loved One Out", "CPFIS Out", "Events In", "Events Out", "▶ Total Out", "Net Flow"].map((h, i) => (
                                <th key={h} style={{ padding: "6px 8px", textAlign: i === 0 ? "center" : "right", fontSize: 9, fontWeight: 800, color: i === 14 ? "var(--clr-emerald)" : i === 15 ? "var(--clr-purple)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
                                  ...(i === 0 ? { position: "sticky", left: 0, zIndex: 20, background: "var(--bg-base)", boxShadow: "var(--shadow-sticky)" } : {}) }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ledgerRows.map((row, i) => {
                              const isPayout = row.age === pa;
                              const mandatory = row.yearMandatory || 0;
                              const voluntary = row.yearVoluntary || 0;
                              const grants = row.yearGovGrants || 0;
                              const oaInt = row.yearOaInterest || 0;
                              const saRaInt = row.yearSaRaInterest || 0;
                              const maInt = row.yearMaInterest || 0;
                              const housOut = row.yearHousingOut || 0;
                              const medOut = row.yearMedOut || 0;
                              const oaDraw = row.yearOaDrawOut || 0;
                              const eduOut = row.yearEduOut || 0;
                              const lovedOut = row.yearLovedOneOut || 0;
                              const cpfisOut = row.yearCpfisOut || 0;
                              const eventsIn = row.yearEventsIn || 0;
                              const eventsOut = row.yearEventsOut || 0;
                              const totalIn = mandatory + voluntary + grants + oaInt + saRaInt + maInt + eventsIn;
                              const totalOut = housOut + medOut + oaDraw + eduOut + lovedOut + cpfisOut + eventsOut;
                              const net = totalIn - totalOut;
                              return (
                                <tr key={row.age} style={{ borderBottom: "1px solid var(--border-subtle)", background: isPayout ? "rgba(var(--clr-emerald-rgb),0.08)" : i % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                                  <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: isPayout ? 900 : 600, color: isPayout ? "var(--clr-emerald)" : "var(--text-highlight)", position: "sticky", left: 0, zIndex: 5, background: isPayout ? "rgba(var(--clr-emerald-rgb),0.12)" : "var(--bg-panel)", boxShadow: "var(--shadow-sticky)", whiteSpace: "nowrap" }}>{row.age}{isPayout ? " ★" : ""}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-green)" }}>{fc2(mandatory)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "#6ee7b7" }}>{fc2(voluntary)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-violet)" }}>{fc2(grants)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-blue)" }}>{fc2(oaInt)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-indigo)" }}>{fc2(saRaInt)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-violet2)" }}>{fc2(maInt)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: "var(--clr-green)", borderLeft: "1px solid var(--border-subtle)" }}>{fc2(totalIn)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "#f472b6" }}>{fc2(housOut)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "#fb7185" }}>{fc2(medOut)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-red)" }}>{fc2(oaDraw)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-orange)" }}>{fc2(eduOut)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "#fca5a5" }}>{fc2(lovedOut)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-orange)" }}>{fc2(cpfisOut)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-emerald)", fontWeight: eventsIn > 0 ? 700 : 400 }}>{fc2(eventsIn)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--clr-purple)", fontWeight: eventsOut > 0 ? 700 : 400 }}>{fc2(eventsOut)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: "#f472b6", borderLeft: "1px solid var(--border-subtle)" }}>{fc2(totalOut)}</td>
                                  <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: net >= 0 ? "var(--clr-green)" : "var(--clr-red)" }}>{net >= 0 ? "+" : "-"}{fc2(Math.abs(net))}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            {(() => {
                              const t = ledgerRows.reduce((a, r) => ({
                                mandatory: a.mandatory+(r.yearMandatory||0), voluntary: a.voluntary+(r.yearVoluntary||0),
                                grants: a.grants+(r.yearGovGrants||0), oaInt: a.oaInt+(r.yearOaInterest||0),
                                saRaInt: a.saRaInt+(r.yearSaRaInterest||0), maInt: a.maInt+(r.yearMaInterest||0),
                                housOut: a.housOut+(r.yearHousingOut||0), medOut: a.medOut+(r.yearMedOut||0),
                                oaDraw: a.oaDraw+(r.yearOaDrawOut||0), eduOut: a.eduOut+(r.yearEduOut||0),
                                lovedOut: a.lovedOut+(r.yearLovedOneOut||0),
                                cpfisOut: a.cpfisOut+(r.yearCpfisOut||0),
                                eventsIn: a.eventsIn+(r.yearEventsIn||0),
                                eventsOut: a.eventsOut+(r.yearEventsOut||0),
                              }), {mandatory:0,voluntary:0,grants:0,oaInt:0,saRaInt:0,maInt:0,housOut:0,medOut:0,oaDraw:0,eduOut:0,lovedOut:0,cpfisOut:0,eventsIn:0,eventsOut:0});
                              const fc3 = v => v===0?"—":`$${(v/1000).toFixed(0)}k`;
                              const totalIn = t.mandatory+t.voluntary+t.grants+t.oaInt+t.saRaInt+t.maInt+t.eventsIn;
                              const totalOut = t.housOut+t.medOut+t.oaDraw+t.eduOut+t.lovedOut+t.cpfisOut+t.eventsOut;
                              const net = totalIn - totalOut;
                              return (
                                <tr style={{ borderTop: "2px solid var(--border-strong)", background: "var(--bg-panel)", fontWeight: 800 }}>
                                  <td style={{ padding: "7px 8px", textAlign: "center", color: "var(--text-bright)", fontSize: 9, position: "sticky", left: 0, zIndex: 5, background: "var(--bg-panel)", boxShadow: "var(--shadow-sticky)", fontWeight: 800 }}>TOTAL</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-green)" }}>{fc3(t.mandatory)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "#6ee7b7" }}>{fc3(t.voluntary)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-violet)" }}>{fc3(t.grants)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-blue)" }}>{fc3(t.oaInt)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-indigo)" }}>{fc3(t.saRaInt)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-violet2)" }}>{fc3(t.maInt)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 900, color: "var(--clr-green)", borderLeft: "1px solid var(--border-strong)" }}>{fc3(totalIn)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "#f472b6" }}>{fc3(t.housOut)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "#fb7185" }}>{fc3(t.medOut)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-red)" }}>{fc3(t.oaDraw)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-orange)" }}>{fc3(t.eduOut)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "#fca5a5" }}>{fc3(t.lovedOut)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-orange)" }}>{fc3(t.cpfisOut)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-emerald)", fontWeight: 900 }}>{fc3(t.eventsIn)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-purple)", fontWeight: 900 }}>{fc3(t.eventsOut)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 900, color: "#f472b6", borderLeft: "1px solid var(--border-strong)" }}>{fc3(totalOut)}</td>
                                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 900, color: net>=0?"var(--clr-green)":"var(--clr-red)" }}>{net>=0?"+":"-"}{fc3(Math.abs(net))}</td>
                                </tr>
                              );
                            })()}
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* ── PROJECTION TABLE ── */}
                {tableSubTab === "projection" && (<>
                {/* Data Table explanation — toggled by Show/Hide Guide button */}
                {showDataTableGuide && (
                <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 14, background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  <p style={{ fontWeight: 700, color: "var(--text-highlight)", marginBottom: 8, fontSize: 12 }}>📋 Data Table — Column Guide</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8, marginBottom: 8 }}>
                    {[
                      ["Age", "Year of life. Green row = your payout age (CPF LIFE begins).", "var(--text-muted)"],
                      ["OA", "Ordinary Account balance at year end. Earns 2.5% p.a.", "#93c5fd"],
                      ["MA", "MediSave Account balance. Earns 4% p.a. Capped at BHS.", "#6ee7b7"],
                      [is55Plus ? "RA" : "SA", "Special Account (pre-55) or Retirement Account (post-55). Earns 4% p.a.", "var(--clr-green)"],
                      ["Inflows (+)", "Total annual inflows that year: contributions + voluntary top-ups + grants.", "#6ee7b7"],
                      ["Outflows (−)", "Total annual outflows: housing loan and medical deductions.", "#f9a8d4"],
                      ["Bas/Std/Esc Pay", "Annual payout received under each LIFE plan. Shows '−' before payout age.", "var(--clr-orange)"],
                      ["Bas/Std/Esc Beq", "Bequest (death benefit) value at that age under each plan.", "var(--text-muted)"],
                      ["Yield (B/S/E)", "Cumulative total yield = all payouts received + current bequest value. Measures the total financial return of each plan.", "var(--clr-blue)"],
                      ["XIRR", "Internal Rate of Return of the highlighted plan at each age. Compares total return vs all contributions made. Green = good (>4%), yellow = moderate, red = below CPF rates.", "var(--clr-violet)"],
                    ].map(([col, desc, color]) => (
                      <div key={col} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border-subtle)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 3 }}>{col}</div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: "var(--text-subtle)" }}>
                    💡 <strong>Before payout age</strong>: Pay, Bequest, Yield, and XIRR columns show "−" — payouts haven't started yet. &nbsp;
                    The <strong>Lifetime Summary</strong> header above the table shows totals across your full life (age {inputs.currentAge} → 95). &nbsp;
                    Use <strong>Download CSV</strong> to export all columns to a spreadsheet.
                  </p>
                </div>
                )}
                {(() => {
                  const lastBase = displayAccumulation[displayAccumulation.length - 1] || {};
                  const lastRow = displayProjection[displayProjection.length - 1] || {};
                  // S5 fix: for RSS members, totalPayouts must sum rssPayoutThisYear (stored on each
                  // projection row), not highlightPlan Annual (which is CPF LIFE-specific and is 0).
                  const totalPayouts = isRSSMode
                    ? displayProjection.reduce((s, r) => s + (r.rssPayoutThisYear || 0), 0)
                    : displayProjection.filter(r => r.age >= payoutAge65).reduce((s, r) => s + (r[`${highlightPlan}Annual`] || 0), 0);
                  const summaryLabel = isRSSMode ? 'RSS' : highlightPlan.toUpperCase();
                  const summaryColor = isRSSMode ? '#60a5fa' : '#34d399';
                  return (<div style={{ marginBottom: 16, background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}><TableIcon style={{ width: 14, height: 14, color: summaryColor }} />Lifetime Summary — <span style={{ color: summaryColor }}>{summaryLabel}</span></h4>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Age {inputs.currentAge} → 95</span>
                    </div>
                    <div className="rg-6" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
                      {[["Total Contributions", lastBase.cumulativeInjected, "var(--clr-green)"], ["Total Interest", lastBase.cumulativeInterest, "var(--clr-blue)"], ["Total Outflows", lastBase.cumulativeOutflow, "#f472b6"], [isRSSMode ? "Total RSS Payouts" : "Total Payouts", totalPayouts, "var(--clr-orange)"], ["Final Bequest", lastRow[`${highlightPlan}Bequest`] || 0, "var(--clr-amber)"], ["Net Worth @ 95", lastRow[`${highlightPlan}NetWorth`] || 0, "var(--text-bright)"]].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 10 }}>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, lineHeight: 1.3 }}>{label}</p>
                          <p style={{ fontSize: 12, fontWeight: 900, color, fontFamily: "monospace" }}>{formatCurrency(val || 0)}</p>
                        </div>
                      ))}
                    </div>
                  </div>);
                })()}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  {/* Q2 fix: RSS members have no CPF LIFE plan — suppress "STANDARD plan" label */}
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Year-by-year projection · <span style={{ color: isRSSMode ? "var(--clr-blue)" : "var(--text-bright)", fontWeight: 700 }}>{isRSSMode ? "RSS" : highlightPlan.toUpperCase()}</span> {isRSSMode ? "drawdown" : "plan"}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handlePrintTable} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-strong)", cursor: "pointer" }}>
                      <Printer style={{ width: 11, height: 11 }} />Print
                    </button>
                    <button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(var(--clr-emerald-rgb),0.15)", color: "var(--clr-green)", border: "1px solid rgba(var(--clr-emerald-rgb),0.3)", cursor: "pointer" }}>
                      <Download style={{ width: 11, height: 11 }} />Download CSV
                    </button>
                    <button onClick={() => {
                      // Build CSV and open in Google Sheets via import URL
                      try {
                        const rows = [["Age", "OA", "SA/RA", "MA", "Total CPF", "Inflows", "Outflows", "Std Payout", "Esc Payout", "Bas Payout", "Net Worth"], ...displayProjection.map(r => {
                          const base = accumulationByAge.get(r.age) || {};
                          const pa = Number(inputs.payoutAge) || 65;
                          return [r.age, Math.round(base.oa || 0), Math.round((base.sa || 0) + (base.ra || 0)), Math.round(base.ma || 0), Math.round((base.oa || 0) + (base.sa || 0) + (base.ma || 0) + (base.ra || 0)), Math.round(base.injected || 0), Math.round(base.outflow || 0), r.age >= pa ? Math.round(r.standardAnnual || 0) : "", r.age >= pa ? Math.round(r.escalatingAnnual || 0) : "", r.age >= pa ? Math.round(r.basicAnnual || 0) : "", Math.round(r[`${highlightPlan}NetWorth`] || 0)];
                        })];
                        const csv = rows.map(r => r.join(",")).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = `https://docs.google.com/spreadsheets/d/create?usp=drive_web`;
                        a.target = "_blank";
                        a.click();
                        showToast("✓ Google Sheets opened — paste your CSV data there (or use Download CSV to import)");
                        URL.revokeObjectURL(url);
                      } catch (e) { showToast("Open Google Sheets manually and use File → Import to upload your CSV"); }
                    }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(var(--clr-blue2-rgb),0.15)", color: "var(--clr-blue)", border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", cursor: "pointer" }}>
                      <ExternalLink style={{ width: 11, height: 11 }} />Open in Sheets
                    </button>
                  </div>
                </div>
                <div className="cpf-table-scroll" style={{ overflowX: "auto", overflowY: "auto", maxHeight: 560, borderRadius: 16, background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", WebkitOverflowScrolling: "touch" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 11, fontFamily: "monospace", tableLayout: "auto" }}>
                      <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                        <tr style={{ background: "var(--header-bg)", borderBottom: "1px solid var(--border-strong)" }}>
                          {["Age", "OA", "MA", "SA/RA", "Inflows", "Outflows", ...((Number(inputs.wisAmount) || 0) > 0 ? ["WIS Cash"] : []), "Bas Pay", "Bas Beq", "Std Pay", "Std Beq", "Esc Pay", "Esc Beq", "Yield (B)", "Yield (S)", "Yield (E)", `XIRR (${highlightPlan.charAt(0).toUpperCase() + highlightPlan.slice(1)})`].map((h, i) => (
                            <th key={h} style={{
                              padding: "10px 8px", textAlign: i === 0 ? "left" : "right", fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: i >= 12 ? "var(--clr-blue)" : "var(--text-muted)", whiteSpace: "nowrap",
                              ...(i === 0 ? { position: "sticky", left: 0, zIndex: 20, background: "var(--header-bg)", boxShadow: "var(--shadow-sticky)" } : {})
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayProjection.map(row => {
                          const baseRow = accumulationByAge.get(row.age) || {};
                          const raSaBal = (baseRow.sa || 0) + (row[`${highlightPlan}RA`] || 0);
                          const isPA = row.age >= payoutAge65;            // BUG-43 fix: use debounced payoutAge65
                          const isPayoutAge = row.age === payoutAge65;    // BUG-43 fix: use debounced payoutAge65
                          const rowBg = isPayoutAge ? "rgba(var(--clr-emerald-rgb),0.08)" : "transparent";
                          const c = (v, color = "var(--text-bright)") => <td style={{ padding: "7px 8px", textAlign: "right", color, whiteSpace: "nowrap" }}>{v != null ? formatCurrency(v) : "-"}</td>;
                          return (<tr key={row.age} style={{ borderBottom: "1px solid var(--border-subtle)", background: rowBg }}>
                            <td style={{ padding: "7px 8px", fontWeight: 700, color: isPayoutAge ? "var(--clr-green)" : "var(--text-muted)", fontFamily: "system-ui", position: "sticky", left: 0, zIndex: 5, background: isPayoutAge ? "rgba(var(--clr-emerald-rgb),0.12)" : "var(--bg-panel)", boxShadow: "var(--shadow-sticky)", whiteSpace: "nowrap" }}>{row.age}</td>
                            {c(baseRow.oa)}
                            {c(baseRow.ma)}
                            {c(raSaBal, "var(--clr-green)")}
                            <td style={{ padding: "7px 8px", textAlign: "right", color: "#6ee7b7", whiteSpace: "nowrap" }}>+{formatCurrency(baseRow.injected || 0)}</td>
                            <td style={{ padding: "7px 8px", textAlign: "right", color: "#f9a8d4", whiteSpace: "nowrap" }}>-{formatCurrency(baseRow.outflow || 0)}</td>
                            {(Number(inputs.wisAmount) || 0) > 0 && (
                              <td style={{ padding: "7px 8px", textAlign: "right", color: "#fde68a", whiteSpace: "nowrap" }}>
                                {/* BUG-44 fix: use engine's yearWisCash so wisFreq/wisDur inactive years show $0 */}
                                +{formatCurrency(accumulationByAge.get(row.age)?.yearWisCash ?? 0)}
                              </td>
                            )}
                            <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-orange)", whiteSpace: "nowrap" }}>{isPA ? formatCurrency(row.basicAnnual) : "-"}</td>
                            {c(row.basicBequest, "var(--clr-orange)")}
                            <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--text-bright)", whiteSpace: "nowrap" }}>{isPA ? formatCurrency(row.standardAnnual) : "-"}</td>
                            {c(row.standardBequest)}
                            <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--clr-green)", whiteSpace: "nowrap" }}>{isPA ? formatCurrency(row.escalatingAnnual) : "-"}</td>
                            {c(row.escalatingBequest, "var(--clr-green)")}
                            {c(row.basicTotal, "var(--clr-orange)")}
                            {c(row.standardTotal, "var(--clr-slate)")}
                            {c(row.escalatingTotal, "var(--clr-green)")}
                            {(() => {
                              const pa = payoutAge65; // BUG-43 fix: use debounced payoutAge65
                              if (row.age < pa) return <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--text-muted)", whiteSpace: "nowrap" }}>-</td>;
                              if (row.age < pa + 3) return <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: 9 }}>settling...</td>;
                              const xirr = xirrByAge[highlightPlan]?.[row.age];
                              if (xirr == null) return <td style={{ padding: "7px 8px", textAlign: "right", color: "var(--text-muted)", whiteSpace: "nowrap" }}>—</td>;
                              const irrColor = xirr > 4 ? "var(--clr-green)" : xirr > 2 ? "var(--clr-amber)" : "var(--clr-red)";
                              // Sparkline: map xirr -10% to +10% to 0–100% bar width
                              const barPct = Math.max(0, Math.min(100, ((xirr + 10) / 20) * 100));
                              return (
                                <td style={{ padding: "5px 8px", whiteSpace: "nowrap" }} title={`XIRR at age ${row.age}: ${xirr.toFixed(2)}%`}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                    <div style={{ width: 48, height: 6, background: "var(--bg-muted)", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                                      <div style={{ width: `${barPct}%`, height: "100%", background: irrColor, borderRadius: 3, transition: "width 0.3s" }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: irrColor, fontFamily: "monospace", minWidth: 38, textAlign: "right" }}>{xirr.toFixed(2)}%</span>
                                  </div>
                                </td>
                              );
                            })()}
                          </tr>);
                        })}
                      </tbody>
                    </table>
                </div>
                </>)}
              </div>
            )}
  );
}
