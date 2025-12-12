import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const blogPosts = [
  {
    slug: "capsule-wardrobe",
    title: "How to Build a Capsule Wardrobe That Works",
    description: "Discover the essential pieces every wardrobe needs and how to make them work together seamlessly.",
    date: "Coming Soon",
    borderColor: "border-sage/20",
  },
  {
    slug: "psychology-of-style",
    title: "The Psychology of Personal Style",
    description: "Why what you wear matters more than you think, and how to align your wardrobe with your identity.",
    date: "Coming Soon",
    borderColor: "border-bronze/20",
  },
  {
    slug: "seasonal-transitions",
    title: "Seasonal Style Transitions Made Easy",
    description: "Master the art of transitioning your wardrobe between seasons without buying a whole new closet.",
    date: "Coming Soon",
    borderColor: "border-clay/20",
  },
];

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

          {/* Blog posts */}
          <div className="space-y-6">
            {blogPosts.map((post) => (
              <Card key={post.slug} className={`p-6 hover-scale ${post.borderColor}`}>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">{post.date}</div>
                  <h3 className="text-2xl font-semibold">{post.title}</h3>
                  <p className="text-muted-foreground">{post.description}</p>
                  <Link to={`/blog/${post.slug}`}>
                    <Button variant="outline">Read More</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
