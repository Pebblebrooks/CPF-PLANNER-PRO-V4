import React, {
  useState, useRef, useContext, createContext,
} from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";

// ── TooltipContext ────────────────────────────────────────────────────────────
// Shared context so all TooltipBox instances can close each other.
// Consumed by TooltipBox. Provided in App.jsx root return via:
//   <TooltipContext.Provider value={{ show: showTooltipId, set: setShowTooltipId }}>
export const TooltipContext = createContext({ show: null, set: () => {} });

// ── TooltipBox ────────────────────────────────────────────────────────────────
// Hover/click info icon that renders the tooltip in a portal above all content.
// Props: id (unique string), text (tooltip content string)
export const TooltipBox = ({ id, text }) => {
  const { show, set } = useContext(TooltipContext);
  const isOpen = show === id;
  const iconRef = useRef(null);
  const [rect, setRect] = useState(null);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen && iconRef.current) setRect(iconRef.current.getBoundingClientRect());
    set(isOpen ? null : id);
  };

  const handleMouseEnter = () => {
    if (iconRef.current) setRect(iconRef.current.getBoundingClientRect());
    set(id);
  };

  return (
    <span
      ref={iconRef}
      style={{ position: "relative", display: "inline-block", marginLeft: 4, verticalAlign: "middle", lineHeight: 1, cursor: "pointer" }}
      onClick={handleToggle}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => set(null)}
      role="button"
      tabIndex={-1}
    >
      <HelpCircle
        style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle", color: isOpen ? "var(--clr-green)" : "var(--text-muted)", transition: "color 0.15s" }}
      />
      {isOpen && rect && createPortal(
        <span style={{ position: "fixed", zIndex: 999999, top: rect.top - 8, left: rect.left + (rect.width / 2), transform: "translate(-50%, -100%)", width: 280, padding: "10px 12px", background: "var(--tooltip-bg)", backdropFilter: "blur(4px)", color: "var(--tooltip-text)", fontSize: 11, borderRadius: 8, boxShadow: "var(--tooltip-shadow-inline)", border: "1px solid var(--tooltip-border-inline)", lineHeight: 1.5, display: "block", whiteSpace: "normal", pointerEvents: "none", textAlign: "left" }}>
          {text}
          <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: 6, borderStyle: "solid", borderColor: "var(--tooltip-bg) transparent transparent transparent" }} />
        </span>,
        document.body
      )}
    </span>
  );
};

