
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToken } from "@/context/TokenContext";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  User, 
  Menu, 
  Store, 
  LogOut 
} from "lucide-react";

const Header = () => {
  const { token, setToken } = useToken();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setToken("");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white text-gray-800 shadow-md fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-serif tracking-wide font-semibold">
          <Link to="/">AITrendShopper</Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-base font-serif">
          <Link to="/generate-design" className="hover:text-primary transition">
            Image Generate
          </Link>
          <Link to="/explore" className="hover:text-primary transition">
            Explore
          </Link>
          <Link to="/chatbot" className="hover:text-primary transition">
            Chatbot
          </Link>
        </nav>

        {/* Right Auth/Profile */}
        <div className="hidden md:flex items-center space-x-4">
          {token ? (
            <>
              <Link to="/cart" className="text-xl hover:text-primary transition">
                <ShoppingCart size={20} />
              </Link>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="focus:outline-none hover:text-primary"
                >
                  <User size={20} className="hover:cursor-pointer transition" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 text-sm font-serif">
                    <div className="px-4 py-2 text-gray-500 font-semibold border-b">
                      My Account
                    </div>
                    <Link
                      to="/edit_profile"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      <User size={16} className="text-gray-600" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/shop"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      <Store size={16} className="text-gray-600" />
                      <span>Shop</span>
                    </Link>
                     <Link
                      to="/marketing"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      <Store size={16} className="text-gray-600" />
                      <span>Marketing</span>
                    </Link>
                     <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      <Store size={16} className="text-gray-600" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                    >
                      <LogOut size={16} className="text-gray-600" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="gradient">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline">Signup</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-inner py-4 space-y-3 px-4 text-base font-serif">
          <Link to="/generate-design" className="block hover:text-primary">
            Image Generate
          </Link>
          <Link to="/explore" className="block hover:text-primary">
            Explore
          </Link>
          <Link to="/chatbot" className="block hover:text-primary">
            Chatbot
          </Link>

          {token ? (
            <>
              <Link to="/cart" className="block hover:text-primary">
                Cart
              </Link>
              <Link to="/edit_profile" className="block hover:text-primary">
                Profile
              </Link>
              <Link to="/shop" className="block hover:text-primary">
                Shop
              </Link>
              <Link to="/marketing" className="block hover:text-primary">
                Marketing
              </Link>
              <Link to="/dashboard" className="block hover:text-primary">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left hover:text-primary"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block">
                <Button variant="gradient" className="w-full">Login</Button>
              </Link>
              <Link to="/signup" className="block">
                <Button variant="outline" className="w-full">Signup</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
