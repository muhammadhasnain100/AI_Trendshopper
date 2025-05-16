import React, { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToken } from "@/context/TokenContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TrendItem {
  dress_type?: string;
  occasion?: string;
  gender?: string;
  description: string;
}

// Dress options structured by gender and occasion
const dressOptions: Record<string, Record<string, string[]>> = {
  male: {
    "Eid ul Fitr": ["Shalwar Kameez", "Kurta Shalwar"],
    "Eid ul Adha": ["Shalwar Kameez", "Kurta Shalwar"],
    Wedding: ["Sherwani", "Shalwar Kameez", "Kurta Shalwar"],
    Mehndi: ["Shalwar Kameez", "Kurta Shalwar"],
    Valima: ["Sherwani", "Waistcoat with Shalwar Kameez", "Kurta Shalwar"],
  },
  female: {
    "Eid ul Fitr": ["Shalwar Kameez", "Sharara", "Sharara"],
    "Eid ul Adha": ["Shalwar Kameez", "Gharara", "Sharara"],
    Wedding: ["Lehenga Choli", "Saree"],
    Mehndi: ["Lehenga", "Gharara"],
    Valima: ["Sharara Suit", "Shalwar Kameez"],
  },
};

const occasions = Object.keys(dressOptions.male);
const locations = ["Pakistan", "India", "Bangladesh"];

const FashionImageGenerator: React.FC = () => {
  const { token } = useToken();
  const { toast } = useToast();

  const [gender, setGender] = useState<string>("");
  const [occasion, setOccasion] = useState<string>("");
  const [dressType, setDressType] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const [trends, setTrends] = useState<string[] | TrendItem[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

  const [loadingTrends, setLoadingTrends] = useState<boolean>(false);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Returns dress types based on selected gender and occasion
  const availableDresses = (): string[] => {
    if (!gender || !occasion) return [];
    return dressOptions[gender]?.[occasion] || [];
  };

  const handleFetchTrends = async () => {
    if (!(gender && occasion && dressType && region)) {
      toast({ title: "Error", description: "Please complete all fields before getting trends.", variant: "destructive" });
      return;
    }

    setLoadingTrends(true);
    setError("");
    setTrends([]);
    setSelectedTrend("");
    setImageUrl("");

    try {
      const res = await fetch("http://127.0.0.1:8000/trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gender, dress_type: dressType, occasion, region }),
      });
      const json = await res.json();

      if (json.status && json.data?.trends) {
        setTrends(json.data.trends);
      } else {
        throw new Error(json.message || "Failed to fetch trends");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch trends";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedTrend) {
      toast({ title: "Error", description: "Please select a fashion trend.", variant: "destructive" });
      return;
    }

    setLoadingImage(true);
    setError("");
    setImageUrl("");

    try {
      const res = await fetch("http://127.0.0.1:8000/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dress_type: dressType,trend_description: selectedTrend, gender, occasion}),
      });
      if (!res.ok) throw new Error("Image generation failed");
      const blob = await res.blob();
      setImageUrl(URL.createObjectURL(blob));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoadingImage(false);
    }
  };

  const getTrendText = (trend: string | TrendItem): string => {
    return typeof trend === "string" ? trend : trend.description;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50">
      <Header />
      <main className="flex-grow pt-24 max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold mb-2">AI Fashion Image Generator</h1>
          <p className="text-gray-600 text-lg">Fill in your preferences, fetch the latest trends, and generate your unique fashion image!</p>
        </section>

        <section className="bg-white rounded-lg p-8 shadow mb-10">
          <h2 className="text-2xl font-heading font-semibold mb-6">1. Select Your Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => { setGender(e.target.value); setDressType(""); }}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Occasion */}
            <div>
              <label className="block text-sm font-medium mb-1">Occasion</label>
              <select
                value={occasion}
                onChange={(e) => { setOccasion(e.target.value); setDressType(""); }}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Occasion</option>
                {occasions.map((occ) => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>

            {/* Dress Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Dress Type</label>
              <select
                value={dressType}
                onChange={(e) => setDressType(e.target.value)}
                disabled={!gender || !occasion}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              >
                <option value="">Select Dress Type</option>
                {availableDresses().map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button onClick={handleFetchTrends} disabled={loadingTrends} size="lg" className="min-w-[200px]">
              {loadingTrends ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading Trends...</> : "Get Trends"}
            </Button>
          </div>
        </section>

        {/* Trends List */}
        {trends.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold mb-6">2. Recommended Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{
              trends.map((trend, idx) => {
                const text = getTrendText(trend);
                return (
                  <div
                    key={idx}
                    onClick={() => { setSelectedTrend(text); setError(""); }}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${selectedTrend === text ? "border-2 border-primary bg-primary/5 shadow-md" : "border border-gray-200 hover:bg-gray-50"}`}
                  >
                    <p className="text-gray-800 text-sm">{text}</p>
                  </div>
                );
              })
            }</div>
          </section>
        )}

        {/* Generate Image */}
        {trends.length > 0 && (
          <section className="mb-10 text-center">
            <Button onClick={handleGenerateImage} disabled={loadingImage} size="lg" className="min-w-[200px]">
              {loadingImage ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating Image...</> : "Generate Image"}
            </Button>
          </section>
        )}

        {/* Displayed Image */}
        {imageUrl && (
          <section className="mb-12 text-center">
            <h2 className="text-2xl font-heading font-semibold mb-4">Your Fashion Image</h2>
            <img src={imageUrl} alt="Generated Fashion" className="w-full max-w-lg mx-auto rounded-lg shadow-lg object-contain" />
            <div className="mt-6"><a href={imageUrl} download="fashion.png"><Button>Download Image</Button></a></div>
          </section>
        )}
      </main>
    </div>
  );
};

export default FashionImageGenerator;
