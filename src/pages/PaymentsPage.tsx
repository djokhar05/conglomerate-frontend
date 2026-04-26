import { useEffect, useRef, useState } from "react";
import { TablePagination } from "../components/TablePagination";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import type { Member, Payment } from "../types";

const MONTHLY_PER_SLOT = 111500;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PAYMENT_FORM_TOGGLE_KEY = "payments_form_open";
const PAYMENT_FILTERS_TOGGLE_KEY = "payments_filters_open";

function getStoredToggleState(key: string, defaultValue: boolean) {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const stored = window.localStorage.getItem(key);
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

function getComputedDueDate(year: number, month: number) {
  return new Date(year, month, 7, 23, 59, 59, 999);
}

function getMonthLabel(month: number) {
  return MONTH_NAMES[month - 1] ?? `Month ${month}`;
}

function getDisplaySlots(payment: Payment) {
  if (typeof payment.slots === "number" && payment.slots > 0) {
    return payment.slots;
  }

  const fallback = Math.round(payment.amount / MONTHLY_PER_SLOT);
  return Math.max(1, fallback);
}

export function PaymentsPage() {
  const { user, token } = useAuth();
  const { showError, showSuccess } = useToast();
  const isAdmin = user?.role === "admin";
  const recordYear = new Date().getFullYear();
  const initialFilters = {
    year: String(recordYear),
    memberId: "",
    month: "all",
    status: "all",
    minAmount: "",
    maxAmount: "",
    paidFrom: "",
    paidTo: "",
    search: "",
    sortBy: "paidAt",
    sortOrder: "desc",
  };
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(() =>
    getStoredToggleState(PAYMENT_FORM_TOGGLE_KEY, true),
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(() =>
    getStoredToggleState(PAYMENT_FILTERS_TOGGLE_KEY, true),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [form, setForm] = useState({
    memberId: "",
    slots: 1,
    month: 1,
    paidAt: "",
  });
  const hasLoadedInitialData = useRef(false);
  const computedDueDate = getComputedDueDate(recordYear, form.month);
  const selectedMember = members.find((member) => member._id === form.memberId);
  const maxSelectableSlots = selectedMember?.slots ?? 1;
  const computedAmount = form.slots * MONTHLY_PER_SLOT;
  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedPayments = payments.slice(startIndex, startIndex + pageSize);

  function buildPaymentParams(filters: typeof initialFilters) {
    const params: Record<string, string> = {
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };

    if (filters.year.trim()) {
      params.year = filters.year.trim();
    }
    if (filters.memberId) {
      params.memberId = filters.memberId;
    }
    if (filters.month !== "all") {
      params.month = filters.month;
    }
    if (filters.status !== "all") {
      params.status = filters.status;
    }
    if (filters.minAmount.trim()) {
      params.minAmount = filters.minAmount.trim();
    }
    if (filters.maxAmount.trim()) {
      params.maxAmount = filters.maxAmount.trim();
    }
    if (filters.paidFrom) {
      params.paidFrom = filters.paidFrom;
    }
    if (filters.paidTo) {
      params.paidTo = filters.paidTo;
    }
    if (filters.search.trim()) {
      params.q = filters.search.trim();
    }

    return params;
  }

  async function loadMembers() {
    if (!token) {
      return;
    }

    const memberRes = await api.get("/members");
    setMembers(memberRes.data);
  }

  async function loadPayments(filters = activeFilters) {
    if (!token) {
      return;
    }

    setIsLoading(true);

    try {
      const params = buildPaymentParams(filters);
      const paymentRes = await api.get("/payments", { params });
      setPayments(paymentRes.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Failed to load payment data.";
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!token || hasLoadedInitialData.current) {
      return;
    }

    hasLoadedInitialData.current = true;

    Promise.all([loadMembers(), loadPayments(activeFilters)]).catch(
      (error: any) => {
        const message =
          error?.response?.data?.message ?? "Failed to load payment data.";
        showError(message);
      },
    );
  }, [token]);

  useEffect(() => {
    window.localStorage.setItem(
      PAYMENT_FORM_TOGGLE_KEY,
      String(isPaymentFormOpen),
    );
  }, [isPaymentFormOpen]);

  useEffect(() => {
    window.localStorage.setItem(
      PAYMENT_FILTERS_TOGGLE_KEY,
      String(isFiltersOpen),
    );
  }, [isFiltersOpen]);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setActiveFilters(draftFilters);
    setPage(1);
    loadPayments(draftFilters);
  }

  function resetFilters() {
    setDraftFilters(initialFilters);
    setActiveFilters(initialFilters);
    setPage(1);
    loadPayments(initialFilters);
  }

  async function submitPayment(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/payments", { ...form, year: recordYear });
      setForm({
        memberId: "",
        slots: 1,
        month: 1,
        paidAt: "",
      });
      await loadPayments();
      showSuccess("Payment saved successfully.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Failed to save payment.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="stack">
      {isAdmin ? (
        <form className="card grid-form" onSubmit={submitPayment}>
          <div className="collapsible-form-header">
            <h2>Record Monthly Payment</h2>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setIsPaymentFormOpen((open) => !open)}
            >
              {isPaymentFormOpen ? "Hide" : "Show"} Form
            </button>
          </div>
          {isPaymentFormOpen ? (
            <>
              {isSubmitting ? (
                <p className="activity-inline">
                  <span className="activity-spinner" aria-hidden="true" />
                  Saving payment...
                </p>
              ) : null}
              <label>
                Member
                <small className="help-text">
                  Choose who made the payment.
                </small>
                <select
                  required
                  value={form.memberId}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    const memberId = e.target.value;
                    const member = members.find(
                      (item) => item._id === memberId,
                    );
                    setForm((p) => ({
                      ...p,
                      memberId,
                      slots: member ? member.slots : 1,
                    }));
                  }}
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Slots
                <small className="help-text">
                  Select how many slots this payment covers.
                </small>
                <select
                  required
                  value={form.slots}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, slots: Number(e.target.value) }))
                  }
                  disabled={!form.memberId || isSubmitting}
                >
                  {Array.from(
                    { length: maxSelectableSlots },
                    (_, index) => index + 1,
                  ).map((slotValue) => (
                    <option key={slotValue} value={slotValue}>
                      {slotValue}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Computed Amount (NGN)
                <small className="help-text">
                  Amount is auto-calculated: slots x{" "}
                  {formatCurrency(MONTHLY_PER_SLOT)}.
                </small>
                <input
                  type="text"
                  value={formatCurrency(computedAmount)}
                  readOnly
                />
              </label>
              <label>
                Contribution Month
                <small className="help-text">
                  Select the month this payment belongs to.
                </small>
                <select
                  value={form.month}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, month: Number(e.target.value) }))
                  }
                  disabled={isSubmitting}
                  required
                >
                  {MONTH_NAMES.map((monthName, index) => (
                    <option key={monthName} value={index + 1}>
                      {monthName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Computed Due Date
                <small className="help-text">
                  Payments for {getMonthLabel(form.month)} are due by{" "}
                  {computedDueDate.toLocaleDateString()}.
                </small>
                <input
                  type="text"
                  value={`${computedDueDate.toLocaleDateString()} 23:59`}
                  readOnly
                />
              </label>
              <label>
                Paid Date
                <small className="help-text">
                  Late is auto-calculated after the 7th day of the following
                  month.
                </small>
                <input
                  type="date"
                  value={form.paidAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, paidAt: e.target.value }))
                  }
                  disabled={isSubmitting}
                  required
                />
              </label>
              <button className="primary-btn btn-fit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Payment"}
              </button>
            </>
          ) : null}
        </form>
      ) : (
        <section className="card">
          <h2>Payments</h2>
          <p>Only admins can record monthly payments.</p>
        </section>
      )}

      <form className="card grid-form payment-filters" onSubmit={applyFilters}>
        <div className="payment-filter-header">
          <h2>Filter, Sort, and Search</h2>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setIsFiltersOpen((open) => !open)}
          >
            {isFiltersOpen ? "Hide" : "Show"} Filters
          </button>
        </div>
        {isFiltersOpen ? (
          <>
            <label>
              Year
              <small className="help-text">
                Use a specific year or clear for all years.
              </small>
              <input
                type="number"
                min={2026}
                placeholder="Year"
                value={draftFilters.year}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, year: e.target.value }))
                }
              />
            </label>
            <label>
              Member
              <small className="help-text">
                Filter table for a specific member.
              </small>
              <select
                value={draftFilters.memberId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    memberId: e.target.value,
                  }))
                }
              >
                <option value="">All members</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Month
              <small className="help-text">
                Narrow records to one contribution month.
              </small>
              <select
                value={draftFilters.month}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    month: e.target.value,
                  }))
                }
              >
                <option value="all">All months</option>
                {MONTH_NAMES.map((monthName, index) => (
                  <option key={monthName} value={index + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <small className="help-text">
                Choose on-time or late payments only.
              </small>
              <select
                value={draftFilters.status}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="all">All statuses</option>
                <option value="on_time">On time</option>
                <option value="late">Late</option>
              </select>
            </label>
            <label>
              Min Amount (NGN)
              <small className="help-text">
                Filter by minimum contribution amount.
              </small>
              <input
                type="number"
                min={0}
                placeholder="Minimum"
                value={draftFilters.minAmount}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    minAmount: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Max Amount (NGN)
              <small className="help-text">
                Filter by maximum contribution amount.
              </small>
              <input
                type="number"
                min={0}
                placeholder="Maximum"
                value={draftFilters.maxAmount}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    maxAmount: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Paid From
              <small className="help-text">
                Start date for paid date range.
              </small>
              <input
                type="date"
                value={draftFilters.paidFrom}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    paidFrom: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Paid To
              <small className="help-text">End date for paid date range.</small>
              <input
                type="date"
                value={draftFilters.paidTo}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    paidTo: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Search
              <small className="help-text">
                Search by member name or username.
              </small>
              <input
                type="text"
                placeholder="Search member"
                value={draftFilters.search}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Sort By
              <small className="help-text">
                Choose which field to sort with.
              </small>
              <select
                value={draftFilters.sortBy}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value,
                  }))
                }
              >
                <option value="paidAt">Paid date</option>
                <option value="amount">Amount</option>
                <option value="month">Contribution month</option>
                <option value="penaltyAmount">Penalty amount</option>
                <option value="status">Status</option>
              </select>
            </label>
            <label>
              Sort Order
              <small className="help-text">
                Ascending or descending order.
              </small>
              <select
                value={draftFilters.sortOrder}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    sortOrder: e.target.value,
                  }))
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
            <div className="payment-filter-actions">
              <button
                className="primary-btn btn-fit"
                type="submit"
                disabled={isLoading}
              >
                Apply
              </button>
              <button
                className="ghost-btn"
                type="button"
                onClick={resetFilters}
                disabled={isLoading}
              >
                Reset
              </button>
            </div>
          </>
        ) : null}
      </form>

      <section className="card">
        <h2>Payments ({payments.length})</h2>
        {isLoading ? (
          <p className="activity-inline">
            <span className="activity-spinner" aria-hidden="true" />
            Loading payment data...
          </p>
        ) : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Slots</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Penalty</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.user?.fullName ?? "Unknown"}</td>
                  <td>{getDisplaySlots(payment)}</td>
                  <td>{getMonthLabel(payment.month)}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.status === "late" ? "Late" : "On time"}</td>
                  <td>{formatCurrency(payment.penaltyAmount)}</td>
                  <td>{new Date(payment.paidAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={payments.length}
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
