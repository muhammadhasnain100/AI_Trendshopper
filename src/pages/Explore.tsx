import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useToken } from "@/context/TokenContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Loader2, AlertCircle, Check, Heart, X } from "lucide-react";

interface Shop {
  _id: string;
  shop_name: string;
  description?: string;
  address?: string;
  contact_number?: string;
  contact_email?: string;
}

interface Product {
  _id: string;
  product_name: string;
  description: string;
  price: number;
  product_image?: string;
  shop: Shop;
  liked: boolean;
  like_count?: number;
}

const Explore = () => {
  const { token } = useToken();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  const [successMessages, setSuccessMessages] = useState<Record<string, boolean>>({});
  const [togglingLike, setTogglingLike] = useState<Record<string, boolean>>({});
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/get_all_products/${token}`);
      const j = await res.json();
      if (j.status) setProducts(j.data);
      else throw new Error(j.message);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return fetchAll();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/search_product/${token}?query=${encodeURIComponent(searchQuery)}`
      );
      const j = await res.json();
      if (j.status) {
        setProducts(j.data);
        if (!j.data.length) toast({ title: "No Results", description: "No products match your search." });
      } else throw new Error(j.message);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (id: string) => {
    if (!token) return navigate("/login");
    setAddingToCart(prev => ({ ...prev, [id]: true }));
    const form = new FormData();
    form.append("token", token!);
    form.append("product_id", id);
    form.append("quantity", (qtyMap[id] || 1).toString());
    try {
      const res = await fetch("http://127.0.0.1:8000/add_to_cart", { method: "POST", body: form });
      const j = await res.json();
      if (!j.status) throw new Error(j.message);
      setSuccessMessages(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setSuccessMessages(prev => ({ ...prev, [id]: false })), 2000);
      toast({ title: "Added to Cart", description: "Added successfully." });
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAddingToCart(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleToggleLike = async (id: string) => {
    if (!token) return navigate("/login");
    setTogglingLike(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`http://127.0.0.1:8000/toggle_like/${token}/${id}`, { method: "POST" });
      const j = await res.json();
      if (!j.status) throw new Error(j.message);
      setProducts(prev => prev.map(p => p._id === id ? { ...p, liked: !p.liked, like_count: (p.like_count||0) + (p.liked ? -1 : 1) } : p));
      toast({ title: "Success", description: j.message });
    } catch (e) {
      const msg = (e as Error).message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setTogglingLike(prev => ({ ...prev, [id]: false }));
    }
  };

  const openShopModal = (shop: Shop) => { setSelectedShop(shop); setShopModalOpen(true); };
  const closeShopModal = () => { setShopModalOpen(false); setSelectedShop(null); };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 bg-gray-50 pt-24 ">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <input
            className="flex-1 p-3 border rounded-lg focus:ring focus:ring-[#2c5364] bg-white"
            placeholder="Search products…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleSearch} disabled={loading} className="px-6 py-2">{loading ? <Loader2 /> : <Search />}</Button>
          <Button variant="outline" onClick={fetchAll} disabled={loading} className="px-6 py-2">Clear</Button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"><AlertCircle /><span className="ml-2">{error}</span></div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (<div className="col-span-full flex justify-center"><Loader2 className="animate-spin" /></div>) : products.map(p => (
            <div key={p._id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-transform transform hover:scale-105 overflow-hidden flex flex-col">
              <div className="relative group" onClick={() => p.product_image && setModalImage(`/assets/products_images/${p.product_image}`)}>
                <img
                  src={p.product_image ? `/assets/products_images/${p.product_image}` : undefined}
                  alt={p.product_name}
                  className="h-48 w-full object-cover"
                />
                {/* Heart Button */}
                <button
                  onClick={e => { e.stopPropagation(); handleToggleLike(p._id); }}
                  disabled={togglingLike[p._id]}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md group-hover:bg-gray-100 transform transition-all hover:scale-110"
                >
                  {togglingLike[p._id]
                    ? <Loader2 className="animate-spin" />
                    : <Heart
                        fill={p.liked ? '#e0245e' : 'none'}
                        stroke={p.liked ? '#e0245e' : '#6b7280'}
                      />
                  }
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <Button variant="ghost" size="sm" onClick={() => openShopModal(p.shop)}>View Shop</Button>
                  <span className="text-gray-500 text-sm">{p.like_count || 0} likes</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{p.product_name}</h3>
                <p className="text-gray-600 flex-1 mb-4">{p.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#2c5364]">₹{p.price}</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      value={qtyMap[p._id]||1}
                      onChange={e => setQtyMap({ ...qtyMap, [p._id]: +e.target.value || 1 })}
                      className="w-20 p-2 border rounded-lg focus:ring focus:ring-[#2c5364]"
                    />
                    <Button onClick={() => handleAddToCart(p._id)} disabled={addingToCart[p._id]} className="px-4 py-2">
                      {addingToCart[p._id]
                        ? <Loader2 className="animate-spin" />
                        : successMessages[p._id]
                          ? <><Check /> Added</>
                          : <><ShoppingCart /> Add</>
                      }
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="relative">
            <img src={modalImage} alt="Product" className="max-h-[80vh] max-w-[80vw] rounded-2xl shadow-xl" />
            <button onClick={() => setModalImage(null)} className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
              <X />
            </button>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {shopModalOpen && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md p-6 relative">
            <button onClick={closeShopModal} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
              <X />
            </button>
            <h2 className="text-2xl font-semibold mb-2">{selectedShop.shop_name}</h2>
            {selectedShop.description && <p className="text-gray-700 mb-3">{selectedShop.description}</p>}
            {selectedShop.address && <p className="mb-2"><span className="font-medium">Address:</span> {selectedShop.address}</p>}
            {selectedShop.contact_number && <p className="mb-2"><span className="font-medium">Phone:</span> {selectedShop.contact_number}</p>}
            {selectedShop.contact_email && <p><span className="font-medium">Email:</span> {selectedShop.contact_email}</p>}
          /></div>
        </div>
      )}
    </div>
  );
};

export default Explore;
