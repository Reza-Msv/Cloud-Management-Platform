"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({ page, totalCount, pageSize, onPageChange }: PaginationProps) {
  const t = useTranslations("Common");
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex items-center justify-between px-2 py-4 text-xs text-muted-foreground">
      <div>
        <span>
          {t("showingResults", {
            from: totalCount === 0 ? 0 : (page - 1) * pageSize + 1,
            to: Math.min(page * pageSize, totalCount),
            total: totalCount,
          })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180 me-1" />
          <span>{t("previous")}</span>
        </Button>
        <span className="font-medium text-foreground px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-2"
        >
          <span>{t("next")}</span>
          <ChevronRight className="h-4 w-4 rtl:rotate-180 ms-1" />
        </Button>
      </div>
    </div>
  );
}
