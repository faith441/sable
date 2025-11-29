import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VirtualTryOn = () => {
  const navigate = useNavigate();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGarmentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGarmentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!userImage || !garmentImage) {
      toast.error("Please upload both images");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: { userImage, garmentImage }
      });

      if (error) throw error;
      
      setResult(data.result);
      toast.success("Try-on complete!");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to process try-on");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-light">Virtual Try-On</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <Sparkles className="w-12 h-12 mx-auto text-primary" strokeWidth={1.5} />
            <div className="space-y-2">
              <h2 className="text-2xl font-light">See How It Looks</h2>
              <p className="text-sm text-muted-foreground font-light">
                Upload a photo of yourself and the garment you want to try on
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Photo Upload */}
        <Card>
          <CardContent className="p-6">
            <label className="block">
              <div className="text-sm font-light mb-3">Your Photo</div>
              {userImage ? (
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <img src={userImage} alt="Your photo" className="w-full h-full object-cover" />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2"
                    onClick={() => setUserImage(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground font-light">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUserImageUpload}
                  />
                </label>
              )}
            </label>
          </CardContent>
        </Card>

        {/* Garment Photo Upload */}
        <Card>
          <CardContent className="p-6">
            <label className="block">
              <div className="text-sm font-light mb-3">Garment Photo</div>
              {garmentImage ? (
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <img src={garmentImage} alt="Garment" className="w-full h-full object-cover" />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2"
                    onClick={() => setGarmentImage(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground font-light">Upload Garment</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGarmentImageUpload}
                  />
                </label>
              )}
            </label>
          </CardContent>
        </Card>

        {/* Try On Button */}
        {userImage && garmentImage && !result && (
          <Button 
            variant="luxury" 
            size="lg" 
            className="w-full"
            onClick={handleTryOn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Try It On"
            )}
          </Button>
        )}

        {/* Result */}
        {result && (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm font-light mb-3">Result</div>
              <div className="aspect-[3/4] rounded-lg overflow-hidden">
                <img src={result} alt="Try-on result" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setUserImage(null);
                    setGarmentImage(null);
                    setResult(null);
                  }}
                >
                  Try Another
                </Button>
                <Button variant="luxury" size="sm" className="flex-1">
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VirtualTryOn;