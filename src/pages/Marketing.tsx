import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '@/components/Header';
import { useToken } from '@/context/TokenContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Product {
  _id: string;
  shop_id: string;
  product_name: string;
  description: string;
  price: number;
  quantity: number;
  product_image: string;
  like_count: number;
  created_at: string;
}

interface CampaignResult {
  blog_post: string;
  target_mails: number;
  successfully_send_mails: number;
  marketing_strategy: Record<string, any>;
  [key: string]: any;
}

interface ProductState {
  product: Product;
  marketingDone: boolean;
  posterUrl?: string;
  campaignResult?: CampaignResult;
  loadingAction?: boolean;
}

type SectionState = Record<
  string,
  { image: boolean; blog: boolean; suggestions: boolean; stats: boolean }
>;

const Marketing = () => {
  const { token } = useToken();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductState[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<SectionState>({});

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const loadProducts = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/get_shop_products/${token}`);
        const json = await res.json();
        if (!json.status) throw new Error(json.message);

        const initial = json.data.map((p: Product) => ({ product: p, marketingDone: false }));
        setProducts(initial);

        const detailed = await Promise.all(
          initial.map(async (ps) => {
            const id = ps.product._id;
            const statusRes = await fetch(`http://127.0.0.1:8000/marketing-status/${id}`);
            const statusJson = await statusRes.json();

            if (statusJson.status) {
              const [posterBlob, resultRes] = await Promise.all([
                fetch(`http://127.0.0.1:8000/product-poster/${id}`).then((r) => r.blob()),
                fetch(`http://127.0.0.1:8000/check-result/${id}`),
              ]);

              const posterUrl = URL.createObjectURL(posterBlob);
              const resultJson = await resultRes.json();

              setOpenSections((prev) => ({
                ...prev,
                [id]: { image: false, blog: false, suggestions: false, stats: false },
              }));

              return {
                ...ps,
                marketingDone: true,
                posterUrl,
                campaignResult: resultJson.campaign_result,
              };
            }

            return ps;
          })
        );

        setProducts(detailed);
      } catch (err: any) {
        toast({ title: 'Error loading products', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [token, navigate, toast]);

  const toggleSection = (productId: string, section: keyof SectionState[string]) => {
    setOpenSections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [section]: !prev[productId]?.[section],
      },
    }));
  };

  const handleStartCampaign = async (productId: string) => {
    setProducts((prev) =>
      prev.map((ps) => (ps.product._id === productId ? { ...ps, loadingAction: true } : ps))
    );

    try {
      const res = await fetch(`http://127.0.0.1:8000/start-campaign/${productId}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!json.status) throw new Error(json.message);

      const [posterBlob, resultRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/product-poster/${productId}`).then((r) => r.blob()),
        fetch(`http://127.0.0.1:8000/check-result/${productId}`),
      ]);

      const posterUrl = URL.createObjectURL(posterBlob);
      const resultJson = await resultRes.json();

      setOpenSections((prev) => ({
        ...prev,
        [productId]: { image: false, blog: false, suggestions: false, stats: false },
      }));

      setProducts((prev) =>
        prev.map((ps) =>
          ps.product._id === productId
            ? {
                ...ps,
                loadingAction: false,
                marketingDone: true,
                posterUrl,
                campaignResult: resultJson.campaign_result,
              }
            : ps
        )
      );
    } catch (err: any) {
      toast({ title: 'Failed to start campaign', description: err.message, variant: 'destructive' });
      setProducts((prev) =>
        prev.map((ps) =>
          ps.product._id === productId ? { ...ps, loadingAction: false } : ps
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="max-w-6xl mx-auto pt-28 px-4 pb-12">
        <h1 className="text-4xl font-heading font-bold text-gray-800 mb-8">
          Marketing Dashboard
        </h1>

        {loading ? (
          <p>Loading products…</p>
        ) : (
          products.map((ps) => {
            const id = ps.product._id;
            const sections = openSections[id] || {};
            const data = ps.campaignResult
              ? [
                  { name: 'Sent', value: ps.campaignResult.successfully_send_mails },
                  { name: 'Failed', value: ps.campaignResult.target_mails - ps.campaignResult.successfully_send_mails },
                ]
              : [];

            return (
              <Card key={id} className="mb-8 shadow-lg">
                <CardHeader className="bg-blue-50 p-6">
                  <CardTitle className="text-2xl text-gray-800">
                    {ps.product.product_name}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">{ps.product.description}</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="space-y-1">
                      <p><strong>Price:</strong> ${ps.product.price.toFixed(2)}</p>
                      <p><strong>Quantity:</strong> {ps.product.quantity}</p>
                      <p><strong>Created At:</strong> {ps.product.created_at}</p>
                    </div>

                    {!ps.marketingDone ? (
                      <Button variant="gradient" size="lg" onClick={() => handleStartCampaign(id)} disabled={ps.loadingAction}>
                        {ps.loadingAction ? 'Starting…' : 'Start Campaign'}
                      </Button>
                    ) : null}
                  </div>

                  {ps.marketingDone && ps.campaignResult && (
                    <div className="mt-6 space-y-6">
                      <div className="flex flex-wrap gap-3">
                        {(['image', 'blog', 'suggestions', 'stats'] as const).map((sectionKey) => (
                          <Button
                            key={sectionKey}
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSection(id, sectionKey)}
                          >
                            {sections[sectionKey]
                              ? `Hide ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`
                              : `View ${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`}
                          </Button>
                        ))}
                      </div>

                      {/* IMAGE */}
                      {sections.image && ps.posterUrl && (
                        <img
                          src={ps.posterUrl}
                          alt="Campaign Poster"
                          className="w-full rounded-lg shadow-md my-4"
                        />
                      )}

                      {/* SUGGESTIONS */}
                      {sections.suggestions && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h3 className="text-lg font-semibold mb-2">Marketing Suggestions</h3>
                          <ul className="list-disc list-inside text-gray-700">
                            {Object.entries(ps.campaignResult.marketing_strategy).map(
                              ([key, val]) => (
                                <li key={key}>
                                  <strong>{key.replace('_', ' ')}:</strong> {val}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {/* BLOG POST */}
                      {sections.blog && (
                        <div className="prose max-w-none bg-white p-6 rounded-lg shadow-sm">
                          <ReactMarkdown>{ps.campaignResult.blog_post}</ReactMarkdown>
                        </div>
                      )}

                      {/* STATS */}
                      {sections.stats && (
                        <div className="w-full h-64 bg-white p-4 rounded-lg shadow-sm">
                          <ResponsiveContainer>
                            <BarChart data={data}>
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Marketing;