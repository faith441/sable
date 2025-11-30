import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/marketing")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="text-2xl font-bold gradient-text">Sable Blog</div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Blog Posts Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Latest Articles</h2>
          </div>

          {/* Blog posts will be added here */}
          <div className="space-y-6">
            <Card className="p-6 hover-scale border-sage/20">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Coming Soon</div>
                <h3 className="text-2xl font-semibold">
                  How to Build a Capsule Wardrobe That Works
                </h3>
                <p className="text-muted-foreground">
                  Discover the essential pieces every wardrobe needs and how to make them work together seamlessly.
                </p>
                <Button variant="outline">Read More</Button>
              </div>
            </Card>

            <Card className="p-6 hover-scale border-bronze/20">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Coming Soon</div>
                <h3 className="text-2xl font-semibold">
                  The Psychology of Personal Style
                </h3>
                <p className="text-muted-foreground">
                  Why what you wear matters more than you think, and how to align your wardrobe with your identity.
                </p>
                <Button variant="outline">Read More</Button>
              </div>
            </Card>

            <Card className="p-6 hover-scale border-clay/20">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Coming Soon</div>
                <h3 className="text-2xl font-semibold">
                  Seasonal Style Transitions Made Easy
                </h3>
                <p className="text-muted-foreground">
                  Master the art of transitioning your wardrobe between seasons without buying a whole new closet.
                </p>
                <Button variant="outline">Read More</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
