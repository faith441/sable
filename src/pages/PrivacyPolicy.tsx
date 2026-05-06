import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MobileNav from "@/components/MobileNav";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileSheet from "@/components/ProfileSheet";
import { useState } from "react";

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
          <ProfileMenu
            onProfileClick={() => setProfileOpen(true)}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-light text-2xl">Sable Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6 text-sm font-light leading-relaxed">
                <section>
                  <h3 className="font-medium text-lg mb-2">1. Information We Collect</h3>
                  <p className="text-muted-foreground mb-2">
                    We collect information you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Account information (email, name, profile details)</li>
                    <li>Style preferences and wardrobe items</li>
                    <li>Body measurements and fit preferences</li>
                    <li>Photos you upload to your digital closet</li>
                    <li>Communication preferences and settings</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">2. How We Use Your Information</h3>
                  <p className="text-muted-foreground mb-2">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Provide personalized style recommendations</li>
                    <li>Curate your digital wardrobe</li>
                    <li>Generate AI-powered outfit suggestions</li>
                    <li>Send you updates about products and features</li>
                    <li>Improve our services and user experience</li>
                    <li>Process affiliate commissions for product recommendations</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">3. Information Sharing</h3>
                  <p className="text-muted-foreground">
                    We do not sell your personal information. We may share your information with:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                    <li>Service providers who help us operate our platform</li>
                    <li>Affiliate partners when you click on product links (limited to transaction data)</li>
                    <li>Law enforcement when required by law</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">4. Affiliate Links and Commissions</h3>
                  <p className="text-muted-foreground">
                    Sable participates in affiliate programs including Amazon Associates, Shopify Collabs, and other fashion retailers. When you purchase products through our affiliate links, we may earn a commission at no additional cost to you. We only recommend products we believe will benefit our users.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">5. Data Security</h3>
                  <p className="text-muted-foreground">
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted in transit and at rest.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">6. AI and Machine Learning</h3>
                  <p className="text-muted-foreground">
                    We use AI technology to analyze your style preferences and provide recommendations. Your data is used to train our models to improve recommendation accuracy. You can opt out of AI features at any time in your settings.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">7. Cookies and Tracking</h3>
                  <p className="text-muted-foreground">
                    We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and track affiliate referrals. You can control cookie preferences through your browser settings.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">8. Your Rights</h3>
                  <p className="text-muted-foreground mb-2">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your account and data</li>
                    <li>Export your wardrobe data</li>
                    <li>Opt out of marketing communications</li>
                    <li>Disable AI features</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">9. Data Retention</h3>
                  <p className="text-muted-foreground">
                    We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we will delete your personal information within 30 days, except where required by law to retain it.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">10. Children's Privacy</h3>
                  <p className="text-muted-foreground">
                    Sable is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">11. International Data Transfers</h3>
                  <p className="text-muted-foreground">
                    Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">12. Changes to This Policy</h3>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through the app. Your continued use of Sable after changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                <section>
                  <h3 className="font-medium text-lg mb-2">13. Contact Us</h3>
                  <p className="text-muted-foreground">
                    If you have questions about this Privacy Policy or our data practices, please contact us through our support channels or email us at privacy@sable.app.
                  </p>
                </section>

                <p className="text-muted-foreground mt-8 text-xs">
                  Last updated: May 2026
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

export default PrivacyPolicy;
