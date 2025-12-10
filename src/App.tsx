import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Marketing from "./pages/Marketing";
import Blog from "./pages/Blog";
import Auth from "./pages/Auth";
import Survey from "./pages/Survey";
import Wardrobe from "./pages/Wardrobe";
import Closet from "./pages/Closet";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AIStyleChat from "./pages/AIStyleChat";
import VirtualTryOn from "./pages/VirtualTryOn";
import OutfitPlanner from "./pages/OutfitPlanner";
import Admin from "./pages/Admin";
import Favorites from "./pages/Favorites";
import Orders from "./pages/Orders";
import PastOrders from "./pages/PastOrders";
import TermsAndConditions from "./pages/TermsAndConditions";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Marketing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/closet" element={<Closet />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/ai-stylist" element={<AIStyleChat />} />
          <Route path="/virtual-tryon" element={<VirtualTryOn />} />
          <Route path="/outfit-planner" element={<OutfitPlanner />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/past-orders" element={<PastOrders />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
