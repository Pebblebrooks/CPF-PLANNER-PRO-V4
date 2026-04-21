import React from "react";
import { Activity, AlertTriangle, Info } from "lucide-react";
import { LIFE_EVENT_TYPES, DRAW_SOURCE_LABELS, WINDFALL_DEST_LABELS } from "../config/constants.js";

// SidebarLifeEvents
// Receives all state as props — no direct App state access.
// Shared props: inputs, setInputs, inputErrors, openSections, toggleSection,
//              handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency
// Section-specific props: projection, leEditingId, setLeEditingId, leFormState, setLeFormState
export default function SidebarLifeEvents({ inputs, setInputs, inputErrors, openSections, toggleSection, handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency,
  projection, leEditingId, setLeEditingId, leFormState, setLeFormState }) {
  return (
    <>
                  <div onClick={() => toggleSection("lifeevents")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("lifeevents"); }}} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("lifeevents") ? "rgba(239,68,68,0.06)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Activity style={{ width: 14, height: 14, color: "#ef4444" }} />
                      <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#ef4444" }}>Life Events</span>
                      {lifeEvents.length > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 800, background: enabledCount > 0 ? "rgba(239,68,68,0.2)" : "rgba(100,116,139,0.2)", color: enabledCount > 0 ? "#ef4444" : "var(--text-muted)", padding: "2px 7px", borderRadius: 10, border: `1px solid ${enabledCount > 0 ? "rgba(239,68,68,0.4)" : "var(--border-strong)"}` }}>
                          {enabledCount} active
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("lifeevents") ? "▲" : "▼"}</span>
                  </div>

                  {openSections.has("lifeevents") && (
                    <div style={{ padding: "0 16px 16px" }}>
                      {/* Intro + global toggle */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 4 }}>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>Overlay stress-test events on your projection — retrenchments, medical crises, windfalls, and more.</p>
                        {lifeEvents.length > 0 && (
                          <button onClick={toggleAll} style={{ flexShrink: 0, marginLeft: 8, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 6, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                            {lifeEvents.some(e => e.enabled !== false) ? "Disable All" : "Enable All"}
                          </button>
                        )}
                      </div>

                      {/* Event list */}
                      {lifeEvents.length === 0 && leEditingId === null && (
                        <div style={{ padding: "14px 0", textAlign: "center", color: "var(--text-subtle)", fontSize: 11 }}>No events yet — click Add Event to get started.</div>
                      )}
                      {lifeEvents.map(ev => {
                        const meta = LIFE_EVENT_TYPES[ev.type] || {};
                        const isEnabled = ev.enabled !== false;
                        const evIdx = lifeEvents.findIndex(e => e.id === ev.id);
                        const evErr = leErrors.find(e => e.idx === evIdx);
                        return (
                          <div key={ev.id} style={{ marginBottom: 6, padding: "8px 10px", borderRadius: 10, background: isEnabled ? "var(--bg-muted)" : "rgba(100,116,139,0.06)", border: `1px solid ${isEnabled ? (meta.color || "#ef4444") + "44" : "var(--border-subtle)"}`, opacity: isEnabled ? 1 : 0.55 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13 }}>{meta.icon || "⚡"}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isEnabled ? (meta.color || "#ef4444") : "var(--text-muted)" }}>{ev.label || meta.label}</span>
                                <span style={{ fontSize: 10, color: "var(--text-subtle)", marginLeft: 6 }}>
                                  Age {ev.startAge}{ev.type !== 'windfall' && ev.type !== 'early_retirement' && ev.endAge !== ev.startAge ? `–${ev.endAge}` : ""}
                                  {ev.magnitude > 0 && ` · ${ev.type === 'hyperinflation' ? `${ev.magnitude}%` : `$${Number(ev.magnitude).toLocaleString()}`}${ev.type === 'medical_crisis' || ev.type === 'retrenchment' || ev.type === 'career_break' || ev.type === 'hyperinflation' ? '/yr' : ''}`}
                                </span>
                              </div>
                              <button onClick={() => toggleEvent(ev.id)} title={isEnabled ? "Disable" : "Enable"} style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, border: `1px solid ${isEnabled ? (meta.color || "#ef4444") + "60" : "var(--border-strong)"}`, background: isEnabled ? `${meta.color || "#ef4444"}18` : "transparent", color: isEnabled ? (meta.color || "#ef4444") : "var(--text-muted)", cursor: "pointer" }}>{isEnabled ? "ON" : "OFF"}</button>
                              <button onClick={() => startEdit(ev)} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-subtle)", cursor: "pointer" }}>✎</button>
                              <button onClick={() => deleteEvent(ev.id)} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "var(--clr-red)", cursor: "pointer" }}>✕</button>
                            </div>
                            {evErr && <p style={{ fontSize: 9, color: "var(--clr-red)", margin: "4px 0 0" }}>⚠ {Object.values(evErr).filter(v => typeof v === 'string').join(" · ")}</p>}
                          </div>
                        );
                      })}

                      {/* Add/Edit inline form */}
                      {leEditingId !== null && (
                        <div style={{ marginTop: 8, padding: "12px 12px", borderRadius: 12, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.25)" }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", textTransform: "uppercase", marginBottom: 10 }}>{leEditingId === 'new' ? "Add Event" : "Edit Event"}</div>

                          {/* Type selector */}
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Event Type</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                              {Object.entries(LIFE_EVENT_TYPES).map(([key, meta]) => (
                                <button key={key} onClick={() => setLeFormState(p => ({ ...p, type: key, label: meta.label, endAge: (meta.isPoint ? p.startAge : p.endAge) || p.startAge }))}
                                  style={{ padding: "5px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, textAlign: "left", border: `1px solid ${leFormState.type === key ? meta.color : "var(--border-strong)"}`, background: leFormState.type === key ? `${meta.color}18` : "transparent", color: leFormState.type === key ? meta.color : "var(--text-muted)", cursor: "pointer" }}>
                                  {meta.icon} {meta.label}
                                </button>
                              ))}
                            </div>
                            {leFormState.type && <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 5 }}>{LIFE_EVENT_TYPES[leFormState.type]?.description}</p>}
                          </div>

                          {/* Label */}
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Label</label>
                            <input type="text" value={leFormState.label || ""} onChange={e => setLeFormState(p => ({ ...p, label: e.target.value }))}
                              style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                          </div>

                          {/* Ages + Magnitude */}
                          <div style={{ display: "grid", gridTemplateColumns: isPoint ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Start Age</label>
                              <input type="text" inputMode="decimal" value={leFormState.startAge ?? ""} onChange={e => setLeFormState(p => ({ ...p, startAge: e.target.value === "" ? "" : Number(e.target.value) }))}
                                style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                            </div>
                            {!isPoint && (
                              <div>
                                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>End Age</label>
                                <input type="text" inputMode="decimal" value={leFormState.endAge ?? ""} onChange={e => setLeFormState(p => ({ ...p, endAge: e.target.value === "" ? "" : Number(e.target.value) }))}
                                  style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                              </div>
                            )}
                            <div>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>
                                {leFormState.type === 'hyperinflation' ? "Rate (%)" : leFormState.type === 'windfall' ? "Amount ($)" : "$/yr"}
                              </label>
                              <input type="text" inputMode="decimal" value={leFormState.magnitude ?? ""} onChange={e => setLeFormState(p => ({ ...p, magnitude: e.target.value === "" ? "" : Number(e.target.value) }))}
                                style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                            </div>
                          </div>

                          {/* Draw Source — medical_crisis only */}
                          {leFormState.type === 'medical_crisis' && (
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Draw From</label>
                              <div style={{ display: "flex", gap: 4 }}>
                                {Object.entries(DRAW_SOURCE_LABELS).map(([key, lbl]) => (
                                  <button key={key} onClick={() => setLeFormState(p => ({ ...p, drawSource: key }))}
                                    style={{ flex: 1, padding: "4px 0", borderRadius: 6, fontSize: 9, fontWeight: 700, border: `1px solid ${leFormState.drawSource === key ? "var(--clr-purple)" : "var(--border-strong)"}`, background: leFormState.drawSource === key ? "rgba(var(--clr-purple-rgb),0.15)" : "transparent", color: leFormState.drawSource === key ? "var(--clr-purple)" : "var(--text-muted)", cursor: "pointer" }}>{lbl}</button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Destination — windfall only */}
                          {leFormState.type === 'windfall' && (
                            <div style={{ marginBottom: 8 }}>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Deposit To</label>
                              <div style={{ display: "flex", gap: 4 }}>
                                {Object.entries(WINDFALL_DEST_LABELS).map(([key, lbl]) => (
                                  <button key={key} onClick={() => setLeFormState(p => ({ ...p, destination: key }))}
                                    style={{ flex: 1, padding: "4px 0", borderRadius: 6, fontSize: 9, fontWeight: 700, border: `1px solid ${leFormState.destination === key ? "var(--clr-emerald)" : "var(--border-strong)"}`, background: leFormState.destination === key ? "rgba(var(--clr-emerald-rgb),0.15)" : "transparent", color: leFormState.destination === key ? "var(--clr-emerald)" : "var(--text-muted)", cursor: "pointer" }}>{lbl}</button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Save / Cancel */}
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button onClick={saveEvent} style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>Save Event</button>
                            <button onClick={() => { setLeEditingId(null); setLeFormState({}); }} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid var(--border-strong)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Add button */}
                      {leEditingId === null && (
                        <button onClick={startNew} style={{ width: "100%", marginTop: 8, padding: "7px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px dashed rgba(239,68,68,0.5)", background: "transparent", color: "#ef4444", cursor: "pointer" }}>
                          + Add Life Event
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Decumulation & Goals — income targets, OA drawdown, Die with Zero */}
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "visible", marginTop: 12, marginBottom: 12 }}>
    </>
  );
}
