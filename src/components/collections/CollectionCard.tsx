import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { CollectionCardProps } from "./types";

/**
 * Format relative time in Polish
 * @param dateString - ISO date string
 * @returns Relative time string (e.g., "2 dni temu")
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Dziś";
  if (diffInDays === 1) return "Wczoraj";
  if (diffInDays < 7) return `${diffInDays} dni temu`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? "Tydzień temu" : `${weeks} tygodni temu`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "Miesiąc temu" : `${months} miesięcy temu`;
  }
  const years = Math.floor(diffInDays / 365);
  return years === 1 ? "Rok temu" : `${years} lat temu`;
};

/**
 * Format recipe count with proper Polish pluralization
 * @param count - Number of recipes
 * @returns Formatted string (e.g., "5 przepisów")
 */
const formatRecipeCount = (count: number): string => {
  if (count === 1) return "1 przepis";
  if (count >= 2 && count <= 4) return `${count} przepisy`;
  return `${count} przepisów`;
};

/**
 * Generate placeholder thumbnail colors
 * Returns a consistent set of colors for the 2x2 grid
 */
const getThumbnailColors = (): string[] => {
  return ["bg-green-200", "bg-green-300", "bg-green-100", "bg-green-400"];
};

/**
 * CollectionCard component - Individual collection card with actions
 *
 * Features:
 * - Collection name, recipe count, created date
 * - 2x2 grid of colored placeholder thumbnails
 * - Desktop: Hover overlay with Edit/Delete icon buttons
 * - Mobile: Dropdown menu with Edit/Delete options
 * - Click navigation to collection detail page
 *
 * @example
 * ```tsx
 * <CollectionCard
 *   collection={collection}
 *   onClick={(id) => navigate(`/collections/${id}`)}
 *   onEdit={(collection) => openEditDialog(collection)}
 *   onDelete={(collection) => openDeleteDialog(collection)}
 * />
 * ```
 */
const CollectionCard = ({ collection, onClick, onEdit, onDelete }: CollectionCardProps) => {
  const thumbnailColors = getThumbnailColors();

  /**
   * Handle card click (navigation)
   * Prevent click when clicking action buttons
   */
  const handleCardClick = (e: React.MouseEvent) => {
    // Check if click target is an action button or inside dropdown
    const target = e.target as HTMLElement;
    if (
      target.closest("button[data-action]") ||
      target.closest('[role="menu"]') ||
      target.closest("[data-radix-dropdown-menu-trigger]")
    ) {
      return;
    }
    onClick(collection.id);
  };

  /**
   * Handle edit action
   * Stop event propagation to prevent card click
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(collection);
  };

  /**
   * Handle delete action
   * Stop event propagation to prevent card click
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(collection);
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-2 transition-all hover:border-green-600 hover:shadow-lg"
      onClick={handleCardClick}
    >
      {/* Desktop Hover Overlay - Hidden on mobile */}
      <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 lg:flex">
        <Button data-action="edit" onClick={handleEdit} size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button data-action="delete" onClick={handleDelete} size="sm" variant="destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Dropdown Menu - Hidden on desktop */}
      <div className="absolute right-2 top-2 lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card Header */}
      <CardHeader>
        <CardTitle className="text-lg">{collection.name}</CardTitle>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="space-y-4">
        {/* Recipe Count Badge */}
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          {formatRecipeCount(collection.recipeCount)}
        </Badge>

        {/* Placeholder Thumbnails - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2">
          {thumbnailColors.map((colorClass, index) => (
            <div key={index} className={`aspect-square rounded-md ${colorClass}`} />
          ))}
        </div>

        {/* Created Date */}
        <p className="text-sm text-gray-500">{formatRelativeTime(collection.createdAt)}</p>
      </CardContent>
    </Card>
  );
};

export default CollectionCard;
