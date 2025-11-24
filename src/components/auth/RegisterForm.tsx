import { useState, useMemo } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ============================================================================
// TYPES
// ============================================================================

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

type PasswordStrength = "weak" | "medium" | "strong";

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

const RegisterForm = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[RegisterForm] Form submitted");

    // Clear general error
    setErrors((prev) => ({ ...prev, general: undefined }));

    // Validate form
    if (!validateForm()) {
      console.log("[RegisterForm] Validation failed");
      return;
    }

    console.log("[RegisterForm] Validation passed, starting registration...");

    // Set loading state
    setIsLoading(true);

    try {
      // Call register API endpoint
      console.log("[RegisterForm] Calling API...");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      console.log("[RegisterForm] API response status:", response.status);

      const data = await response.json();
      console.log("[RegisterForm] API response data:", data);

      if (!response.ok) {
        // Handle error responses
        console.log("[RegisterForm] Registration failed:", data.error);
        setErrors((prev) => ({
          ...prev,
          general: data.error || "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
        }));
        setIsLoading(false);
        return;
      }

      // Success - show success state and toast
      console.log("[RegisterForm] Registration successful");
      setIsSuccess(true);
      toast.success("Konto zostało utworzone!");
      setIsLoading(false);
    } catch (error) {
      console.error("[RegisterForm] Network error:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Wystąpił błąd sieciowy. Sprawdź połączenie z internetem i spróbuj ponownie.",
      }));
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // If registration was successful, show success message
  if (isSuccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Rejestracja zakończona!</CardTitle>
          <CardDescription>Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Icon and Message */}
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Konto zostało utworzone!</h3>
              <p className="text-sm text-gray-600 max-w-md">
                Wysłaliśmy wiadomość z linkiem aktywacyjnym na adres <strong>{formData.email}</strong>
              </p>
            </div>
          </div>

          {/* Instructions Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-gray-700">
              <strong>Ważne:</strong> Aby ukończyć rejestrację, kliknij link potwierdzający w wiadomości e-mail.
              Jeśli nie widzisz wiadomości, sprawdź folder SPAM.
            </AlertDescription>
          </Alert>

          {/* Login Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Potwierdziłeś już swoje konto?{" "}
              <a href="/auth/login" className="text-green-600 hover:text-green-700 hover:underline font-medium">
                Zaloguj się
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Utwórz konto HealthyMeal</CardTitle>
        <CardDescription>Wypełnij formularz, aby rozpocząć swoją zdrową podróż</CardDescription>
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
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={errors.email ? "border-red-500" : ""}
              autoComplete="email"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Hasło <span className="text-red-500">*</span>
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

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Potwierdź hasło <span className="text-red-500">*</span>
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
                Tworzenie konta...
              </>
            ) : (
              "Zarejestruj się"
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            Masz już konto?{" "}
            <a href="/auth/login" className="text-green-600 hover:text-green-700 hover:underline font-medium">
              Zaloguj się
            </a>
          </div>

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

export default RegisterForm;
