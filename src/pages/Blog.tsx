import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import capsuleWardrobeImg from "@/assets/blog/capsule-wardrobe.jpg";
import psychologyStyleImg from "@/assets/blog/psychology-style.jpg";
import seasonalTransitionsImg from "@/assets/blog/seasonal-transitions.jpg";
import colorAnalysisImg from "@/assets/blog/color-analysis.jpg";
import sustainableFashionImg from "@/assets/blog/sustainable-fashion.jpg";
import powerDressingImg from "@/assets/blog/power-dressing.jpg";

const categories = [
  { id: "all", label: "All" },
  { id: "wardrobe", label: "Wardrobe" },
  { id: "style", label: "Style" },
  { id: "trends", label: "Trends" },
  { id: "sustainability", label: "Sustainability" },
];

export const blogPosts = [
  {
    slug: "capsule-wardrobe",
    title: "How to Build a Capsule Wardrobe That Works",
    description: "Discover the essential pieces every wardrobe needs and how to make them work together seamlessly.",
    date: "December 10, 2024",
    category: "wardrobe",
    image: capsuleWardrobeImg,
    readTime: "5 min read",
  },
  {
    slug: "psychology-of-style",
    title: "The Psychology of Personal Style",
    description: "Why what you wear matters more than you think, and how to align your wardrobe with your identity.",
    date: "December 8, 2024",
    category: "style",
    image: psychologyStyleImg,
    readTime: "7 min read",
  },
  {
    slug: "seasonal-transitions",
    title: "Seasonal Style Transitions Made Easy",
    description: "Master the art of transitioning your wardrobe between seasons without buying a whole new closet.",
    date: "December 5, 2024",
    category: "trends",
    image: seasonalTransitionsImg,
    readTime: "4 min read",
  },
  {
    slug: "color-analysis",
    title: "Finding Your Perfect Color Palette",
    description: "Learn how to identify the colors that complement your skin tone and elevate your entire wardrobe.",
    date: "December 3, 2024",
    category: "style",
    image: colorAnalysisImg,
    readTime: "6 min read",
  },
  {
    slug: "sustainable-fashion",
    title: "The Rise of Sustainable Luxury Fashion",
    description: "How conscious fashion choices are reshaping the luxury industry and why quality matters more than ever.",
    date: "November 28, 2024",
    category: "sustainability",
    image: sustainableFashionImg,
    readTime: "8 min read",
  },
  {
    slug: "power-dressing",
    title: "The Art of Power Dressing in 2024",
    description: "Modern executive style that commands respect while staying true to your authentic self.",
    date: "November 25, 2024",
    category: "style",
    image: powerDressingImg,
    readTime: "5 min read",
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
          <div className="w-20" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-sand/30 to-background">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold font-serif">Style Insights</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expert advice on building a wardrobe that reflects your identity and elevates your confidence.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2"
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={`/blog/${blogPosts[0].slug}`}>
            <Card className="overflow-hidden hover-scale group cursor-pointer">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={blogPosts[0].image}
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                      {blogPosts[0].category}
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-serif">{blogPosts[0].title}</h2>
                  <p className="text-muted-foreground line-clamp-2">{blogPosts[0].description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{blogPosts[0].date}</span>
                    <span>•</span>
                    <span>{blogPosts[0].readTime}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold font-serif">Latest Articles</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts.slice(1).map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="overflow-hidden hover-scale group cursor-pointer h-full">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-semibold font-serif line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
                    <div className="text-xs text-muted-foreground">{post.date}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-4 bg-sand/20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold font-serif">Stay Inspired</h2>
          <p className="text-muted-foreground">
            Get weekly style tips and wardrobe insights delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="px-6">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
