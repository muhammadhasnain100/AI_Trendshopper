// src/pages/CartPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useToken } from "@/context/TokenContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, AlertCircle, Loader2 } from "lucide-react";

const BASE_URL = "http://127.0.0.1:8000";
const ASSETS_URL = `/assets/products_images`;

interface CartItem {
  _id: string;
  product_name: string;
  description: string;
  price: number;
  ordered_quantity: number;
  product_image?: string;
}

export const CartPage: React.FC = () => {
  const { token } = useToken();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [removingItems, setRemovingItems] = useState<Record<string, boolean>>({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({ title: "Login Required", description: "Please login to view your cart", variant: "destructive" });
      navigate("/login");
    } else {
      fetchCart();
    }
  }, [token]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/get_cart?token=${token}`);
      const json = await res.json();
      if (json.status) setItems(json.cart);
      else throw new Error(json.message);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => items.reduce((sum, i) => sum + i.price * i.ordered_quantity, 0);

  const handleRemove = async (id: string) => {
    setRemovingItems(s => ({ ...s, [id]: true }));
    try {
      const res = await fetch(
        `${BASE_URL}/remove_from_cart?token=${token}&product_id=${id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.status) setItems(items.filter(i => i._id !== id));
      else throw new Error(json.message);
      toast({ title: "Item Removed", description: "Removed from cart." });
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setRemovingItems(s => ({ ...s, [id]: false }));
    }
  };

  const handleCheckout = async () => {
    if (!items.length) return;
    setCheckoutLoading(true);
    try {
      const form = new FormData();
      form.append("token", token || "");
      const res = await fetch(`${BASE_URL}/checkout`, { method: "POST", body: form });
      const json = await res.json();
      if (json.status) {
        toast({ title: "Order Placed", description: "Your order was placed successfully." });
        navigate("/dashboard");
      } else throw new Error(json.message);
    } catch (err) {
      const msg = (err as Error).message;
      toast({ title: "Checkout Failed", description: msg, variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50">
      <Header />
      <div className="max-w-5xl mx-auto pt-28 pb-8 px-4">
        <h1 className="text-3xl font-serif font-bold mb-6">Your Cart</h1>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-[#2c5364]" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        ) : !items.length ? (
          <div className="text-center py-16 space-y-4">
            <ShoppingBag size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-500 text-lg">Your cart is empty</p>
            <Button variant="gradient" onClick={() => navigate("/explore")}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item._id} className="flex bg-gray-50 rounded-lg shadow p-4">
                  <div className="w-32 h-32 bg-gray-100 rounded mr-4 flex-shrink-0 flex items-center justify-center">
                    {item.product_image ? (
                      <img src={`${ASSETS_URL}/${item.product_image}`} alt={item.product_name} className="max-w-full max-h-full object-contain rounded" />
                    ) : <ShoppingBag size={24} className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{item.product_name}</h2>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <p className="font-medium mb-1">Price: ₹{item.price}</p>
                    <p className="font-medium mb-4">Quantity: {item.ordered_quantity}</p>
                    <button onClick={() => handleRemove(item._id)} disabled={removingItems[item._id]} className="text-red-600 hover:text-red-800 flex items-center gap-1">
                      {removingItems[item._id] ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={16} />} Remove
                    </button>
                  </div>
                  <div className="w-24 text-right font-bold text-lg">₹{item.price * item.ordered_quantity}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between font-bold text-lg mb-4">
                <p>Total</p><p>₹{calculateTotal()}</p>
              </div>
              <Button variant="gradient" onClick={handleCheckout} disabled={checkoutLoading} className="w-full py-2">
                {checkoutLoading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
