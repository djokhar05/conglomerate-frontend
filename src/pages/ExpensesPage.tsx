import { useEffect, useMemo, useState } from "react";
import { TablePagination } from "../components/TablePagination";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import type { Expense } from "../types";

const EXPENSE_FORM_TOGGLE_KEY = "expenses_form_open";

function getStoredToggleState(defaultValue: boolean) {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const stored = window.localStorage.getItem(EXPENSE_FORM_TOGGLE_KEY);
  if (stored === null) {
    return defaultValue;
  }

  return stored === "true";
}

const CATEGORIES: Expense["category"][] = [
  "operations",
  "bank",
  "logistics",
  "welfare",
  "loan",
  "other",
];

const ENTRY_TYPES: Expense["entryType"][] = ["expense", "recovery"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCategoryLabel(category: Expense["category"]) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function ExpensesPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const isAdmin = user?.role === "admin";
  const year = new Date().getFullYear();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(() =>
    getStoredToggleState(true),
  );
  const [items, setItems] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({
    title: "",
    entryType: "expense" as Expense["entryType"],
    category: "operations" as Expense["category"],
    amount: 0,
    incurredAt: "",
    notes: "",
  });

  const totalsByCategory = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      amount: items
        .filter((item) => item.category === category)
        .reduce(
          (sum, item) =>
            sum + (item.entryType === "recovery" ? -item.amount : item.amount),
          0,
        ),
    })).filter((item) => item.amount !== 0);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  async function loadData() {
    setIsLoading(true);
    try {
      const response = await api.get(`/expenses?year=${year}`);
      setItems(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Failed to load expense records.";
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      EXPENSE_FORM_TOGGLE_KEY,
      String(isExpenseFormOpen),
    );
  }, [isExpenseFormOpen]);

  async function submitExpense(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/expenses", form);
      setForm({
        title: "",
        entryType: "expense",
        category: "operations",
        amount: 0,
        incurredAt: "",
        notes: "",
      });
      await loadData();
      showSuccess(
        form.entryType === "recovery"
          ? "Recovery recorded successfully."
          : "Expense recorded successfully.",
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Failed to save expense.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="stack">
      {isAdmin ? (
        <form className="card grid-form" onSubmit={submitExpense}>
          <div className="collapsible-form-header">
            <h2>Add Expense</h2>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setIsExpenseFormOpen((open) => !open)}
            >
              {isExpenseFormOpen ? "Hide" : "Show"} Form
            </button>
          </div>
          {isExpenseFormOpen ? (
            <>
              {isSubmitting ? (
                <p className="activity-inline">
                  <span className="activity-spinner" aria-hidden="true" />
                  Saving expense...
                </p>
              ) : null}

              <label>
                Entry Type
                <small className="help-text">
                  Use Recovery when money comes back in, like loan repayment.
                </small>
                <select
                  value={form.entryType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      entryType: e.target.value as Expense["entryType"],
                    }))
                  }
                  disabled={isSubmitting}
                  required
                >
                  {ENTRY_TYPES.map((entryType) => (
                    <option key={entryType} value={entryType}>
                      {entryType === "recovery" ? "Recovery" : "Expense"}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Expense Name
                <small className="help-text">
                  A short name for this spend. Example: Bank transfer charges.
                </small>
                <input
                  placeholder="Expense name"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  disabled={isSubmitting}
                  required
                />
              </label>

              <label>
                Category
                <small className="help-text">
                  Classify expense for clear reporting.
                </small>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category: e.target.value as Expense["category"],
                    }))
                  }
                  disabled={isSubmitting}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount (NGN)
                <small className="help-text">
                  Amount spent for this expense item.
                </small>
                <input
                  type="number"
                  min={1}
                  placeholder="Amount"
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      amount: Number(e.target.value),
                    }))
                  }
                  disabled={isSubmitting}
                  required
                />
              </label>

              <label>
                Expense Date
                <small className="help-text">
                  Date the expense was incurred.
                </small>
                <input
                  type="date"
                  value={form.incurredAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, incurredAt: e.target.value }))
                  }
                  disabled={isSubmitting}
                  required
                />
              </label>

              <label>
                Notes
                <small className="help-text">
                  Optional details for auditing.
                </small>
                <input
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>

              <button className="primary-btn btn-fit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Expense"}
              </button>
            </>
          ) : null}
        </form>
      ) : (
        <section className="card">
          <h2>Expenses</h2>
          <p>Only admins can record expense entries.</p>
        </section>
      )}

      <section className="card">
        <h2>{year} Expense Overview</h2>
        {isLoading ? (
          <p className="activity-inline">
            <span className="activity-spinner" aria-hidden="true" />
            Loading expense records...
          </p>
        ) : null}
        {totalsByCategory.length > 0 ? (
          <div className="expense-badges">
            {totalsByCategory.map((item) => (
              <span
                key={item.category}
                className={`expense-badge ${item.amount > 0 ? "expense-badge-out" : "expense-badge-in"}`}
              >
                {getCategoryLabel(item.category)}:{" "}
                {formatCurrency(Math.abs(item.amount))}
              </span>
            ))}
          </div>
        ) : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Recorded By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>
                    <span
                      className={`entry-pill ${
                        item.entryType === "recovery"
                          ? "entry-pill-in"
                          : "entry-pill-out"
                      }`}
                    >
                      {item.entryType === "recovery" ? "Recovery" : "Expense"}
                    </span>
                  </td>
                  <td>{getCategoryLabel(item.category)}</td>
                  <td
                    className={
                      item.entryType === "recovery"
                        ? "money-positive"
                        : "money-negative"
                    }
                  >
                    {item.entryType === "recovery" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </td>
                  <td>{new Date(item.incurredAt).toLocaleDateString()}</td>
                  <td>
                    {item.createdBy?.fullName ??
                      item.createdBy?.username ??
                      "-"}
                  </td>
                  <td>{item.notes?.trim() ? item.notes : "-"}</td>
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
