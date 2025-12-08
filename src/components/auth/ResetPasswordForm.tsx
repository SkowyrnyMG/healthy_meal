import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ============================================================================
// TYPES
// ============================================================================

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

type PasswordStrength = "weak" | "medium" | "strong";

interface ResetPasswordFormProps {
  token?: string | null;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return "Hasło jest wymagane";
  }
  if (password.length < 8) {
    return "Hasło musi mieć co najmniej 8 znaków";
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return "Hasło musi zawierać co najmniej jedną literę i jedną cyfrę";
  }
  return undefined;
};

const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) {
    return "Potwierdzenie hasła jest wymagane";
  }
  if (password !== confirmPassword) {
    return "Hasła nie są identyczne";
  }
  return undefined;
};

// ============================================================================
// PASSWORD STRENGTH HELPERS
// ============================================================================

const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length === 0) return "weak";

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Weak: < 8 chars or only numbers/letters
  if (password.length < 8 || (!hasLetter && !hasNumber)) {
    return "weak";
  }

  // Strong: 12+ chars with letters, numbers, and special characters
  if (password.length >= 12 && hasLetter && hasNumber && hasSpecial) {
    return "strong";
  }

  // Medium: 8+ chars with letters and numbers
  return "medium";
};

const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
  }
};

const getPasswordStrengthLabel = (strength: PasswordStrength): string => {
  switch (strength) {
    case "weak":
      return "Słabe";
    case "medium":
      return "Średnie";
    case "strong":
      return "Silne";
  }
};

const getPasswordStrengthWidth = (strength: PasswordStrength): string => {
  switch (strength) {
    case "weak":
      return "w-1/3";
    case "medium":
      return "w-2/3";
    case "strong":
      return "w-full";
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading] = useState(false);
  const [isSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  // Countdown timer for redirect after success
  useEffect(() => {
    if (isSuccess && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, redirectCountdown]);

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordFormErrors = {};

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

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
    console.log("Reset password form submitted:", formData);
  };

  const handleChange = (field: keyof ResetPasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Invalid or expired token state
  if (!token || token === "invalid") {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-center">Link wygasł lub jest nieprawidłowy</CardTitle>
          <CardDescription className="text-center">
            Link do resetowania hasła wygasł lub jest nieprawidłowy
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Link resetowania hasła jest ważny tylko przez 1 godzinę. Aby zresetować hasło, wyślij nowy link.
            </p>
          </div>

          <Button asChild className="w-full">
            <a href="/auth/forgot-password">Wyślij nowy link</a>
          </Button>

          <div className="flex justify-center">
            <a href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
              Wróć do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state - show confirmation message
  if (isSuccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-center">Hasło zostało zmienione!</CardTitle>
          <CardDescription className="text-center">Twoje hasło zostało pomyślnie zaktualizowane</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 text-center">
              Możesz teraz zalogować się na swoje konto używając nowego hasła.
            </p>
          </div>

          {redirectCountdown > 0 ? (
            <div className="text-center">
              <p className="text-sm text-gray-600">Przekierowanie do logowania za {redirectCountdown}...</p>
            </div>
          ) : null}

          <Button asChild className="w-full">
            <a href="/auth/login">Przejdź do logowania</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Form state - show password reset form
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* General Error Alert */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Nowe hasło <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 znaków"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error password-strength" : "password-strength"}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div id="password-strength" className="space-y-1" aria-live="polite">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)} ${getPasswordStrengthWidth(passwordStrength)}`}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Siła hasła: <span className="font-medium">{getPasswordStrengthLabel(passwordStrength)}</span>
                </p>
              </div>
            )}

            {errors.password && (
              <p id="password-error" className="text-sm text-red-600" role="alert">
                {errors.password}
              </p>
            )}
            <p className="text-xs text-gray-500">Hasło musi zawierać co najmniej 8 znaków</p>
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Potwierdź nowe hasło <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Wprowadź hasło ponownie"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-red-600" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zmień hasło"
            )}
          </Button>

          {/* Required Fields Note */}
          <div className="pt-2">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Pola wymagane
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
