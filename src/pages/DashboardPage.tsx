import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TablePagination } from "../components/TablePagination";
import { api } from "../lib/api";
import type { DashboardSummary } from "../types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    api
      .get(`/dashboard/summary?year=${currentYear}`)
      .then((response) => setSummary(response.data));
  }, [currentYear]);

  const chartData = useMemo(
    () =>
      summary?.proportionalDistribution.map((item) => ({
        name: item.fullName,
        value: item.projectedProfitShare,
      })) ?? [],
    [summary],
  );

  const financeChartData = useMemo(
    () =>
      summary
        ? [
            { name: "Contrib", value: summary.metrics.totalContributions },
            { name: "Penalties", value: summary.metrics.totalPenalties },
            { name: "Expenses", value: summary.metrics.totalExpenses },
            { name: "Recoveries", value: summary.metrics.totalRecoveries },
            { name: "Profit", value: summary.metrics.investmentProfit },
          ]
        : [],
    [summary],
  );

  if (!summary) return <div className="card">Loading dashboard...</div>;

  const totalPages = Math.max(
    1,
    Math.ceil(summary.proportionalDistribution.length / pageSize),
  );
  const startIndex = (page - 1) * pageSize;
  const paginatedDistribution = summary.proportionalDistribution.slice(
    startIndex,
    startIndex + pageSize,
  );

  return (
    <div className="stack">
      <section className="grid cards-6">
        <article className="card metric">
          <h3>Total Contributions</h3>
          <strong>{formatCurrency(summary.metrics.totalContributions)}</strong>
        </article>
        <article className="card metric">
          <h3>Total Penalties</h3>
          <strong>{formatCurrency(summary.metrics.totalPenalties)}</strong>
        </article>
        <article className="card metric">
          <h3>Total Expenses</h3>
          <strong>{formatCurrency(summary.metrics.totalExpenses)}</strong>
        </article>
        <article className="card metric">
          <h3>Total Recoveries</h3>
          <strong>{formatCurrency(summary.metrics.totalRecoveries)}</strong>
        </article>
        <article className="card metric">
          <h3>Net Expenses</h3>
          <strong>{formatCurrency(summary.metrics.netExpenses)}</strong>
        </article>
        <article className="card metric">
          <h3>Investment Profit</h3>
          <strong>{formatCurrency(summary.metrics.investmentProfit)}</strong>
        </article>
        <article className="card metric">
          <h3>Overall Pool Value</h3>
          <strong>{formatCurrency(summary.metrics.overallPoolValue)}</strong>
        </article>
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Proportional Profit Distribution</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Slots</th>
                  <th>Principal</th>
                  <th>Ratio</th>
                  <th>Projected Share</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDistribution.map((item) => (
                  <tr key={item.memberId}>
                    <td>{item.fullName}</td>
                    <td>{item.slots}</td>
                    <td>{formatCurrency(item.principal)}</td>
                    <td>{(item.ratio * 100).toFixed(2)}%</td>
                    <td>{formatCurrency(item.projectedProfitShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={summary.proportionalDistribution.length}
            pageSize={pageSize}
            onPageChange={(nextPage) =>
              setPage(Math.min(Math.max(1, nextPage), totalPages))
            }
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        </article>

        <article className="card chart-card">
          <h2>Profit Share Split</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  fill="var(--accent)"
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="card">
        <h2>Financial Snapshot</h2>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
