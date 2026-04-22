import React from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

import SidebarProfile      from "./sidebar/SidebarProfile.jsx";
import SidebarContribs     from "./sidebar/SidebarContribs.jsx";
import SidebarOutflows     from "./sidebar/SidebarOutflows.jsx";
import SidebarAssets       from "./sidebar/SidebarAssets.jsx";
import SidebarLifeEvents   from "./sidebar/SidebarLifeEvents.jsx";
import SidebarDecumulation from "./sidebar/SidebarDecumulation.jsx";

// ── Sidebar ───────────────────────────────────────────────────────────────────
// Outer <aside> wrapper composing all 6 accordion section components.
// All App state is passed as explicit props — no direct closure over App state.
//
// Props are grouped into:
//   SHARED — passed to every section (inputs, handlers, accordion state)
//   SECTION-SPECIFIC — passed only to the section(s) that need them
// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({
  // ── Accordion state ──────────────────────────────────────────────────────
  sidebarOpen,
  setSidebarOpen,
  openSections,
  toggleSection,
  expandAllSections,
  collapseAllSections,

  // ── Shared input handling ─────────────────────────────────────────────────
  inputs,
  setInputs,
  inputErrors,
  handleInputChange,
  handleBlur,
  handleKeyDown,
  getDisplayValue,
  formatCurrency,
  focusedField,
  setFocusedField,

  // ── Derived booleans ──────────────────────────────────────────────────────
  is55Plus,
  isForeigner,
  isSelfEmployed,
  isUnder16,

  // ── Projection data (read-only, for live previews in sidebar) ────────────
  debouncedInputs,
  projection,
  projectionByAge,
  displayAccumulation,
  oaToSaCrossover,
  gapAlert,
  rstuRef,
  effectiveOaDrawMonthly,
  effectiveOaDrawStartAge,
  oaExhaustAge,

  // ── RSTU / WIS ───────────────────────────────────────────────────────────
  eligibleRSTU,
  showWisEligibility,
  setShowWisEligibility,

  // ── Handlers ─────────────────────────────────────────────────────────────
  handleAutoCalc,
  handleSwitchToRSS,

  // ── Life Events editor state ──────────────────────────────────────────────
  leEditingId,
  setLeEditingId,
  leFormState,
  setLeFormState,
}) {
  // Shared prop bundle passed to every section — avoids repeating 10 identical
  // prop assignments at each call site.
  const shared = {
    inputs, setInputs, inputErrors, openSections, toggleSection,
    handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency,
  };

  return (
    <aside className="cpf-sidebar-wrap" style={{ background: "var(--bg-base)" }}>

      {/* Toggle bar — only visible on tablet/mobile via CSS .sidebar-toggle-btn */}
      <div className="sidebar-toggle-btn" style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", userSelect: "none", background: "var(--bg-panel)" }}>
        <div onClick={() => setSidebarOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }}>
          <SlidersHorizontal style={{ width: 14, height: 14, color: "var(--clr-emerald)" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Input Parameters</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginLeft: 4 }}>{sidebarOpen ? "▲" : "▼"}</span>
        </div>
        {sidebarOpen && (
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }} onClick={e => e.stopPropagation()}>
            <button onClick={expandAllSections} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "rgba(var(--clr-emerald-rgb),0.1)", color: "var(--clr-green)", border: "1px solid rgba(var(--clr-emerald-rgb),0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              <ChevronDown style={{ width: 10, height: 10 }} />All
            </button>
            <button onClick={collapseAllSections} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "rgba(100,116,139,0.1)", color: "var(--text-muted)", border: "1px solid var(--border-strong)", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              <ChevronUp style={{ width: 10, height: 10 }} />None
            </button>
          </div>
        )}
      </div>

      {/* Sticky Expand / Collapse bar */}
      <div className="sidebar-sticky-bar" style={{ display: "flex", gap: 6, padding: "6px 8px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-base)", borderBottom: "1px solid var(--border-subtle)", backdropFilter: "blur(6px)" }}>
        <button onClick={expandAllSections} style={{ flex: 1, padding: "5px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, background: "rgba(var(--clr-emerald-rgb),0.1)", color: "var(--clr-green)", border: "1px solid rgba(var(--clr-emerald-rgb),0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <ChevronDown style={{ width: 11, height: 11 }} />Expand All
        </button>
        <button onClick={collapseAllSections} style={{ flex: 1, padding: "5px 0", borderRadius: 8, fontSize: 10, fontWeight: 700, background: "rgba(100,116,139,0.1)", color: "var(--text-muted)", border: "1px solid var(--border-strong)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <ChevronUp style={{ width: 11, height: 11 }} />Collapse All
        </button>
      </div>

      {/* Inner scrollable section column */}
      <div className={`cpf-sidebar-inner${sidebarOpen ? "" : " sidebar-collapsed"}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>

        {/* ── 1. Profile & Balances ───────────────────────────────────────── */}
        <SidebarProfile
          {...shared}
          is55Plus={is55Plus}
          isForeigner={isForeigner}
          isSelfEmployed={isSelfEmployed}
          projection={projection}
          handleSwitchToRSS={handleSwitchToRSS}
        />

        {/* ── 2. Contributions + Inflows (VC3A, RSTU, VCMA, Gov Grants) ──── */}
        <SidebarContribs
          {...shared}
          is55Plus={is55Plus}
          isForeigner={isForeigner}
          isSelfEmployed={isSelfEmployed}
          isUnder16={isUnder16}
          projection={projection}
          gapAlert={gapAlert}
          rstuRef={rstuRef}
          showWisEligibility={showWisEligibility}
          setShowWisEligibility={setShowWisEligibility}
          eligibleRSTU={eligibleRSTU}
          handleAutoCalc={handleAutoCalc}
        />

        {/* ── 3. Outflows + CPF Transfers ──────────────────────────────────── */}
        <SidebarOutflows
          {...shared}
          is55Plus={is55Plus}
          isForeigner={isForeigner}
          projection={projection}
          displayAccumulation={displayAccumulation}
          oaToSaCrossover={oaToSaCrossover}
        />

        {/* ── 4. Property & Private Assets / SRS ───────────────────────────── */}
        <SidebarAssets
          {...shared}
          isForeigner={isForeigner}
          projection={projection}
          leEditingId={leEditingId}
          setLeEditingId={setLeEditingId}
          leFormState={leFormState}
          setLeFormState={setLeFormState}
        />

        {/* ── 5. Life Events ────────────────────────────────────────────────── */}
        <SidebarLifeEvents
          {...shared}
          projection={projection}
          leEditingId={leEditingId}
          setLeEditingId={setLeEditingId}
          leFormState={leFormState}
          setLeFormState={setLeFormState}
        />

        {/* ── 6. Decumulation & Goals ───────────────────────────────────────── */}
        <SidebarDecumulation
          {...shared}
          isForeigner={isForeigner}
          debouncedInputs={debouncedInputs}
          projection={projection}
          projectionByAge={projectionByAge}
          gapAlert={gapAlert}
          rstuRef={rstuRef}
          effectiveOaDrawMonthly={effectiveOaDrawMonthly}
          effectiveOaDrawStartAge={effectiveOaDrawStartAge}
          oaExhaustAge={oaExhaustAge}
        />

      </div>
    </aside>
  );
}
