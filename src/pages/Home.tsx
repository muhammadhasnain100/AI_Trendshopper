
import React from "react";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { useToken } from "@/context/TokenContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, MessageSquare, ImageIcon } from "lucide-react";

const Home = () => {
  const { token } = useToken();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-white to-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-left mb-8 md:mb-0">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                Discover <span className="text-[#2c5364]">AI-Powered</span> Fashion Trends
              </h1>
              <p className="text-gray-600 text-lg mb-8 max-w-lg">
                Explore the future of fashion with our AI-powered platform. Generate unique designs, shop trending styles, and get personalized recommendations.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/generate-design">
                  <Button variant="gradient" size="lg" className="flex items-center gap-2">
                    <ImageIcon size={18} />
                    Generate Designs
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" size="lg" className="flex items-center gap-2">
                    <ShoppingBag size={18} />
                    Explore Store
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <img 
                src="https://plus.unsplash.com/premium_photo-1700056213493-d2a2747c76be?q=80&w=1999&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="AI Fashion" 
                className="rounded-lg shadow-xl w-full h-auto max-w-md mx-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl font-bold mb-12 text-center">Our AI-Powered Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="bg-[#2c5364] w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <ImageIcon size={24} className="text-white" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-3 text-center">AI Image Generator</h3>
              <p className="text-gray-600 text-center">
                Create unique fashion designs based on your preferences and latest trends.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="bg-[#2c5364] w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <ShoppingBag size={24} className="text-white" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-3 text-center">Trend-Based Shopping</h3>
              <p className="text-gray-600 text-center">
                Explore and shop fashion items curated based on latest AI-detected trends.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="bg-[#2c5364] w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <MessageSquare size={24} className="text-white" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-3 text-center">Fashion Assistant</h3>
              <p className="text-gray-600 text-center">
                Get personalized fashion advice and recommendations from our AI chatbot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!token && (
        <section className="py-16 px-4 bg-gradient-to-br from-[#0f2027] to-[#2c5364] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Join Our AI Fashion Community
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Create an account to save your favorite designs, get personalized recommendations, and stay updated with the latest fashion trends.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button className="bg-white text-[#2c5364] hover:bg-white/90" size="lg">
                  Sign Up Now
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-transparent border border-white hover:bg-white/10" size="lg">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">
            © 2025 AITrendShopper. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
