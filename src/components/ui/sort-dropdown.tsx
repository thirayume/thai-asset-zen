import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = {
  value: string;
  label: string;
};

interface SortDropdownProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  options: SortOption[];
}

export const SortDropdown = ({
  sortBy,
  sortOrder,
  onSortChange,
  options,
}: SortDropdownProps) => {
  const currentOption = options.find((opt) => opt.value === sortBy);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {sortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          {currentOption?.label || "Sort By"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              const newOrder =
                sortBy === option.value && sortOrder === "desc" ? "asc" : "desc";
              onSortChange(option.value, newOrder);
            }}
            className="flex items-center justify-between"
          >
            <span>{option.label}</span>
            {sortBy === option.value && (
              sortOrder === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
