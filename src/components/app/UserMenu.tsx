import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { UserInfo } from "./types";
import { getUserDisplayName, getUserInitials } from "./types";

interface UserMenuProps {
  user: UserInfo;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to home page
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
    window.location.href = "/profile";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 focus-visible:ring-green-600"
          aria-label="Otwórz menu użytkownika"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-100 text-green-600 font-medium">{initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate text-sm font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-gray-600">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer hover:bg-green-50">
          <User className="mr-2 h-4 w-4" />
          <span>Profil / Ustawienia</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Wyloguj</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
