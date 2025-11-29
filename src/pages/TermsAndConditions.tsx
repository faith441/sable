import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MobileNav from "@/components/MobileNav";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileSheet from "@/components/ProfileSheet";
import { useState } from "react";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/wardrobe")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-light">
            Terms & Conditions
          </h1>
          <ProfileMenu 
            onProfileClick={() => setProfileOpen(true)}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-light text-2xl">Sable Terms of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6 text-sm font-light leading-relaxed">
                <section>
                  <h3 className="font-medium text-lg mb-2">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By accessing and using Sable, you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">2. Use of Service</h3>
                  <p className="text-muted-foreground">
                    Sable provides AI-powered personal styling and wardrobe curation services. You agree to use the service only for lawful purposes and in accordance with these Terms.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">3. User Account</h3>
                  <p className="text-muted-foreground">
                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">4. Privacy and Data Collection</h3>
                  <p className="text-muted-foreground">
                    We collect and process personal information including style preferences, body measurements, and photos you provide. This information is used solely to provide personalized styling recommendations. We do not share your personal information with third parties without your consent.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">5. Product Information</h3>
                  <p className="text-muted-foreground">
                    We strive to provide accurate product descriptions and pricing. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">6. Orders and Payments</h3>
                  <p className="text-muted-foreground">
                    All orders are subject to availability and confirmation of the order price. We reserve the right to refuse any order. Prices are subject to change without notice.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">7. Returns and Refunds</h3>
                  <p className="text-muted-foreground">
                    Return policies vary by brand and product. Please refer to individual brand policies for specific return and refund information.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">8. AI Recommendations</h3>
                  <p className="text-muted-foreground">
                    Sable uses AI technology to provide style recommendations. While we strive for accuracy, recommendations are suggestions only and may not suit every individual.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">9. Intellectual Property</h3>
                  <p className="text-muted-foreground">
                    All content on Sable, including text, graphics, logos, and software, is the property of Sable and protected by copyright and other intellectual property laws.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">10. Limitation of Liability</h3>
                  <p className="text-muted-foreground">
                    Sable shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">11. Changes to Terms</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these terms at any time. Your continued use of the service following any changes indicates your acceptance of the new terms.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">12. Contact Information</h3>
                  <p className="text-muted-foreground">
                    For questions about these Terms, please contact us through our support channels.
                  </p>
                </section>

                <p className="text-muted-foreground mt-8 text-xs">
                  Last updated: November 2025
                </p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <MobileNav />
    </div>
  );
};

export default TermsAndConditions;
