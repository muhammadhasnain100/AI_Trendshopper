import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useToken } from '@/context/TokenContext';

const BASE_URL = 'http://127.0.0.1:8000';
const ASSETS_URL = `/assests`;

interface Shop {
  _id: string;
  shop_name: string;
  description: string;
  address: string;
  contact_number: string;
  contact_email: string;
  tagline: string;
  shop_banner: string;
}

interface Product {
  _id: string;
  product_name: string;
  description: string;
  price: number;
  quantity: number;
  product_image: string;
}

interface ShopForm {
  shop_name: string;
  description: string;
  address: string;
  contact_number: string;
  contact_email: string;
  tagline: string;
}

interface ProdForm {
  product_name: string;
  description: string;
  price: string;
  quantity: string;
}

interface CampaignLoading {
  [productId: string]: boolean;
}

interface CampaignStatus {
  [productId: string]: string;
}

interface CampaignResult {
  [productId: string]: any;
}

const ShopDashboard = () => {
  const { token } = useToken();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const [shop, setShop] = useState<Shop | null>(null);
  const [shopError, setShopError] = useState<string>('');
  const [shopForm, setShopForm] = useState<ShopForm>({
    shop_name: '',
    description: '',
    address: '',
    contact_number: '',
    contact_email: '',
    tagline: ''
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [prodError, setProdError] = useState<string>('');
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<ProdForm>({
    product_name: '',
    description: '',
    price: '',
    quantity: ''
  });
  const [prodFile, setProdFile] = useState<File | null>(null);
  const [prodPreview, setProdPreview] = useState<string>('');

  const [campaignLoading, setCampaignLoading] = useState<CampaignLoading>({});
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>({});
  const [campaignResult, setCampaignResult] = useState<CampaignResult>({});

  const previewFile = (file: File | null, setter: (value: string) => void) => {
    if (!file) return setter('');
    const reader = new FileReader();
    reader.onload = e => setter(e.target.result as string);
    reader.readAsDataURL(file);
  };

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
        }
      })
      .catch(e => setShopError(e.message));

    fetch(`${BASE_URL}/get_shop_products/${token}`)
      .then(r => r.json())
      .then(j => {
        if (j.status) setProducts(j.data);
      })
      .catch(e => setProdError(e.message));
  }, [token]);

  const submitShop = async e => {
    e.preventDefault();
    setShopError('');
    const form = new FormData();
    form.append('token', token);
    Object.entries(shopForm).forEach(([k, v]) => form.append(k, v));
    if (bannerFile) form.append('shop_banner', bannerFile);

    const url = shop ? '/edit_shop' : '/create_shop';
    const method = shop ? 'PUT' : 'POST';
    const res = await fetch(`${BASE_URL}${url}`, { method, body: form });
    const j = await res.json();
    if (!j.status) setShopError(j.message);
    else window.location.reload();
  };

  const submitProduct = async e => {
    e.preventDefault();
    setProdError('');
    const form = new FormData();
    form.append('token', token);
    Object.entries(prodForm).forEach(([k, v]) => form.append(k, v));
    if (prodFile) form.append('product_image', prodFile);

    const url = editingProd?._id
      ? `/edit_product/${editingProd._id}`
      : '/add_product';
    const method = editingProd?._id ? 'PUT' : 'POST';
    const res = await fetch(`${BASE_URL}${url}`, { method, body: form });
    const j = await res.json();
    if (!j.status) setProdError(j.message);
    else window.location.reload();
  };

  const deleteProduct = async id => {
    await fetch(`${BASE_URL}/delete_product/${id}?token=${token}`, {
      method: 'DELETE'
    });
    window.location.reload();
  };

  const startCampaign = async productId => {
    setCampaignLoading(cl => ({ ...cl, [productId]: true }));
    setCampaignStatus(cs => ({ ...cs, [productId]: '' }));
    try {
      const res = await fetch(`${BASE_URL}/start-campaign/${productId}`, {
        method: 'POST'
      });
      const json = await res.json();
      setCampaignStatus(cs => ({ ...cs, [productId]: json.message }));
    } catch (e) {
      setCampaignStatus(cs => ({ ...cs, [productId]: e.message }));
    } finally {
      setCampaignLoading(cl => ({ ...cl, [productId]: false }));
    }
  };

  const checkCampaign = async productId => {
    setCampaignLoading(cl => ({ ...cl, [productId]: true }));
    setCampaignStatus(cs => ({ ...cs, [productId]: '' }));
    try {
      const res = await fetch(`${BASE_URL}/check-result/${productId}`);
      const json = await res.json();
      if (json.status) {
        setCampaignStatus(cs => ({ ...cs, [productId]: json.message }));
        setCampaignResult(cr => ({
          ...cr,
          [productId]: json.campaign_result
        }));
      } else {
        setCampaignStatus(cs => ({ ...cs, [productId]: json.message }));
      }
    } catch (e) {
      setCampaignStatus(cs => ({ ...cs, [productId]: e.message }));
    } finally {
      setCampaignLoading(cl => ({ ...cl, [productId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-5xl mx-auto pt-28 pb-8 px-4 space-y-8">
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-2xl font-serif font-bold mb-4">
            {shop ? 'Edit Your Shop' : 'Create Your Shop'}
          </h2>
          {shopError && <p className="text-red-500 mb-4">{shopError}</p>}

          <form onSubmit={submitShop} className="space-y-4">
            {[
              ['shop_name', 'Shop Name'],
              ['description', 'Description'],
              ['address', 'Address'],
              ['contact_number', 'Contact Number'],
              ['contact_email', 'Contact Email'],
              ['tagline', 'Tagline']
            ].map(([k, label]) => (
              <div key={k}>
                <label className="block font-medium mb-1">{label}</label>
                {k === 'description' ? (
                  <textarea
                    name={k}
                    value={shopForm[k]}
                    onChange={e =>
                      setShopForm({ ...shopForm, [k]: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                ) : (
                  <input
                    name={k}
                    value={shopForm[k]}
                    onChange={e =>
                      setShopForm({ ...shopForm, [k]: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
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
                onChange={e => {
                  setBannerFile(e.target.files[0]);
                  previewFile(e.target.files[0], setBannerPreview);
                }}
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

            <button type="submit" className="btn-grad px-6 py-2">
              {shop ? 'Save Shop' : 'Create Shop'}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-serif font-bold">Your Products</h2>
            <button
              onClick={() => {
                setEditingProd(null);
                setProdForm({
                  product_name: '',
                  description: '',
                  price: '',
                  quantity: ''
                });
                setProdFile(null);
                setProdPreview('');
              }}
              className="btn-grad px-4 py-2"
            >
              + Add Product
            </button>
          </div>
          {prodError && <p className="text-red-500 mb-4">{prodError}</p>}

          {editingProd !== null && (
            <form
              onSubmit={submitProduct}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg shadow"
            >
              {[
                ['product_name', 'Name'],
                ['description', 'Description'],
                ['price', 'Price'],
                ['quantity', 'Quantity']
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="block mb-1">{label}</label>
                  <input
                    name={k}
                    type={k === 'price' || k === 'quantity' ? 'number' : 'text'}
                    step={k === 'price' ? '0.01' : undefined}
                    value={prodForm[k]}
                    onChange={e =>
                      setProdForm({ ...prodForm, [k]: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block mb-1">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    setProdFile(e.target.files[0]);
                    previewFile(e.target.files[0], setProdPreview);
                  }}
                />
                {prodPreview && (
                  <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img
                      src={prodPreview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-end space-x-2">
                <button type="submit" className="btn-grad px-4 py-2">
                  {editingProd._id ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProd(null)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {products.length === 0 ? (
            <p>No products yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(p => (
                <div
                  key={p._id}
                  className="bg-white p-4 rounded-lg shadow-md flex flex-col"
                >
                  {p.product_image && (
                    <div className="w-full h-48 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      <img
                        src={`${ASSETS_URL}/products_images/${p.product_image}`}
                        alt={p.product_name}
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold">{p.product_name}</h3>
                  <p className="text-sm mb-1">Qty: {p.quantity}</p>
                  <p className="font-medium mb-2">₹{p.price}</p>
                  <p className="flex-1 text-sm mb-4">{p.description}</p>

                  <div className="space-y-2">
                    <button
                      onClick={() => startCampaign(p._id)}
                      disabled={campaignLoading[p._id]}
                      className="btn-outline w-full py-1"
                    >
                      {campaignLoading[p._id]
                        ? 'Starting…'
                        : 'Start Campaign'}
                    </button>
                    <button
                      onClick={() => checkCampaign(p._id)}
                      disabled={campaignLoading[p._id]}
                      className="btn-grad w-full py-1"
                    >
                      {campaignLoading[p._id]
                        ? 'Checking…'
                        : 'Check Campaign Status'}
                    </button>
                  </div>

                  {campaignResult[p._id] && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm space-y-2">
                      <p><strong>Campaign ID:</strong> {campaignResult[p._id]._id}</p>
                      <p><strong>Product ID:</strong> {campaignResult[p._id].product_id}</p>
                      <p><strong>Shop ID:</strong> {campaignResult[p._id].shop_id}</p>
                      <p><strong>Target Emails:</strong> {campaignResult[p._id].target_mails}</p>
                      <p><strong>Sent Emails:</strong> {campaignResult[p._id].successfully_send_mails}</p>
                      <p><strong>Created At:</strong> {new Date(campaignResult[p._id].created_at).toLocaleString()}</p>
                      <div>
                        <strong>Marketing Strategy:</strong>
                        <pre className="whitespace-pre-wrap bg-white p-2 rounded">
{JSON.stringify(campaignResult[p._id].marketing_strategy, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <strong>Blog Post:</strong>
                        <div className="prose prose-sm max-w-none mt-1">
                          <div dangerouslySetInnerHTML={{ __html: campaignResult[p._id].blog_post }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {campaignStatus[p._id] && (
                    <p className="mt-2 text-gray-700">{campaignStatus[p._id]}</p>
                  )}

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingProd(p);
                        setProdForm({
                          product_name: p.product_name,
                          description: p.description,
                          price: p.price.toString(),
                          quantity: p.quantity.toString()
                        });
                        setProdPreview(
                          `${ASSETS_URL}/products_images/${p.product_image}`
                        );
                      }}
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(p._id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
