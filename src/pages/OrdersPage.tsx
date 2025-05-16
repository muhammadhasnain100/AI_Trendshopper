import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useToken } from "@/context/TokenContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ShoppingBag, AlertCircle, Loader2 } from "lucide-react";

const BASE_URL = "http://127.0.0.1:8000";

interface OrderItem { product_id: string; product_name: string; quantity: number; amount: number; }
interface Order { _id: string; items: OrderItem[]; total_amount: number; ordered_at: string; status?: string; }
interface ShopOrder { order_id: string; items: OrderItem[]; total_amount: number; ordered_at: string; status: string; }

export const OrdersPage: React.FC = () => {
  const { token } = useToken();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingShop, setLoadingShop] = useState(true);
  const [errorUser, setErrorUser] = useState<string>("");
  const [errorShop, setErrorShop] = useState<string>("");
  const [readOrders, setReadOrders] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return navigate("/login");
    fetchUserOrders();
    fetchShopOrders();
  }, [token]);

  const fetchUserOrders = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch(`${BASE_URL}/orders/${token}`);
      const json = await res.json();
      if (json.status) setUserOrders(json.orders);
      else setErrorUser(json.message);
    } catch (err) {
      setErrorUser((err as Error).message);
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchShopOrders = async () => {
    setLoadingShop(true);
    try {
      const res = await fetch(`${BASE_URL}/shop_orders/${token}`);
      const json = await res.json();
      if (json.status) {
        // compute total_amount per shop order
        const orders: ShopOrder[] = json.orders.map((o: any) => ({
          order_id: o.order_id,
          items: o.items,
          status: o.status || "pending",
          ordered_at: o.ordered_at,
          total_amount: o.items.reduce((sum: number, it: OrderItem) => sum + it.amount, 0),
        }));
        setShopOrders(orders);
      } else setErrorShop(json.message);
    } catch (err) {
      setErrorShop((err as Error).message);
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingShop(false);
    }
  };

  const handleComplete = async (orderId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/complete/${token}`, { method: 'POST' });
      const json = await res.json();
      if (json.status) {
        toast({ title: "Success", description: "Order marked as completed" });
        setUserOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'completed' } : o));
      } else {
        toast({ title: "Failed", description: json.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleMarkRead = (orderId: string) => {
    setReadOrders(prev => [...prev, orderId]);
    toast({ title: "Marked read", description: `Shop order ${orderId} marked as read` });
  };

  // aggregate product sales for shop owner
  const productSales = shopOrders.reduce((acc, o) => {
    o.items.forEach(it => {
      if (!acc[it.product_id]) acc[it.product_id] = { name: it.product_name, quantity: 0, amount: 0 };
      acc[it.product_id].quantity += it.quantity;
      acc[it.product_id].amount += it.amount;
    });
    return acc;
  }, {} as Record<string, { name: string; quantity: number; amount: number }>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50">
      <Header />
      <div className="max-w-5xl mx-auto pt-28 pb-8 px-4 space-y-12">
        <section>
          <h1 className="text-3xl font-serif font-bold mb-6">Your Purchases</h1>
          {loadingUser ? (
            <Loader2 className="animate-spin h-8 w-8 text-[#2c5364]" />
          ) : errorUser ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2">
              <AlertCircle size={20} /><p>{errorUser}</p>
            </div>
          ) : !userOrders.length ? (
            <div className="text-center py-16 space-y-4">
              <ShoppingBag size={48} className="mx-auto text-gray-300" />
              <p className="text-gray-500 text-lg">You have no orders yet</p>
              <Button variant="gradient" onClick={() => navigate("/explore")}>Start Shopping</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {userOrders.map(o => (
                <div key={o._id} className="bg-gray-50 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-2">Order ID: {o._id}</h2>
                  <p className="text-sm text-gray-600 mb-2">Date: {o.ordered_at}</p>
                  <div className="space-y-2">
                    {o.items.map(it => (
                      <div key={it.product_id} className="flex justify-between">
                        <span>{it.product_name} x {it.quantity}</span><span>₹{it.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span><span>₹{o.total_amount}</span>
                  </div>
                  <div className="mt-4">
                    {o.status !== 'completed' ? (
                      <Button variant="gradient" onClick={() => handleComplete(o._id)}>Mark as Complete</Button>
                    ) : (
                      <Button disabled>Completed</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h1 className="text-3xl font-serif font-bold mb-6">Your Sales</h1>
          {loadingShop ? (
            <Loader2 className="animate-spin h-8 w-8 text-[#2c5364]" />
          ) : errorShop ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2">
              <AlertCircle size={20} /><p>{errorShop}</p>
            </div>
          ) : !shopOrders.length ? (
            <div className="text-center py-16 space-y-4">
              <ShoppingBag size={48} className="mx-auto text-gray-300" />
              <p className="text-gray-500 text-lg">No orders for your shop yet</p>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {shopOrders.map(o => (
                  <div key={o.order_id} className="bg-gray-50 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-2">Order ID: {o.order_id}</h2>
                    <p className="text-sm text-gray-600 mb-2">Date: {o.ordered_at}</p>
                    <div className="space-y-2">
                      {o.items.map(it => (
                        <div key={it.product_id} className="flex justify-between">
                          <span>{it.product_name} x {it.quantity}</span><span>₹{it.amount}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-4"><span>Total</span><span>₹{o.total_amount}</span></div>
                    <div className="mt-4">
                      {o.status === 'pending' && !readOrders.includes(o.order_id) ? (
                        <Button onClick={() => handleMarkRead(o.order_id)}>Mark as Read</Button>
                      ) : (
                        <Button disabled>Read</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Product sales summary */}
              <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Product Sales Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(productSales).map(([pid, data]) => (
                    <div key={pid} className="bg-white border rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-lg mb-2">{data.name}</h3>
                      <p>Quantity Sold: {data.quantity}</p>
                      <p>Total Revenue: ₹{data.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
