import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecipeHeaderProps } from "@/components/recipes/types";

/**
 * RecipeHeader component displays recipe title, description, tags, and metadata
 * Tags are clickable and navigate to filtered recipe list
 */
const RecipeHeader = ({ title, description, prepTimeMinutes, tags, isPublic }: RecipeHeaderProps) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{title}</h1>

      {/* Description */}
      {description && <p className="text-lg text-gray-600 leading-relaxed">{description}</p>}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a key={tag.id} href={`/recipes?tags=${tag.slug}`}>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-green-50 hover:border-green-600 transition-colors"
              >
                {tag.name}
              </Badge>
            </a>
          ))}
        </div>
      )}

      {/* Metadata Row */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {/* Prep Time */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{prepTimeMinutes ? `${prepTimeMinutes} min` : "nie podano"}</span>
        </div>

        {/* Public Badge */}
        {isPublic && (
          <Badge variant="secondary" className="text-xs">
            Publiczny
          </Badge>
        )}
      </div>
    </div>
  );
};

export default RecipeHeader;
