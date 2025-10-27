import { AlertCircle, Lock, FileQuestion, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ErrorStateProps } from "@/components/recipes/types";

/**
 * ErrorState component displays appropriate error messages
 * Shows different icons and messages based on error type
 */
const ErrorState = ({ errorType, message, onBack }: ErrorStateProps) => {
  /**
   * Get error icon based on error type
   */
  const getErrorIcon = () => {
    switch (errorType) {
      case "not_found":
        return <FileQuestion className="w-16 h-16 text-gray-400" />;
      case "forbidden":
        return <Lock className="w-16 h-16 text-red-400" />;
      case "server_error":
        return <ServerCrash className="w-16 h-16 text-orange-400" />;
      case "modification_load_failed":
        return <AlertCircle className="w-16 h-16 text-yellow-400" />;
      default:
        return <AlertCircle className="w-16 h-16 text-gray-400" />;
    }
  };

  /**
   * Get error title based on error type
   */
  const getErrorTitle = () => {
    switch (errorType) {
      case "not_found":
        return "Nie znaleziono przepisu";
      case "forbidden":
        return "Brak dostępu";
      case "server_error":
        return "Wystąpił błąd serwera";
      case "modification_load_failed":
        return "Nie udało się wczytać modyfikacji";
      default:
        return "Wystąpił błąd";
    }
  };

  /**
   * Get error description based on error type
   */
  const getErrorDescription = () => {
    if (message) return message;

    switch (errorType) {
      case "not_found":
        return "Przepis o podanym identyfikatorze nie istnieje lub został usunięty.";
      case "forbidden":
        return "Nie masz uprawnień do wyświetlenia tego przepisu. Przepis jest prywatny i należy do innego użytkownika.";
      case "server_error":
        return "Coś poszło nie tak. Spróbuj ponownie później.";
      case "modification_load_failed":
        return "Nie udało się wczytać modyfikacji przepisu. Przepis oryginalny został wczytany poprawnie.";
      default:
        return "Wystąpił nieoczekiwany błąd.";
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        {/* Error Icon */}
        <div className="p-6 rounded-full bg-gray-50">{getErrorIcon()}</div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-gray-900">{getErrorTitle()}</h2>

        {/* Error Description */}
        <p className="text-gray-600 leading-relaxed max-w-md">{getErrorDescription()}</p>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onBack} variant="default">
            Wróć do przepisów
          </Button>

          {errorType === "server_error" && (
            <Button onClick={() => window.location.reload()} variant="outline">
              Spróbuj ponownie
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
