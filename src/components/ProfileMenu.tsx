import { useState, useEffect } from "react";
import { Menu, User, FileText, Package, History, Heart, HelpCircle, LogIn, LogOut, ShoppingBag, Shield, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleDeleteAccount = async () => {
    try {
      // Delete user from Supabase Auth
      const { error } = await supabase.rpc('delete_user');

      if (error) {
        // Fallback: sign out user if RPC doesn't exist
        console.error("Error deleting account:", error);
        await supabase.auth.signOut();
        toast.error("Unable to delete account. Please contact support.");
        return;
      }

      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An error occurred while deleting your account");
    }
  };

  return (
    <>
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
            <DropdownMenuItem onClick={() => navigate("/shop")} className="cursor-pointer">
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span className="font-light">Shop</span>
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
            <DropdownMenuItem onClick={() => navigate("/privacy")} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span className="font-light">Privacy Policy</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-light">Sign Out</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="cursor-pointer text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="font-light">Delete Account</span>
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

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove all your data including your wardrobe, favorites, and order history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ProfileMenu;
