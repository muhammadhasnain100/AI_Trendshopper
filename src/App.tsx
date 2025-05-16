
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokenProvider } from "@/context/TokenContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import FashionImageGenerator from "./pages/FashionImageGenerator";
import Explore from "./pages/Explore";
import ChatBot from "./pages/ChatBot";
import {CartPage} from "./pages/CartPage";
import NotFound from "./pages/NotFound";
import ShowMyAccount from "./pages/ShowMyAccount";
import Shop from "./pages/Shop";
import ShopDashboard from "./pages/ShopDashboard";
import Marketing from "./pages/Marketing";
import Signup from "./pages/Signup";
import {OrdersPage} from "@/pages/OrdersPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TokenProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/myaccount" element={<ShowMyAccount />} />
            <Route path="/edit_profile" element={<Profile />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop-dashboard" element={<ShopDashboard />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/generate-design" element={<FashionImageGenerator />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/chatbot" element={<ChatBot />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/dashboard" element={<OrdersPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TokenProvider>
  </QueryClientProvider>
);

export default App;
