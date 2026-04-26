interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const canGoPrev = page > 1;
  const canGoNext = page < safeTotalPages;

  return (
    <div
      className="table-pagination"
      role="navigation"
      aria-label="Table pagination"
    >
      <div className="table-pagination-left">
        <span>{totalItems} record(s)</span>
        <label className="table-pagination-size">
          Rows
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-pagination-right">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
        >
          Prev
        </button>
        <span>
          Page {page} / {safeTotalPages}
        </span>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
