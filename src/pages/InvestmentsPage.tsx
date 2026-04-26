import { useEffect, useState } from "react";
import { TablePagination } from "../components/TablePagination";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Investment } from "../types";

const INVESTMENT_FORM_TOGGLE_KEY = "investments_form_open";

function getStoredToggleState(defaultValue: boolean) {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const stored = window.localStorage.getItem(INVESTMENT_FORM_TOGGLE_KEY);
  if (stored === null) {
    return defaultValue;
  }

  return stored === "true";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function InvestmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(() =>
    getStoredToggleState(true),
  );
  const [items, setItems] = useState<Investment[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    title: "",
    amountInvested: 0,
    currentValue: 0,
    investedAt: "",
    notes: "",
  });

  async function loadData() {
    const response = await api.get("/investments");
    setItems(response.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      INVESTMENT_FORM_TOGGLE_KEY,
      String(isInvestmentFormOpen),
    );
  }, [isInvestmentFormOpen]);

  async function submitInvestment(event: React.FormEvent) {
    event.preventDefault();
    await api.post("/investments", form);
    setForm({
      title: "",
      amountInvested: 0,
      currentValue: 0,
      investedAt: "",
      notes: "",
    });
    loadData();
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return (
    <div className="stack">
      {isAdmin ? (
        <form className="card grid-form" onSubmit={submitInvestment}>
          <div className="collapsible-form-header">
            <h2>Add Investment</h2>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setIsInvestmentFormOpen((open) => !open)}
            >
              {isInvestmentFormOpen ? "Hide" : "Show"} Form
            </button>
          </div>
          {isInvestmentFormOpen ? (
            <>
              <label>
                Investment Name
                <small className="help-text">
                  Example: Treasury bill, stock, cooperative plan.
                </small>
                <input
                  placeholder="Investment name"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </label>
              <label>
                Amount Invested (NGN)
                <small className="help-text">
                  Total amount put into this investment.
                </small>
                <input
                  type="number"
                  min={0}
                  placeholder="Amount invested"
                  value={form.amountInvested}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      amountInvested: Number(e.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label>
                Current Value (NGN)
                <small className="help-text">
                  Latest valuation, used to compute profit/loss.
                </small>
                <input
                  type="number"
                  min={0}
                  placeholder="Current value"
                  value={form.currentValue}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      currentValue: Number(e.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label>
                Investment Date
                <input
                  type="date"
                  value={form.investedAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, investedAt: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Notes
                <small className="help-text">
                  Optional details like platform, maturity date, or remarks.
                </small>
                <input
                  placeholder="Notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </label>
              <button className="primary-btn btn-fit">Save Investment</button>
            </>
          ) : null}
        </form>
      ) : (
        <section className="card">
          <h2>Investments</h2>
          <p>Only admins can add or update investments.</p>
        </section>
      )}

      <section className="card">
        <h2>Investments Ledger</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Invested</th>
                <th>Current Value</th>
                <th>Profit/Loss</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{formatCurrency(item.amountInvested)}</td>
                  <td>{formatCurrency(item.currentValue)}</td>
                  <td>
                    {formatCurrency(item.currentValue - item.amountInvested)}
                  </td>
                  <td>{new Date(item.investedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={items.length}
          pageSize={pageSize}
          onPageChange={(nextPage) =>
            setPage(Math.min(Math.max(1, nextPage), totalPages))
          }
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
