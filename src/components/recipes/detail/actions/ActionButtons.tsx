import { Sparkles, Edit, Trash2, Heart, FolderPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionButtonsProps } from "@/components/recipes/types";

/**
 * ActionButtons component displays all action buttons for recipe management
 * Button visibility and state vary based on tab, ownership, and loading states
 */
const ActionButtons = ({
  recipeUserId,
  currentUserId,
  activeTab,
  isFavorited,
  hasModification,
  actionStates,
  onModifyWithAI,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddToCollection,
  onDeleteModification,
}: ActionButtonsProps) => {
  const isOwner = recipeUserId === currentUserId;
  const isOriginalTab = activeTab === "original";

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Action: Modify with AI */}
      <Button onClick={onModifyWithAI} disabled={actionStates.modify} className="w-full" size="lg">
        {actionStates.modify ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Modyfikowanie...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Modyfikuj z AI
          </>
        )}
      </Button>

      {/* Edit Recipe - Only on Original tab and if owner */}
      {isOriginalTab && isOwner && (
        <Button onClick={onEdit} variant="secondary" className="w-full">
          <Edit className="mr-2 h-4 w-4" />
          Edytuj
        </Button>
      )}

      {/* Toggle Favorite */}
      <Button onClick={onToggleFavorite} variant="outline" disabled={actionStates.favorite} className="w-full">
        {actionStates.favorite ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isFavorited ? "Usuwanie..." : "Dodawanie..."}
          </>
        ) : (
          <>
            <Heart className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current text-red-500" : ""}`} />
            {isFavorited ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          </>
        )}
      </Button>

      {/* Add to Collection */}
      <Button onClick={onAddToCollection} variant="outline" disabled={actionStates.addToCollection} className="w-full">
        {actionStates.addToCollection ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Dodawanie...
          </>
        ) : (
          <>
            <FolderPlus className="mr-2 h-4 w-4" />
            Dodaj do kolekcji
          </>
        )}
      </Button>

      {/* Delete Modification - Only on Modified tab if modification exists */}
      {!isOriginalTab && hasModification && isOwner && (
        <Button
          onClick={onDeleteModification}
          variant="destructive"
          disabled={actionStates.deleteModification}
          className="w-full"
        >
          {actionStates.deleteModification ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Usuwanie...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń modyfikację
            </>
          )}
        </Button>
      )}

      {/* Delete Recipe - Only if owner */}
      {isOwner && (
        <Button onClick={onDelete} variant="destructive" disabled={actionStates.delete} className="w-full">
          {actionStates.delete ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Usuwanie...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń przepis
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
