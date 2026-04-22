import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Scale } from "lucide-react";
import { formatCurrency } from "../utils/helpers.js";

// CompareTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function CompareTab({ inputs, projection, scenarioA, scenarioB, scenarioLabelA, scenarioLabelB, comparisonData, highlightPlan, setScenarioA, setScenarioB, setScenarioLabelA, setScenarioLabelB, handleExportScenarioDiff }) {
  return (
              <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Scale style={{ width: 18, height: 18, color: "var(--clr-green)" }} />Compare Scenarios</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Change your inputs, then save to Slot A or B. Both scenarios persist for comparison.</p>
                {/* Compare tab explanation */}
                <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--bg-panel-muted)", border: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
                  <p style={{ fontWeight: 700, color: "var(--text-highlight)", marginBottom: 6, fontSize: 12 }}>🔀 How to use this tab</p>
                  <ol style={{ paddingLeft: 18, margin: 0, fontSize: 10, lineHeight: 1.8 }}>
                    <li><strong style={{ color: "var(--text-bright)" }}>Set up Scenario A:</strong> Configure your inputs in the sidebar for your first scenario (e.g. retire at 65), then click <em>Save Current as A</em>.</li>
                    <li><strong style={{ color: "var(--text-bright)" }}>Change inputs for Scenario B:</strong> Adjust your inputs (e.g. change payout age to 70, increase RSTU top-up), then click <em>Save Current as B</em>.</li>
                    <li><strong style={{ color: "var(--text-bright)" }}>View the chart:</strong> The line chart shows total CPF balance year-by-year for both scenarios from your current age to 95. Blue = Scenario A, Orange = Scenario B.</li>
                    <li><strong style={{ color: "var(--text-bright)" }}>Scenario configuration:</strong> Each saved slot shows all inputs that differ from the default — so you can quickly see what changed between the two scenarios.</li>
                  </ol>
                  <p style={{ fontSize: 10, color: "var(--text-subtle)", marginTop: 6 }}>💡 <strong>Tip:</strong> Give each scenario a descriptive label (e.g. "Retire at 65" vs "Defer to 70") using the label field to make the chart legend readable.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {/* ── Slot A ── */}
                  {(() => {
                    const color = "var(--clr-blue2)", bg = "rgba(var(--clr-blue2-rgb),0.08)", border = "rgba(var(--clr-blue2-rgb),0.2)";
                    return (
                      <div style={{ padding: 16, borderRadius: 14, background: bg, border: `1px solid ${border}`, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <h4 style={{ fontWeight: 700, color, fontSize: 14 }}>Scenario A</h4>
                          {scenarioA && <button onClick={() => { setScenarioA(null); setScenarioLabelA(""); }} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
                        </div>
                        <input type="text" value={scenarioLabelA} onChange={e => setScenarioLabelA(e.target.value)} placeholder="Label (e.g. Retire at 65)" style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel-muted)", border: `1px solid ${border}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 11, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
                        {scenarioA ? (
                          <div style={{ flex: 1, marginBottom: 16 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Scenario Configuration (vs Default)</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                              {/* BUG-47 fix: use String() coercion — JSON-imported profiles have numeric fields as strings, causing "65" !== 65 false diffs */}
                              {/* BUG-1 fix: guard against array/object values (e.g. lifeEvents) being passed as raw React children,
                                  which throws "Objects are not valid as a React child" and crashes the Compare tab.
                                  Arrays → show count; booleans → Yes/No; objects → JSON; primitives → as-is. */}
                              {Object.keys(DEFAULT_INPUTS).filter(k => (String(scenarioA.inputs[k]) !== String(DEFAULT_INPUTS[k]) || k === 'payoutAge' || k === 'currentAge') && k !== 'name').map(k => {
                                const rawVal = scenarioA.inputs[k];
                                const displayVal = Array.isArray(rawVal)
                                  ? `${rawVal.length} event${rawVal.length !== 1 ? 's' : ''}`
                                  : typeof rawVal === 'boolean'
                                    ? (rawVal ? 'Yes' : 'No')
                                    : (rawVal !== null && typeof rawVal === 'object')
                                      ? JSON.stringify(rawVal)
                                      : rawVal;
                                return (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-base)", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{SCENARIO_LABELS[k] || k}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--clr-emerald)", fontFamily: "monospace" }}>{displayVal}</span>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 16 }}>Empty — configure inputs then save</div>
                        )}
                        <button onClick={() => {
                          // BUG-42 fix: always save nominal (non-deflated) engine output — see original comment.
                          // BUG-3 fix: compute projection from live `inputs`, not the debounce-lagged `projection`
                          // variable. If the user clicks Save within the 180ms debounce window the stored
                          // projection would be one step behind the stored inputs, causing the Compare chart
                          // to show mismatched lines. runProjectionEngine is module-level — safe to call here.
                          // payoutProj set to null: the Compare tab's getNetWorth fallback handles it correctly.
                          const freshProj = runProjectionEngine({ ...inputs });
                          setScenarioA({ inputs: { ...inputs }, projection: freshProj, payoutProj: null });
                        }} style={{ width: "100%", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: `${color}22`, color, marginTop: "auto" }}>Save Current as A</button>
                      </div>
                    );
                  })()}
                  {/* ── Slot B ── */}
                  {(() => {
                    const color = "#f97316", bg = "rgba(249,115,22,0.08)", border = "rgba(249,115,22,0.2)";
                    return (
                      <div style={{ padding: 16, borderRadius: 14, background: bg, border: `1px solid ${border}`, display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <h4 style={{ fontWeight: 700, color, fontSize: 14 }}>Scenario B</h4>
                          {scenarioB && <button onClick={() => { setScenarioB(null); setScenarioLabelB(""); }} style={{ fontSize: 10, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
                        </div>
                        <input type="text" value={scenarioLabelB} onChange={e => setScenarioLabelB(e.target.value)} placeholder="Label (e.g. Retire at 70)" style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel-muted)", border: `1px solid ${border}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 11, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
                        {scenarioB ? (
                          <div style={{ flex: 1, marginBottom: 16 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Scenario Configuration (vs Default)</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                              {/* BUG-47 fix: use String() coercion — JSON-imported profiles have numeric fields as strings, causing "65" !== 65 false diffs */}
                              {/* BUG-1 fix: same array/object guard as Scenario A — prevents crash when lifeEvents (or any future array field) is in scenarioB.inputs */}
                              {Object.keys(DEFAULT_INPUTS).filter(k => (String(scenarioB.inputs[k]) !== String(DEFAULT_INPUTS[k]) || k === 'payoutAge' || k === 'currentAge') && k !== 'name').map(k => {
                                const rawVal = scenarioB.inputs[k];
                                const displayVal = Array.isArray(rawVal)
                                  ? `${rawVal.length} event${rawVal.length !== 1 ? 's' : ''}`
                                  : typeof rawVal === 'boolean'
                                    ? (rawVal ? 'Yes' : 'No')
                                    : (rawVal !== null && typeof rawVal === 'object')
                                      ? JSON.stringify(rawVal)
                                      : rawVal;
                                return (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-base)", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{SCENARIO_LABELS[k] || k}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--clr-emerald)", fontFamily: "monospace" }}>{displayVal}</span>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginBottom: 16 }}>Empty — configure inputs then save</div>
                        )}
                        <button onClick={() => {
                          // BUG-42 fix: always save nominal engine output (see Scenario A comment above).
                          // BUG-3 fix: compute fresh projection from live inputs — same reason as Scenario A.
                          const freshProj = runProjectionEngine({ ...inputs });
                          setScenarioB({ inputs: { ...inputs }, projection: freshProj, payoutProj: null });
                        }} style={{ width: "100%", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: `${color}22`, color, marginTop: "auto" }}>Save Current as B</button>
                      </div>
                    );
                  })()}
                </div>
                {scenarioA && scenarioB ? (<div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--text-bright)" }}>Y-axis: Cumulative Total Yield ($)</strong> — the sum of all CPF LIFE payouts received to date plus the remaining bequest (death benefit) value at each age, under the <strong style={{ color: "var(--clr-green)" }}>{highlightPlan}</strong> plan. A higher line means more total financial value returned from CPF over your lifetime. The lines diverge where payout age, contribution amount, or RA size creates a lasting difference in returns.
                  </p>
                  <div style={{ height: 350 }}>
                    <ResponsiveContainer width="99%" height="100%">
                      <LineChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="age" stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "Age", position: "insideBottomRight", offset: -5, fill: "var(--chart-text)", fontSize: 10 }} />
                        <YAxis tickFormatter={v => `$${v > 999 ? (v / 1000).toFixed(0) + "k" : v}`} stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "Cumulative Total Yield", angle: -90, position: "insideLeft", offset: 10, fill: "var(--chart-text)", fontSize: 9, style: { textAnchor: "middle" } }} />
                        <Tooltip contentStyle={{ background: "var(--tooltip-bg)", backdropFilter: "blur(4px)", border: "1px solid var(--tooltip-border)", borderRadius: 8, fontSize: 10, padding: "6px 8px" }} itemStyle={{ padding: 0, color: "var(--tooltip-text)" }} labelStyle={{ fontSize: 10, color: "var(--tooltip-label)", marginBottom: 2 }} formatter={(v, n) => [formatCurrency(v), n]} labelFormatter={v => `Age ${v}`} wrapperStyle={{ pointerEvents: "none" }} />
                        <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 600, color: "var(--text-main)" }} />
                        <Line isAnimationActive={false} type="monotone" dataKey="yieldA" stroke="var(--clr-blue2)" strokeWidth={3} dot={false} name={`Slot A${scenarioLabelA ? `: ${scenarioLabelA}` : ""}`} />
                        <Line isAnimationActive={false} type="monotone" dataKey="yieldB" stroke="#f97316" strokeWidth={3} dot={false} name={`Slot B${scenarioLabelB ? `: ${scenarioLabelB}` : ""}`} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Rev #24 — Export diff button */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <button
                      onClick={handleExportScenarioDiff}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(var(--clr-green-rgb),0.10)", color: "var(--clr-green)", border: "1px solid rgba(var(--clr-green-rgb),0.35)", cursor: "pointer" }}
                    >
                      <Download style={{ width: 13, height: 13 }} />
                      Export A vs B Diff (CSV)
                    </button>
                  </div>
                </div>) : <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text-muted)", fontStyle: "italic", border: "2px dashed var(--border-strong)", borderRadius: 16 }}>Save both scenarios to view comparison chart</div>}
              </div>
            )}
  );
}
