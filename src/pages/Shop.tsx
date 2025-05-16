import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useToken } from '@/context/TokenContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Store,
  Package as ProductIcon,
  Settings,
  AlertCircle,
} from 'lucide-react';

const BASE_URL = 'http://127.0.0.1:8000';
const ASSETS_URL = `/assets`;

export default function Shop() {
  const { token } = useToken();
  const navigate = useNavigate();

  // Shop state
  const [shop, setShop] = useState<any>(null);
  const [shopError, setShopError] = useState('');
  const [shopForm, setShopForm] = useState({
    shop_name: '',
    description: '',
    address: '',
    contact_number: '',
    contact_email: '',
    tagline: '',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [prodError, setProdError] = useState('');
  const [editingProd, setEditingProd] = useState<any>(null);
  const [prodForm, setProdForm] = useState({
    product_name: '',
    description: '',
    price: '',
    quantity: '',
  });
  const [prodFile, setProdFile] = useState<File | null>(null);
  const [prodPreview, setProdPreview] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // File preview helper
  const previewFile = (file: File | null, setter: (url: string) => void) => {
    if (!file) { setter(''); return; }
    const reader = new FileReader();
    reader.onload = e => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Fetch shop and products
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/get_shop/${token}`)
      .then(r => r.json())
      .then(j => {
        if (j.status) {
          setShop(j.data);
          setShopForm({
            shop_name: j.data.shop_name,
            description: j.data.description,
            address: j.data.address,
            contact_number: j.data.contact_number,
            contact_email: j.data.contact_email,
            tagline: j.data.tagline,
          });
          setBannerPreview(`${ASSETS_URL}/shops_images/${j.data.shop_banner}`);
        } else {
          setShopError(j.message);
        }
      })
      .catch(e => setShopError((e as Error).message));

    fetch(`${BASE_URL}/get_shop_products/${token}`)
      .then(r => r.json())
      .then(j => j.status ? setProducts(j.data) : setProdError(j.message))
      .catch(e => setProdError((e as Error).message));
  }, [token]);

  // Create or update shop
  const submitShop = async (e: React.FormEvent) => {
    e.preventDefault(); setShopError('');
    const form = new FormData();
    form.append('token', token!);
    Object.entries(shopForm).forEach(([k, v]) => form.append(k, v));
    if (bannerFile) form.append('shop_banner', bannerFile);
    const url = shop ? '/edit_shop' : '/create_shop';
    const method = shop ? 'PUT' : 'POST';
    const res = await fetch(`${BASE_URL}${url}`, { method, body: form });
    const j = await res.json();
    if (!j.status) setShopError(j.message);
    else window.location.reload();
  };

  // Add or edit product
  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setProdError('');
    const form = new FormData();
    form.append('token', token!);
    Object.entries(prodForm).forEach(([k, v]) => form.append(k, v));
    if (prodFile) form.append('product_image', prodFile);
    const url = editingProd?._id ? `/edit_product/${editingProd._id}` : '/add_product';
    const method = editingProd?._id ? 'PUT' : 'POST';
    const res = await fetch(`${BASE_URL}${url}`, { method, body: form });
    const j = await res.json();
    if (!j.status) setProdError(j.message);
    else window.location.reload();
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    await fetch(`${BASE_URL}/delete_product/${id}/${token}`, { method: 'DELETE' });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br from-blue-50">
      <Header />
      <div className="max-w-6xl mx-auto pt-28 px-4 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-gray-600" />
            <h1 className="text-3xl font-heading font-bold tracking-tight">Shop Management</h1>
          </div>
          <Button onClick={() => navigate('/shop-dashboard')}>
            <Settings className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Shop Details</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>{shop ? 'Edit Your Shop' : 'Create Your Shop'}</CardTitle>
                <CardDescription>Manage your store information and branding</CardDescription>
              </CardHeader>
              <CardContent>
                {shopError && <p className="text-red-500 mb-4"><AlertCircle className="inline mr-1" />{shopError}</p>}
                <form onSubmit={submitShop} className="space-y-4">
                  {Object.entries({
                    shop_name: 'Shop Name',
                    description: 'Description',
                    address: 'Address',
                    contact_number: 'Contact Number',
                    contact_email: 'Contact Email',
                    tagline: 'Tagline',
                  }).map(([k, label]) => (
                    <div key={k}>
                      <label className="block font-medium mb-1">{label}</label>
                      {k === 'description' ? (
                        <textarea name={k}
                          value={shopForm[k as keyof typeof shopForm]}
                          onChange={e => setShopForm({ ...shopForm, [k]: e.target.value })}
                          className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-200"
                          required
                        />
                      ) : (
                        <input name={k}
                          value={shopForm[k as keyof typeof shopForm]}
                          onChange={e => setShopForm({ ...shopForm, [k]: e.target.value })}
                          className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-200"
                          required
                        />
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block font-medium mb-1">Shop Banner</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => { setBannerFile(e.target.files![0]); previewFile(e.target.files![0], setBannerPreview); }}
                    />
                    {bannerPreview && (
                      <div className="mt-2 w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img
                          src={bannerPreview}
                          alt="Banner"
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <Button type="submit" variant="gradient" className="w-full">
                    {shop ? 'Save Shop' : 'Create Shop'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>List, add, or modify your inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <Button variant="gradient" onClick={() => {
                    setEditingProd({});
                    setProdForm({ product_name: '', description: '', price: '', quantity: '' });
                    setProdFile(null);
                    setProdPreview('');
                  }}>
                    <ProductIcon className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {prodError && <p className="text-red-500 mb-4"><AlertCircle className="inline mr-1" />{prodError}</p>}

                {editingProd !== null && (
                  <form onSubmit={submitProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {['product_name','description','price','quantity'].map(k => (
                      <div key={k}>
                        <label className="block font-medium mb-1">{k.replace('_', ' ').toUpperCase()}</label>
                        <input
                          name={k}
                          type={(k==='price'||k==='quantity') ? 'number' : 'text'}
                          step={k==='price' ? '0.01' : undefined}
                          required
                          value={prodForm[k as keyof typeof prodForm]}
                          onChange={e => setProdForm({ ...prodForm, [k]: e.target.value })}
                          className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-200"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block font-medium mb-1">Product Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => { setProdFile(e.target.files![0]); previewFile(e.target.files![0], setProdPreview); }}
                      />
                      {prodPreview && (
                        <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <img src={prodPreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button type="submit" variant="gradient">
                        {editingProd._id ? 'Update' : 'Add'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingProd(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {products.map(p => (
                    <Card key={p._id} className="shadow hover:shadow-md">
                      <CardContent>
                        {p.product_image && (
                          <div className="w-full h-48 bg-gray-100 rounded mb-2 flex items-center justify-center">
                            <img
                              src={`${ASSETS_URL}/products_images/${p.product_image}`}
                              alt={p.product_name}
                              className="max-w-full max-h-full object-contain rounded"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold text-lg">{p.product_name}</h3>
                        <p className="text-sm mb-1">Qty: {p.quantity}</p>
                        <p className="font-medium mb-2">₹{p.price}</p>
                        <p className="text-sm mb-4 flex-1">{p.description}</p>
                        <div className="flex space-x-2">
                          <Button variant="link" size="sm" onClick={() => {
                            setEditingProd(p);
                            setProdForm({ product_name: p.product_name, description: p.description, price: p.price, quantity: p.quantity });
                            setProdPreview(`${ASSETS_URL}/products_images/${p.product_image}`);
                          }}>
                            Edit
                          </Button>
                          <Button variant="link" size="sm" onClick={() => deleteProduct(p._id)}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}