import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Building2, Mail, Globe, Package, CheckCircle2 } from "lucide-react";

const PRODUCT_CATEGORIES = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Swimwear",
  "Activewear",
  "Fragrance",
  "Hair Care",
  "Jewelry",
  "Bags",
];

export default function BrandPartnerSignup() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    website_url: "",
    estimated_products: "",
    description: "",
    product_categories: [] as string[],
  });

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      product_categories: prev.product_categories.includes(category)
        ? prev.product_categories.filter((c) => c !== category)
        : [...prev.product_categories, category],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.contact_name || !formData.contact_email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("brand_applications").insert({
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        website_url: formData.website_url || null,
        estimated_products: formData.estimated_products ? parseInt(formData.estimated_products) : null,
        description: formData.description || null,
        product_categories: formData.product_categories,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl">Application Received</CardTitle>
            <CardDescription className="text-base">
              Thank you for your interest in partnering with Sable. Our team will review your application and contact you within 2-3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 font-serif text-xl">Brand Partner Program</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-8 px-4">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl mb-3">Join the Sable Partner Network</h2>
          <p className="text-muted-foreground">
            Connect your brand's inventory to our AI-powered styling platform and reach style-conscious customers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Partner Application</CardTitle>
            <CardDescription>
              Fill out the form below and our team will review your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Company Name *
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Your brand name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Contact Email *
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="email@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website_url">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website
                    </Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://yourbrand.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_products">
                    <Package className="w-4 h-4 inline mr-2" />
                    Estimated Number of Products
                  </Label>
                  <Input
                    id="estimated_products"
                    type="number"
                    value={formData.estimated_products}
                    onChange={(e) => setFormData({ ...formData, estimated_products: e.target.value })}
                    placeholder="e.g., 500"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Product Categories</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRODUCT_CATEGORIES.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.product_categories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <label
                          htmlFor={category}
                          className="text-sm cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Tell Us About Your Brand</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your brand, target audience, and why you'd like to partner with Sable..."
                    rows={4}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-serif text-lg mb-3">What Happens Next?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-medium text-foreground">1.</span>
              Our team reviews your application within 2-3 business days
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">2.</span>
              If approved, you'll receive API credentials via email
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">3.</span>
              Use our API to sync your product catalog
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-foreground">4.</span>
              Your products appear in AI-curated wardrobes
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
