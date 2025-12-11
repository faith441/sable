import { useNavigate } from "react-router-dom";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
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

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

const AuthRequiredDialog = ({ open, onOpenChange, action = "add items to your closet" }: AuthRequiredDialogProps) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    onOpenChange(false);
    navigate("/auth");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-sage" />
          </div>
          <AlertDialogTitle className="text-2xl font-light">
            Create Your Account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-light space-y-4">
            <p>
              To {action}, you'll need to create a free account. Your personalized wardrobe recommendations are waiting for you!
            </p>
            <div className="flex items-center justify-center gap-2 text-sage font-medium bg-sage/10 rounded-lg py-3 px-4">
              <Clock className="w-5 h-5" />
              <span>Limited time: Complete your profile in under 30 minutes to unlock exclusive recommendations</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction 
            onClick={handleSignUp}
            className="w-full bg-sage hover:bg-sage/90 text-white"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </AlertDialogAction>
          <AlertDialogCancel className="w-full mt-0">
            Maybe Later
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AuthRequiredDialog;
