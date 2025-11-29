import { Menu, User, FileText, Package, History, Sparkles, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  onProfileClick: () => void;
  onRegenerateWardrobe?: () => void;
}

const ProfileMenu = ({ onProfileClick, onRegenerateWardrobe }: ProfileMenuProps) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-light">Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span className="font-light">Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/favorites")} className="cursor-pointer">
          <Heart className="mr-2 h-4 w-4" />
          <span className="font-light">Favorites</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Package className="mr-2 h-4 w-4" />
          <span className="font-light">Orders</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <History className="mr-2 h-4 w-4" />
          <span className="font-light">Past Orders</span>
        </DropdownMenuItem>
        {onRegenerateWardrobe && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRegenerateWardrobe} className="cursor-pointer">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="font-light">Regenerate Wardrobe</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          <span className="font-light">Terms & Conditions</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
