import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToken } from "@/context/TokenContext";
import Header from "@/components/Header";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserDetails {
  name: string;
  email: string;
  username: string;
  phone_number: string;
  address: string;
  profile_image?: string;
  joining_date: string;
}

const Profile = () => {
  const { token } = useToken();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserDetails>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    const fetchUserDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/get_user_details/${token}`);
        const data = await res.json();
        if (data.status) {
          setUserDetails(data.data);
          setFormData(data.data);
        } else {
          setError(data.message);
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [token, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/edit_profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          username: formData.username,
          name: formData.name,
          phone_number: formData.phone_number,
          address: formData.address,
        }),
      });
      const data = await res.json();
      if (data.status) {
        setUserDetails({
          ...userDetails,
          ...formData
        } as UserDetails);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        setError(data.message);
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-28 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50">
      <Header />

      <div className="mt-14">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 px-6 py-12">
          {/* Left Profile Card */}
          <div className="w-full lg:w-1/2 bg-white shadow rounded-lg p-6">
            <div className="flex flex-col items-center text-center">
              <img
                src={
                  userDetails?.profile_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    userDetails?.name || ''
                  )}&background=ddd&color=555`
                }
                alt="Profile"
                className="w-24 h-24 rounded-full mb-4 object-cover"
              />
              <h2 className="text-2xl font-semibold">
                {userDetails?.name}
              </h2>
              <p className="text-gray-500 mb-4">{userDetails?.email}</p>

              <div className="w-full text-left space-y-1 text-gray-700">
                <p>
                  <span className="font-medium">Joined:</span>{" "}
                  {userDetails?.joining_date}
                </p>
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {userDetails?.address}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {userDetails?.phone_number}
                </p>
              </div>
            </div>
          </div>

          {/* Right Edit Form */}
          <div className="w-full lg:w-1/2 bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-1">Edit Profile</h2>
            <p className="text-gray-500 mb-6">Update your personal information</p>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md p-2 focus:ring-2 focus:ring-[#2c5364] focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md p-2 focus:ring-2 focus:ring-[#2c5364] focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md p-2 focus:ring-2 focus:ring-[#2c5364] focus:border-transparent"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                variant="gradient"
                className="flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};

export default Profile;
