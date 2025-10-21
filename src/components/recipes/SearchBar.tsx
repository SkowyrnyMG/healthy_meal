import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

interface SearchBarProps {
  /**
   * Current search value
   */
  value: string | undefined;

  /**
   * Callback when search changes
   * Debouncing is handled by the parent (useRecipeFilters hook)
   */
  onChange: (value: string | undefined) => void;

  /**
   * Placeholder text
   * @default "Szukaj przepisów..."
   */
  placeholder?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SearchBar component for recipe text search
 *
 * Features:
 * - Text input with search icon
 * - Clear button (X) when text is present
 * - Enter key to trigger immediate search
 * - Min length: 1 character (trimmed)
 * - Max length: 255 characters
 * - Automatic whitespace trimming
 *
 * Note: Debouncing is handled by the parent hook (useRecipeFilters)
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={filters.search}
 *   onChange={setSearch}
 * />
 * ```
 */
const SearchBar = ({ value, onChange, placeholder = "Szukaj przepisów..." }: SearchBarProps) => {
  // Local state for input (controlled component)
  const [inputValue, setInputValue] = useState(value || "");

  // Sync local state with prop value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Enforce max length
    if (newValue.length > 255) {
      return;
    }

    setInputValue(newValue);

    // Trigger onChange with trimmed value (or undefined if empty)
    const trimmed = newValue.trim();
    onChange(trimmed.length > 0 ? trimmed : undefined);
  };

  // Handle Enter key for immediate search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      onChange(trimmed.length > 0 ? trimmed : undefined);
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setInputValue("");
    onChange(undefined);
  };

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

      {/* Input Field */}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-10 pr-10"
        aria-label="Wyszukaj przepisy"
      />

      {/* Clear Button */}
      {inputValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Wyczyść wyszukiwanie"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
