import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone must be less than 20 characters"),
  orderNumber: z.string().trim().max(50, "Order number must be less than 50 characters").optional(),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: validatedData,
      });

      if (error) throw error;

      toast.success("Message sent successfully! We'll get back to you soon.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        orderNumber: "",
        message: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please check the form for errors");
      } else {
        toast.error(error.message || "Failed to send message. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/wardrobe")}
            className="hover:bg-sage/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-light">Contact Support</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <Card className="border-sage/20 shadow-soft">
          <CardHeader className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage/20 to-cream/30 flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-sage" />
            </div>
            <CardTitle className="text-2xl font-light">Get in Touch</CardTitle>
            <CardDescription className="text-base">
              Need help? Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Your full name"
                  className={errors.name ? "border-destructive" : ""}
                  disabled={loading}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors.email ? "border-destructive" : ""}
                  disabled={loading}
                  maxLength={255}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? "border-destructive" : ""}
                  disabled={loading}
                  maxLength={20}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Order Number (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="orderNumber" className="text-sm font-medium">
                  Order Number <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="orderNumber"
                  value={formData.orderNumber}
                  onChange={(e) => handleChange("orderNumber", e.target.value)}
                  placeholder="ORD-12345"
                  className={errors.orderNumber ? "border-destructive" : ""}
                  disabled={loading}
                  maxLength={50}
                />
                {errors.orderNumber && (
                  <p className="text-xs text-destructive">{errors.orderNumber}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Please describe your issue or question in detail..."
                  className={`min-h-[150px] ${errors.message ? "border-destructive" : ""}`}
                  disabled={loading}
                  maxLength={2000}
                />
                <div className="flex justify-between items-center">
                  {errors.message ? (
                    <p className="text-xs text-destructive">{errors.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {formData.message.length}/2000 characters
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="luxury"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 rounded-lg bg-cream/30 border border-sage/20">
          <p className="text-sm text-muted-foreground text-center">
            We typically respond within 24 hours during business days
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
