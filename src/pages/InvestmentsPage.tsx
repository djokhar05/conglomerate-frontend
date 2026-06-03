import { useEffect, useRef, useState } from "react";
import { TablePagination } from "../components/TablePagination";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import type { Investment, InvestmentReturn } from "../types";

const INVESTMENT_FORM_TOGGLE_KEY = "investments_form_open";
const RETURNS_FORM_TOGGLE_KEY = "returns_form_open";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getStoredToggleState(key: string, defaultValue: boolean) {
  if (typeof window === "undefined") return defaultValue;
  const stored = window.localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === "true";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export function InvestmentsPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const isAdmin = user?.role === "admin";
  const hasLoaded = useRef(false);

  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(() =>
    getStoredToggleState(INVESTMENT_FORM_TOGGLE_KEY, true),
  );
  const [isReturnsFormOpen, setIsReturnsFormOpen] = useState(() =>
    getStoredToggleState(RETURNS_FORM_TOGGLE_KEY, true),
  );

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [returns, setReturns] = useState<InvestmentReturn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingInvest, setIsSubmittingInvest] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const [investPage, setInvestPage] = useState(1);
  const [investPageSize, setInvestPageSize] = useState(10);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsPageSize, setReturnsPageSize] = useState(10);

  const [investForm, setInvestForm] = useState({
    title: "",
    amountInvested: "",
    roi: "",
    investedAt: "",
    notes: "",
  });

  const [returnForm, setReturnForm] = useState({
    investmentId: "",
    month: currentMonth,
    year: currentYear,
    type: "profit" as "profit" | "loss",
    amount: "",
    note: "",
    recordedAt: new Date().toISOString().slice(0, 10),
  });

  async function loadData() {
    setIsLoading(true);
    try {
      const [invRes, retRes] = await Promise.all([
        api.get("/investments"),
        api.get("/investments/returns"),
      ]);
      setInvestments(invRes.data);
      setReturns(retRes.data);
    } catch (err: any) {
      showError(err?.response?.data?.message ?? "Failed to load investments.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadData();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(INVESTMENT_FORM_TOGGLE_KEY, String(isInvestmentFormOpen));
  }, [isInvestmentFormOpen]);

  useEffect(() => {
    window.localStorage.setItem(RETURNS_FORM_TOGGLE_KEY, String(isReturnsFormOpen));
  }, [isReturnsFormOpen]);

  async function submitInvestment(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingInvest(true);
    try {
      await api.post("/investments", {
        title: investForm.title,
        amountInvested: Number(investForm.amountInvested),
        roi: investForm.roi !== "" ? Number(investForm.roi) : undefined,
        investedAt: investForm.investedAt,
        notes: investForm.notes,
      });
      setInvestForm({ title: "", amountInvested: "", roi: "", investedAt: "", notes: "" });
      await loadData();
      showSuccess("Investment recorded.");
    } catch (err: any) {
      showError(err?.response?.data?.message ?? "Failed to record investment.");
    } finally {
      setIsSubmittingInvest(false);
    }
  }

  async function deleteInvestment(id: string) {
    if (!confirm("Delete this investment?")) return;
    try {
      await api.delete(`/investments/${id}`);
      await loadData();
      showSuccess("Investment deleted.");
    } catch (err: any) {
      showError(err?.response?.data?.message ?? "Failed to delete.");
    }
  }

  async function submitReturn(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingReturn(true);
    try {
      await api.post("/investments/returns", {
        investmentId: returnForm.investmentId,
        month: returnForm.month,
        year: returnForm.year,
        type: returnForm.type,
        amount: Number(returnForm.amount),
        note: returnForm.note,
        recordedAt: returnForm.recordedAt,
      });
      setReturnForm({
        investmentId: "",
        month: currentMonth,
        year: currentYear,
        type: "profit",
        amount: "",
        note: "",
        recordedAt: new Date().toISOString().slice(0, 10),
      });
      await loadData();
      showSuccess("Monthly result saved.");
    } catch (err: any) {
      showError(err?.response?.data?.message ?? "Failed to save result.");
    } finally {
      setIsSubmittingReturn(false);
    }
  }

  async function deleteReturn(id: string) {
    if (!confirm("Delete this monthly result?")) return;
    try {
      await api.delete(`/investments/returns/${id}`);
      await loadData();
      showSuccess("Result deleted.");
    } catch (err: any) {
      showError(err?.response?.data?.message ?? "Failed to delete.");
    }
  }

  const totalInvested = investments.reduce((sum, i) => sum + i.amountInvested, 0);
  const netReturns = returns.reduce(
    (sum, r) => sum + (r.type === "profit" ? r.amount : -r.amount),
    0,
  );

  const investTotalPages = Math.max(1, Math.ceil(investments.length / investPageSize));
  const investStart = (investPage - 1) * investPageSize;
  const paginatedInvestments = investments.slice(investStart, investStart + investPageSize);

  const returnsTotalPages = Math.max(1, Math.ceil(returns.length / returnsPageSize));
  const returnsStart = (returnsPage - 1) * returnsPageSize;
  const paginatedReturns = returns.slice(returnsStart, returnsStart + returnsPageSize);

  return (
    <div className="stack">
      {/* Summary */}
      <section className="card">
        <h2>Investment Summary</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Invested</span>
            <span className="stat-value">{formatCurrency(totalInvested)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Net Returns</span>
            <span
              className="stat-value"
              style={{ color: netReturns >= 0 ? "var(--accent)" : "var(--error)" }}
            >
              {netReturns >= 0 ? "+" : ""}
              {formatCurrency(netReturns)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Effective Value</span>
            <span className="stat-value">{formatCurrency(totalInvested + netReturns)}</span>
          </div>
        </div>
      </section>

      {/* Add Investment */}
      {isAdmin && (
        <form className="card grid-form" onSubmit={submitInvestment}>
          <div className="collapsible-form-header">
            <h2>Add Investment</h2>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setIsInvestmentFormOpen((o) => !o)}
            >
              {isInvestmentFormOpen ? "Hide" : "Show"} Form
            </button>
          </div>
          {isInvestmentFormOpen && (
            <>
              <label>
                Investment Name
                <small className="help-text">E.g. Treasury bill, stock, cooperative plan.</small>
                <input
                  required
                  value={investForm.title}
                  disabled={isSubmittingInvest}
                  onChange={(e) => setInvestForm((p) => ({ ...p, title: e.target.value }))}
                />
              </label>
              <label>
                Amount Invested (NGN)
                <small className="help-text">Total amount put into this investment.</small>
                <input
                  type="number"
                  min={0}
                  required
                  value={investForm.amountInvested}
                  disabled={isSubmittingInvest}
                  onChange={(e) => setInvestForm((p) => ({ ...p, amountInvested: e.target.value }))}
                />
              </label>
              <label>
                Expected ROI (%)
                <small className="help-text">Optional — expected return on investment as a percentage.</small>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 12.5"
                  value={investForm.roi}
                  disabled={isSubmittingInvest}
                  onChange={(e) => setInvestForm((p) => ({ ...p, roi: e.target.value }))}
                />
              </label>
              <label>
                Investment Date
                <input
                  type="date"
                  required
                  value={investForm.investedAt}
                  disabled={isSubmittingInvest}
                  onChange={(e) => setInvestForm((p) => ({ ...p, investedAt: e.target.value }))}
                />
              </label>
              <label>
                Notes
                <small className="help-text">Optional — platform, maturity date, remarks.</small>
                <input
                  value={investForm.notes}
                  disabled={isSubmittingInvest}
                  onChange={(e) => setInvestForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </label>
              <button className="primary-btn btn-fit" disabled={isSubmittingInvest}>
                {isSubmittingInvest ? "Saving…" : "Record Investment"}
              </button>
            </>
          )}
        </form>
      )}

      {/* Investments ledger */}
      <section className="card">
        <h2>Investments Ledger</h2>
        {isLoading ? (
          <p className="activity-inline">
            <span className="activity-spinner" aria-hidden="true" /> Loading…
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Amount Invested</th>
                    <th>ROI (%)</th>
                    <th>Date</th>
                    <th>Notes</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvestments.map((inv) => (
                    <tr key={inv._id}>
                      <td>{inv.title}</td>
                      <td>{formatCurrency(inv.amountInvested)}</td>
                      <td>{inv.roi != null ? `${inv.roi}%` : "—"}</td>
                      <td>{new Date(inv.investedAt).toLocaleDateString()}</td>
                      <td>{inv.notes || "—"}</td>
                      {isAdmin && (
                        <td>
                          <button className="ghost-btn" onClick={() => deleteInvestment(inv._id)}>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {investments.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4}>No investments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={investPage}
              totalPages={investTotalPages}
              totalItems={investments.length}
              pageSize={investPageSize}
              onPageChange={(p) => setInvestPage(Math.min(Math.max(1, p), investTotalPages))}
              onPageSizeChange={(s) => { setInvestPageSize(s); setInvestPage(1); }}
            />
          </>
        )}
      </section>

      {/* Record Monthly Profit / Loss */}
      {isAdmin && (
        <form className="card grid-form" onSubmit={submitReturn}>
          <div className="collapsible-form-header">
            <h2>Record Monthly Profit / Loss</h2>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setIsReturnsFormOpen((o) => !o)}
            >
              {isReturnsFormOpen ? "Hide" : "Show"} Form
            </button>
          </div>
          {isReturnsFormOpen && (
            <>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                If an entry already exists for the selected investment/month/year it will be overwritten.
              </p>
              <label>
                Investment
                <select
                  required
                  value={returnForm.investmentId}
                  disabled={isSubmittingReturn}
                  onChange={(e) => setReturnForm((p) => ({ ...p, investmentId: e.target.value }))}
                >
                  <option value="">— Select investment —</option>
                  {investments.map((inv) => (
                    <option key={inv._id} value={inv._id}>{inv.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Month
                <select
                  value={returnForm.month}
                  disabled={isSubmittingReturn}
                  onChange={(e) => setReturnForm((p) => ({ ...p, month: Number(e.target.value) }))}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                Year
                <input
                  type="number"
                  min={2024}
                  required
                  value={returnForm.year}
                  disabled={isSubmittingReturn}
                  onChange={(e) => setReturnForm((p) => ({ ...p, year: Number(e.target.value) }))}
                />
              </label>
              <label>
                Result Type
                <select
                  value={returnForm.type}
                  disabled={isSubmittingReturn}
                  onChange={(e) =>
                    setReturnForm((p) => ({ ...p, type: e.target.value as "profit" | "loss" }))
                  }
                >
                  <option value="profit">Profit</option>
                  <option value="loss">Loss</option>
                </select>
              </label>
              <label>
                Amount (NGN)
                <small className="help-text">Always enter a positive number.</small>
                <input
                  type="number"
                  min={0}
                  required
                  value={returnForm.amount}
                  disabled={isSubmittingReturn}
                  onChange={(e) => setReturnForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </label>
              <label>
                Note
                <input
                  placeholder="Optional note"
                  value={returnForm.note}
                  disabled={isSubmittingReturn}
                  onChange={(e) => setReturnForm((p) => ({ ...p, note: e.target.value }))}
                />
              </label>
              <label>
                Date Recorded
                <input
                  type="date"
                  required
                  value={returnForm.recordedAt}
                  disabled={isSubmittingReturn}
                  onChange={(e) => setReturnForm((p) => ({ ...p, recordedAt: e.target.value }))}
                />
              </label>
              <button className="primary-btn btn-fit" disabled={isSubmittingReturn}>
                {isSubmittingReturn ? "Saving…" : "Save Monthly Result"}
              </button>
            </>
          )}
        </form>
      )}

      {/* Monthly returns list */}
      <section className="card">
        <h2>Monthly Results</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Investment</th>
                <th>Month</th>
                <th>Year</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Recorded</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedReturns.map((r) => (
                <tr key={r._id}>
                  <td>
                    {typeof r.investmentId === "object"
                      ? r.investmentId.title
                      : r.investmentId}
                  </td>
                  <td>{MONTH_NAMES[r.month - 1]}</td>
                  <td>{r.year}</td>
                  <td
                    style={{
                      color: r.type === "profit" ? "var(--accent)" : "var(--error)",
                      fontWeight: 600,
                    }}
                  >
                    {r.type === "profit" ? "Profit" : "Loss"}
                  </td>
                  <td>{formatCurrency(r.amount)}</td>
                  <td>{r.note || "—"}</td>
                  <td>{new Date(r.recordedAt).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td>
                      <button className="ghost-btn" onClick={() => deleteReturn(r._id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {returns.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7}>No monthly results recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={returnsPage}
          totalPages={returnsTotalPages}
          totalItems={returns.length}
          pageSize={returnsPageSize}
          onPageChange={(p) => setReturnsPage(Math.min(Math.max(1, p), returnsTotalPages))}
          onPageSizeChange={(s) => { setReturnsPageSize(s); setReturnsPage(1); }}
        />
      </section>
    </div>
  );
}
