import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface PaginationProps {
  /**
   * Pagination metadata from API
   */
  pagination: PaginationDTO;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate which page numbers to display in pagination
 * Shows current page, adjacent pages, first/last pages with ellipsis
 *
 * Examples:
 * - Total 5 pages, current 3: [1, 2, 3, 4, 5]
 * - Total 10 pages, current 5: [1, ..., 4, 5, 6, ..., 10]
 * - Total 10 pages, current 2: [1, 2, 3, ..., 10]
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  // Always show first page
  pages.push(1);

  if (currentPage <= 3) {
    // Near start: [1, 2, 3, 4, ..., 10]
    pages.push(2, 3, 4);
    pages.push("ellipsis");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    // Near end: [1, ..., 7, 8, 9, 10]
    pages.push("ellipsis");
    pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    // Middle: [1, ..., 4, 5, 6, ..., 10]
    pages.push("ellipsis");
    pages.push(currentPage - 1, currentPage, currentPage + 1);
    pages.push("ellipsis");
    pages.push(totalPages);
  }

  return pages;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Pagination component for navigating through recipe pages
 *
 * Features:
 * - Previous/Next buttons with disabled states
 * - Page number buttons with current page highlighting
 * - Ellipsis for skipped pages
 * - Results count display
 * - Keyboard navigation support (built into Button component)
 *
 * @example
 * ```tsx
 * {pagination && (
 *   <Pagination
 *     pagination={pagination}
 *     onPageChange={setPage}
 *   />
 * )}
 * ```
 */
const Pagination = ({ pagination, onPageChange }: PaginationProps) => {
  const { page, limit, total, totalPages } = pagination;

  // Calculate display range
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Get page numbers to display
  const pageNumbers = getPageNumbers(page, totalPages);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && page > 1) {
      onPageChange(page - 1);
    } else if (e.key === "ArrowRight" && page < totalPages) {
      onPageChange(page + 1);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="flex flex-col items-center justify-between gap-4 sm:flex-row"
      role="navigation"
      aria-label="Nawigacja po stronach"
      onKeyDown={handleKeyDown}
    >
      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Wyświetlanie <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> z{" "}
        <span className="font-medium">{total}</span> przepisów
      </div>

      {/* Page Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Poprzednia strona"
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === "ellipsis") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            const isCurrentPage = pageNum === page;

            return (
              <Button
                key={pageNum}
                variant={isCurrentPage ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(pageNum)}
                disabled={isCurrentPage}
                aria-label={`Strona ${pageNum}`}
                aria-current={isCurrentPage ? "page" : undefined}
                className={`h-9 w-9 ${isCurrentPage ? "bg-green-600 hover:bg-green-700" : "hover:bg-gray-100"}`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Następna strona"
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
