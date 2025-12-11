import { useState, useEffect } from "react";
import { Menu, User, FileText, Package, History, Heart, HelpCircle, LogIn, LogOut } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ProfileMenuProps {
  onProfileClick: () => void;
}

const ProfileMenu = ({ onProfileClick }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
        <DropdownMenuLabel className="font-light">
          {user ? user.email : "Account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {user ? (
          <>
            <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span className="font-light">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/favorites")} className="cursor-pointer">
              <Heart className="mr-2 h-4 w-4" />
              <span className="font-light">Favorites</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/orders")} className="cursor-pointer">
              <Package className="mr-2 h-4 w-4" />
              <span className="font-light">Orders</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/past-orders")} className="cursor-pointer">
              <History className="mr-2 h-4 w-4" />
              <span className="font-light">Past Orders</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/contact")} className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span className="font-light">Contact Support</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/terms")} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <span className="font-light">Terms & Conditions</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-light">Sign Out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => navigate("/auth")} className="cursor-pointer">
              <LogIn className="mr-2 h-4 w-4" />
              <span className="font-light">Sign In / Sign Up</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/contact")} className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span className="font-light">Contact Support</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/terms")} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <span className="font-light">Terms & Conditions</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
