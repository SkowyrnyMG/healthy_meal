import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavLink } from "./types";

const navLinks: NavLink[] = [
  { href: "#features", label: "Funkcje" },
  { href: "#how-it-works", label: "Jak to działa" },
];

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (href: string) => {
    // Close the menu
    setIsOpen(false);

    // Smooth scroll to the section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAuthClick = (href: string) => {
    setIsOpen(false);
    window.location.href = href;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-700 hover:text-green-600" aria-label="Otwórz menu">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left text-xl font-bold">Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-6">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-left text-lg font-medium text-gray-700 transition-colors hover:text-green-600"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Auth Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => handleAuthClick("/auth/login")}
              className="w-full border-gray-300 hover:border-green-600 hover:text-green-600"
            >
              Zaloguj się
            </Button>
            <Button
              onClick={() => handleAuthClick("/auth/register")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Zarejestruj się
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
