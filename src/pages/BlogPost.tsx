import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const blogPosts = {
  "capsule-wardrobe": {
    title: "How to Build a Capsule Wardrobe That Works",
    date: "Coming Soon",
    content: `
      <p>Discover the essential pieces every wardrobe needs and how to make them work together seamlessly.</p>
      <p>A capsule wardrobe is a carefully curated collection of timeless, versatile pieces that can be mixed and matched to create countless outfits. The concept was popularized by Susie Faux in the 1970s and later refined by designer Donna Karan.</p>
      <h2>The Foundation Pieces</h2>
      <p>Every capsule wardrobe starts with quality basics: a well-fitted blazer, classic white shirts, perfectly tailored trousers, and versatile denim. These pieces form the backbone of your wardrobe.</p>
      <h2>Quality Over Quantity</h2>
      <p>The philosophy behind a capsule wardrobe is simple: invest in fewer, better-quality pieces that you'll wear repeatedly. This approach is not only more sustainable but also more economical in the long run.</p>
      <h2>Building Your Collection</h2>
      <p>Start by assessing your lifestyle and identifying the key activities in your week. Then, select pieces that can transition seamlessly between these different contexts.</p>
    `,
  },
  "psychology-of-style": {
    title: "The Psychology of Personal Style",
    date: "Coming Soon",
    content: `
      <p>Why what you wear matters more than you think, and how to align your wardrobe with your identity.</p>
      <p>Fashion psychology, also known as "enclothed cognition," explores the powerful connection between what we wear and how we think, feel, and behave.</p>
      <h2>The Power of Clothing</h2>
      <p>Research has shown that our clothing choices can significantly impact our cognitive processes, emotional states, and even our performance in various tasks.</p>
      <h2>Dressing for Success</h2>
      <p>When you dress in a way that aligns with your goals and values, you're more likely to embody the qualities associated with that style. This is why "dressing for the job you want" is more than just a cliché.</p>
      <h2>Finding Your Authentic Style</h2>
      <p>True personal style is about expressing your authentic self through your clothing choices. It's not about following trends, but about understanding what makes you feel confident and comfortable.</p>
    `,
  },
  "seasonal-transitions": {
    title: "Seasonal Style Transitions Made Easy",
    date: "Coming Soon",
    content: `
      <p>Master the art of transitioning your wardrobe between seasons without buying a whole new closet.</p>
      <p>One of the biggest challenges in maintaining a functional wardrobe is navigating the changing seasons. But with the right strategies, you can create smooth transitions without breaking the bank.</p>
      <h2>Layering Essentials</h2>
      <p>The key to seasonal transitions is mastering the art of layering. A lightweight cardigan, a versatile jacket, and quality knits can extend the life of your summer pieces well into fall.</p>
      <h2>Transitional Pieces</h2>
      <p>Invest in pieces that work across multiple seasons: midi skirts, long-sleeved dresses, and ankle boots are all excellent transitional items.</p>
      <h2>Color Palettes</h2>
      <p>Choose a cohesive color palette that works year-round. Earth tones, navy, and classic neutrals transition beautifully between seasons.</p>
    `,
  },
};

const BlogPost = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const post = slug ? blogPosts[slug as keyof typeof blogPosts] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Article Not Found</h1>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/blog")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
          <div className="text-2xl font-bold gradient-text">Sable</div>
          <div className="w-24" />
        </div>
      </header>

      {/* Article Content */}
      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">{post.date}</div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif">{post.title}</h1>
          </div>

          <div 
            className="prose prose-lg max-w-none text-foreground prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="pt-8 border-t border-border">
            <Button onClick={() => navigate("/blog")} variant="outline">
              ← Back to All Articles
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
