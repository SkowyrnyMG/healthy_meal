import type { CollectionDTO } from "@/types";

/**
 * Dialog state management for all collection dialogs
 */
export interface DialogState {
  create: boolean;
  edit: {
    open: boolean;
    collection: CollectionDTO | null;
  };
  delete: {
    open: boolean;
    collection: CollectionDTO | null;
  };
}

/**
 * Form data structure for create/edit collection dialogs
 */
export interface CollectionFormData {
  name: string;
}

/**
 * Validation errors for collection forms
 */
export interface CollectionFormErrors {
  name?: string;
}

/**
 * Props for CollectionsLayout component
 */
export interface CollectionsLayoutProps {
  initialCollections: CollectionDTO[];
}

/**
 * Props for CollectionGrid component
 */
export interface CollectionGridProps {
  collections: CollectionDTO[];
  onCardClick: (collectionId: string) => void;
  onEdit: (collection: CollectionDTO) => void;
  onDelete: (collection: CollectionDTO) => void;
}

/**
 * Props for CollectionCard component
 */
export interface CollectionCardProps {
  collection: CollectionDTO;
  onClick: (collectionId: string) => void;
  onEdit: (collection: CollectionDTO) => void;
  onDelete: (collection: CollectionDTO) => void;
}

/**
 * Props for CreateCollectionDialog component
 */
export interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (collection: CollectionDTO) => void;
}

/**
 * Props for EditCollectionDialog component
 */
export interface EditCollectionDialogProps {
  open: boolean;
  collection: CollectionDTO | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCollection: { id: string; name: string }) => void;
}

/**
 * Props for DeleteCollectionDialog component
 */
export interface DeleteCollectionDialogProps {
  open: boolean;
  collection: CollectionDTO | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (deletedCollectionId: string) => void;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  onCreateClick: () => void;
}
