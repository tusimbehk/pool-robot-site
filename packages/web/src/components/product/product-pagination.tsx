"use client";

import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProductPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ProductPaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </Button>

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-2">
              ...
            </span>
          );
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </Button>
        );
      })}

      {/* Next */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </Button>
    </div>
  );
}

function getPageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  const pages: Array<number | "ellipsis"> = [];
  const showEllipsis = total > 7;

  if (!showEllipsis) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Always show first page
  pages.push(1);

  if (current <= 3) {
    // Near the start
    for (let i = 2; i <= 5; i++) {
      if (i <= total) pages.push(i);
    }
    if (total > 5) {
      pages.push("ellipsis");
      pages.push(total);
    }
  } else if (current >= total - 2) {
    // Near the end
    pages.push("ellipsis");
    for (let i = total - 4; i <= total; i++) {
      if (i > 1) pages.push(i);
    }
  } else {
    // Middle
    pages.push("ellipsis");
    for (let i = current - 1; i <= current + 1; i++) {
      pages.push(i);
    }
    pages.push("ellipsis");
    pages.push(total);
  }

  return pages;
}
