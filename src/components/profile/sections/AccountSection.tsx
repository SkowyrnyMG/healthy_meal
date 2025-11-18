import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info, Lock, LogOut, Trash2 } from "lucide-react";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Placeholder section for account management features
 *
 * Features:
 * - Info alert about upcoming features
 * - Email display (placeholder)
 * - Disabled buttons for future actions
 *
 * TODO: Integrate with Supabase Auth when available
 */
export const AccountSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Konto</h2>
        <p className="mt-1 text-sm text-gray-600">Zarządzaj ustawieniami swojego konta.</p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Funkcje zarządzania kontem będą dostępne wkrótce. Pracujemy nad integracją z systemem uwierzytelniania.
        </AlertDescription>
      </Alert>

      {/* Email Display */}
      <div className="space-y-2">
        <Label htmlFor="email">Adres email</Label>
        <Input
          id="email"
          type="email"
          value="user@example.com"
          disabled
          className="bg-gray-50"
          aria-describedby="email-note"
        />
        <p id="email-note" className="text-sm text-gray-500">
          Adres email powiązany z Twoim kontem.
        </p>
      </div>

      {/* Account Actions */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900">Akcje konta</h3>

        {/* Change Password */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Zmień hasło</p>
            <p className="text-sm text-gray-500">Zaktualizuj hasło do swojego konta.</p>
          </div>
          <Button variant="outline" disabled>
            <Lock className="mr-2 h-4 w-4" />
            Zmień hasło
          </Button>
        </div>

        {/* Logout */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Wyloguj się</p>
            <p className="text-sm text-gray-500">Wyloguj się z bieżącej sesji.</p>
          </div>
          <Button variant="outline" disabled>
            <LogOut className="mr-2 h-4 w-4" />
            Wyloguj
          </Button>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
          <div>
            <p className="text-sm font-medium text-red-700">Usuń konto</p>
            <p className="text-sm text-red-600">
              Trwale usuń swoje konto i wszystkie dane. Ta akcja jest nieodwracalna.
            </p>
          </div>
          <Button variant="destructive" disabled>
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń konto
          </Button>
        </div>
      </div>
    </div>
  );
};
