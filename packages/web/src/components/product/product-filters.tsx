"use client";

import { Button } from "@/components/ui";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export interface ProductFiltersProps {
  tags?: string[];
  productTypes?: string[];
  selectedTag?: string;
  selectedType?: string;
  onTagChange?: (tag: string) => void;
  onTypeChange?: (type: string) => void;
}

export function ProductFilters({
  tags = ["robotic", "premium", "professional", "commercial", "accessory"],
  productTypes = ["Robotic Pool Cleaner", "Accessories"],
  selectedTag,
  selectedType,
  onTagChange,
  onTypeChange,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {/* Product Type Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Type:</span>
        <div className="flex gap-2">
          <FilterButton
            selected={!selectedType}
            onClick={() => onTypeChange?.("")}
          >
            All
          </FilterButton>
          {productTypes.map((type) => (
            <FilterButton
              key={type}
              selected={selectedType === type}
              onClick={() => onTypeChange?.(type)}
            >
              {type === "Robotic Pool Cleaner" ? "Robots" : "Accessories"}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <Button
        variant="outline"
        size="sm"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        Filters
      </Button>
    </div>
  );
}

function FilterButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {children}
    </button>
  );
}
