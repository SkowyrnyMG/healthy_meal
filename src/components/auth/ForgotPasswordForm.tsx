import { useState } from "react";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ============================================================================
// TYPES
// ============================================================================

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormErrors {
  email?: string;
  general?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return "Adres e-mail jest wymagany";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Wprowadź poprawny adres e-mail";
  }
  return undefined;
};

// ============================================================================
// COMPONENT
// ============================================================================

const ForgotPasswordForm = () => {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });

  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ForgotPasswordFormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear general error
    setErrors((prev) => ({ ...prev, general: undefined }));

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Form submission logic will be implemented in the next phase
    console.log("Forgot password form submitted:", formData);
  };

  const handleChange = (value: string) => {
    setFormData({ email: value });
    // Clear field error when user starts typing
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Success state - show confirmation message
  if (isSuccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-center">Sprawdź swoją skrzynkę e-mail</CardTitle>
          <CardDescription className="text-center">
            Link do resetowania hasła został wysłany na Twój adres e-mail
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Jeśli konto z adresem <strong>{formData.email}</strong> istnieje, otrzymasz wiadomość e-mail z linkiem
              do resetowania hasła w ciągu kilku minut.
            </p>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              Nie widzisz wiadomości? Sprawdź folder spam lub spróbuj ponownie za kilka minut.
            </p>
          </div>

          <Button asChild className="w-full">
            <a href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć do logowania
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Form state - show email input
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Resetuj hasło</CardTitle>
        <CardDescription>
          Podaj adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do resetowania hasła.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* General Error Alert */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Adres e-mail <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.pl"
              value={formData.email}
              onChange={(e) => handleChange(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={errors.email ? "border-red-500" : ""}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              "Wyślij link resetujący"
            )}
          </Button>

          {/* Back to Login Link */}
          <div className="flex justify-center">
            <a
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Wróć do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
