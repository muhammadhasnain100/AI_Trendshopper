
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useToken } from '@/context/TokenContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Megaphone, 
  User, 
  LogOut, 
  Settings, 
  CreditCard, 
  Bell,
  Shield,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ShowMyAccount = () => {
  const { token, setToken } = useToken();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    setToken("");
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  const menuCategories = [
    {
      title: 'Account',
      items: [
        { icon: User, text: 'Profile', path: '/edit_profile', description: 'Edit your personal information' },
        { icon: Bell, text: 'Notifications', path: '/notifications', description: 'Manage your notification preferences' },
        { icon: Shield, text: 'Security', path: '/security', description: 'Update password and security settings' },
      ]
    },
    {
      title: 'Business',
      items: [
        { icon: ShoppingBag, text: 'Shop', path: '/shop', description: 'Manage your shop and products' },
        { icon: LayoutDashboard, text: 'Dashboard', path: '/shop-dashboard', description: 'View shop analytics and performance' },
        { icon: Megaphone, text: 'Marketing', path: '/marketing', description: 'Manage marketing campaigns and promotions' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: MessageSquare, text: 'Help Center', path: '/help', description: 'Get assistance with your account' },
        { icon: Settings, text: 'Preferences', path: '/preferences', description: 'Configure account settings' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-5xl mx-auto pt-28 pb-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>
        
        <div className="space-y-8">
          {menuCategories.map((category, index) => (
            <div key={index}>
              <h2 className="font-heading font-medium mb-4 text-lg">{category.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => (
                  <Card 
                    key={item.path}
                    className="card-hover border-0 shadow-sm"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="flex items-center space-x-4 p-6 cursor-pointer">
                      <div className="bg-blue-50 p-3 rounded-full">
                        <item.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium">{item.text}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShowMyAccount;
