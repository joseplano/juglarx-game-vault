"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build visible page numbers: always show first, last, current ±1, with ellipsis
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta;

    let prev: number | null = null;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        if (prev !== null && i - prev > 1) {
          pages.push("...");
        }
        pages.push(i);
        prev = i;
      }
    }
    return pages;
  }

  const pages = getPageNumbers();

  const btnBase =
    "flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-medium transition-colors";
  const btnActive = "bg-vault-600 text-white";
  const btnInactive = "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50";
  const btnDisabled = "bg-white text-gray-300 border border-gray-100 cursor-not-allowed";

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 pt-4"
    >
      {/* First */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
        aria-label="First page"
      >
        «
      </button>

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
        aria-label="Previous page"
      >
        ‹
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className={`${btnBase} text-gray-400`}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}
        aria-label="Next page"
      >
        ›
      </button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}`}
        aria-label="Last page"
      >
        »
      </button>
    </nav>
  );
}