// ── FreqToggle ────────────────────────────────────────────────────────────────
// Recurring / One-Time frequency toggle with optional duration input.
// Defined at module level (not inside App) so its reference is stable across
// renders — a previous inline definition caused React to unmount/remount every
// FreqToggle on each setInputs call, collapsing sidebar sections.
//
// Props:
//   freqKey   — key in inputs for 'annual' | 'one-time'
//   durKey    — (optional) key in inputs for duration in years (0 = indefinite/∞)
//               Only shown when freq is 'annual' and durKey is provided.
//   type      — pass "one-time" to render a static ONE-TIME badge (no toggle)
//   inputs, setInputs — passed from the parent sidebar section
export const FreqToggle = ({ freqKey, durKey, type, inputs, setInputs }) => {
  if (type === "one-time") {
    return (
      <span style={{ marginLeft: 6, padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 800,
        letterSpacing: "0.04em", verticalAlign: "middle",
        background: "rgba(var(--clr-amber-rgb),0.15)", color: "var(--clr-amber)",
        border: "1px solid rgba(var(--clr-amber-rgb),0.3)" }}>ONE-TIME</span>
    );
  }
  const current = (inputs && inputs[freqKey]) || "annual";
  const isAnnual = current === "annual";
  const durVal = durKey ? (Number((inputs && inputs[durKey]) || 0)) : 0;
  const btnBase = { fontSize: 10, fontWeight: 800, padding: "2px 8px", border: "none", cursor: "pointer", letterSpacing: "0.04em", lineHeight: 1.6 };
  const makeHandler = (val) => (e) => {
    e.stopPropagation();
    if (setInputs) setInputs(p => ({ ...p, [freqKey]: val }));
  };
  const handleDurChange = (e) => {
    e.stopPropagation();
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const v = raw === "" ? 0 : Math.min(99, Math.max(0, parseInt(raw, 10)));
    if (setInputs) setInputs(p => ({ ...p, [durKey]: v }));
  };
  return (
    <span className="freq-toggle-wrap" onClick={e => e.stopPropagation()}
      style={{ display: "inline-flex", alignItems: "center", marginLeft: 6, verticalAlign: "middle", flexShrink: 0, gap: 0 }}>
      <span style={{ display: "inline-flex", borderRadius: 3, overflow: "hidden", border: `1px solid ${isAnnual ? "rgba(var(--clr-emerald-rgb),0.35)" : "rgba(var(--clr-amber-rgb),0.35)"}` }}>
        <button type="button" onClick={makeHandler("annual")}
          style={{ ...btnBase, background: isAnnual ? "rgba(var(--clr-emerald-rgb),0.25)" : "transparent", color: isAnnual ? "var(--clr-green)" : "var(--text-subtle)" }}>
          Recurring
        </button>
        <button type="button" onClick={makeHandler("one-time")}
          style={{ ...btnBase, background: !isAnnual ? "rgba(var(--clr-amber-rgb),0.25)" : "transparent", color: !isAnnual ? "var(--clr-amber)" : "var(--text-subtle)", borderLeft: "1px solid var(--border-subtle)" }}>
          One-Time
        </button>
      </span>
      {isAnnual && durKey && (
        <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 4,
          background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)",
          borderRadius: 3, padding: "0 6px 0 6px", height: 24 }}
          title="Number of years to apply this recurring contribution (0 or blank = indefinite ∞)">
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.03em", marginRight: 2 }}>for</span>
          <input
            type="text" inputMode="numeric"
            value={durVal === 0 ? "" : durVal}
            placeholder="∞"
            onChange={handleDurChange}
            onClick={e => e.stopPropagation()}
            onFocus={e => { e.stopPropagation(); e.target.select(); }}
            style={{ width: 30, fontSize: 10, fontWeight: 800, fontFamily: "monospace",
              background: "transparent", border: "none", outline: "none",
              color: durVal > 0 ? "var(--clr-sky)" : "var(--text-subtle)",
              textAlign: "center", padding: 0, lineHeight: 1 }}
          />
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.03em" }}>yr{durVal !== 1 ? "s" : ""}</span>
        </span>
      )}
    </span>
  );
};

// ── ErrorBoundary ─────────────────────────────────────────────────────────────
// Catches runtime errors in any child component (engine NaN cascades, bad
// imports, unexpected null access) and surfaces a recovery UI.
// Class component is required — React only supports getDerivedStateFromError
// and componentDidCatch on class components.
//
// Usage in App.jsx root return:
//   <TooltipContext.Provider value={...}>
//     <ErrorBoundary>
//       <div ...>...</div>
//     </ErrorBoundary>
//   </TooltipContext.Provider>
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unknown error" };
  }

  componentDidCatch(error, info) {
    console.error("[CPF Planner] Render error caught by ErrorBoundary:", error, info?.componentStack);
  }

  handleReset() {
    try { localStorage.removeItem("cpf_planner_profile"); } catch { /* ignore */ }
    this.setState({ hasError: false, errorMessage: "" });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0d1117", color: "#e6edf3", fontFamily: "system-ui, sans-serif", padding: 32 }}>
        <div style={{ maxWidth: 480, textAlign: "center", background: "#161b22",
          border: "1px solid #30363d", borderRadius: 16, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#f0f6fc" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 8, lineHeight: 1.6 }}>
            The planner encountered an unexpected error and could not render.
            This is usually caused by a malformed imported profile or an engine edge-case.
          </p>
          <p style={{ fontSize: 12, color: "#6e7681", marginBottom: 24,
            fontFamily: "monospace", background: "#0d1117", borderRadius: 8,
            padding: "8px 12px", wordBreak: "break-all" }}>
            {this.state.errorMessage}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={this.handleReset}
              style={{ background: "#238636", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              ↺ Reset &amp; Retry
            </button>
            <button onClick={() => window.location.reload()}
              style={{ background: "#21262d", color: "#c9d1d9", border: "1px solid #30363d",
                borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              ⟳ Reload Page
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#6e7681", marginTop: 20 }}>
            Your exported profiles are safe — re-import them after resetting.
          </p>
        </div>
      </div>
    );
  }
}
