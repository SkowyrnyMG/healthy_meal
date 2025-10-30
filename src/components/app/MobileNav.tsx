import { useState } from "react";
import { Menu, LogOut, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { NavLink, UserInfo } from "./types";
import { getUserDisplayName, getUserInitials } from "./types";

interface MobileNavProps {
  user: UserInfo | null;
  navLinks: NavLink[];
  currentPath: string;
  showNewRecipeButton?: boolean;
}

const MobileNav = ({ user, navLinks, currentPath, showNewRecipeButton = true }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (href: string) => {
    // Close the menu before navigating
    setIsOpen(false);
    // eslint-disable-next-line react-compiler/react-compiler
    window.location.href = href;
  };

  const handleLogout = async () => {
    setIsOpen(false);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        // eslint-disable-next-line no-console
        console.error("Logout failed");
        alert("Nie udało się wylogować. Spróbuj ponownie.");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      alert("Wystąpił błąd podczas wylogowywania.");
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    window.location.href = "/profile";
  };

  const handleAuthClick = () => {
    setIsOpen(false);
    // TODO: Redirect to actual login/register pages when implemented
    alert("Ta funkcja będzie wkrótce dostępna");
  };

  const handleNewRecipeClick = () => {
    setIsOpen(false);
    window.location.href = "/recipes/new";
  };

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-700 hover:text-green-600"
          aria-label="Otwórz menu mobilne"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left text-xl font-bold">Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-8 flex flex-col gap-6">
          {/* User Info Section (if authenticated) */}
          {user && (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-green-100 text-green-600 text-lg font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{displayName}</span>
                  <span className="text-xs text-gray-600">{user.email}</span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Navigation Links (only if authenticated) */}
          {user && navLinks.length > 0 && (
            <>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = currentPath === link.href || currentPath.startsWith(link.href + "/");
                  return (
                    <button
                      key={link.href}
                      onClick={() => handleNavClick(link.href)}
                      className={`text-left text-base font-medium transition-colors px-3 py-2 rounded-md ${
                        isActive ? "text-green-600 bg-green-50" : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </nav>
              <Separator />
            </>
          )}

          {/* New Recipe Button (mobile, only when authenticated) */}
          {user && showNewRecipeButton && (
            <>
              <Button onClick={handleNewRecipeClick} className="w-full bg-green-600 hover:bg-green-700 justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Nowy przepis
              </Button>
              <Separator />
            </>
          )}

          {/* Profile & Logout (if authenticated) */}
          {user ? (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={handleProfileClick}
                className="w-full justify-start text-gray-700 hover:text-green-600 hover:bg-green-50"
              >
                <User className="mr-2 h-4 w-4" />
                Profil / Ustawienia
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Wyloguj
              </Button>
            </div>
          ) : (
            /* Auth Buttons (if not authenticated) */
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleAuthClick}
                className="w-full border-gray-300 hover:border-green-600 hover:text-green-600"
              >
                Zaloguj się
              </Button>
              <Button onClick={handleAuthClick} className="w-full bg-green-600 hover:bg-green-700">
                Zarejestruj się
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
