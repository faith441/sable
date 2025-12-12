import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { blogPosts } from "./Blog";

const blogContent: Record<string, string> = {
  "capsule-wardrobe": `
    <p class="lead">Discover the essential pieces every wardrobe needs and how to make them work together seamlessly.</p>
    
    <p>A capsule wardrobe is a carefully curated collection of timeless, versatile pieces that can be mixed and matched to create countless outfits. The concept was popularized by Susie Faux in the 1970s and later refined by designer Donna Karan.</p>
    
    <h2>The Foundation Pieces</h2>
    <p>Every capsule wardrobe starts with quality basics: a well-fitted blazer, classic white shirts, perfectly tailored trousers, and versatile denim. These pieces form the backbone of your wardrobe and should be invested in carefully.</p>
    
    <h2>Quality Over Quantity</h2>
    <p>The philosophy behind a capsule wardrobe is simple: invest in fewer, better-quality pieces that you'll wear repeatedly. This approach is not only more sustainable but also more economical in the long run. When you buy quality, you buy once.</p>
    
    <h2>Building Your Collection</h2>
    <p>Start by assessing your lifestyle and identifying the key activities in your week. Then, select pieces that can transition seamlessly between these different contexts. A great blazer can go from boardroom to dinner with minimal effort.</p>
    
    <h2>The 30-Piece Rule</h2>
    <p>Many capsule wardrobe enthusiasts aim for approximately 30-40 pieces total, including shoes and outerwear. This constraint forces intentionality and ensures every piece earns its place in your closet.</p>
  `,
  "psychology-of-style": `
    <p class="lead">Why what you wear matters more than you think, and how to align your wardrobe with your identity.</p>
    
    <p>Fashion psychology, also known as "enclothed cognition," explores the powerful connection between what we wear and how we think, feel, and behave. Research consistently shows that our clothing choices significantly impact our cognitive processes and emotional states.</p>
    
    <h2>The Power of Clothing</h2>
    <p>Studies have demonstrated that wearing formal attire can enhance abstract thinking and give people a broader perspective. When you dress intentionally, you're not just changing your appearance—you're potentially changing your mindset.</p>
    
    <h2>Dressing for Success</h2>
    <p>When you dress in a way that aligns with your goals and values, you're more likely to embody the qualities associated with that style. This is why "dressing for the job you want" is more than just a cliché—it's psychologically sound advice.</p>
    
    <h2>Finding Your Authentic Style</h2>
    <p>True personal style is about expressing your authentic self through your clothing choices. It's not about following trends blindly, but about understanding what makes you feel confident, comfortable, and most like yourself.</p>
    
    <h2>The Confidence Connection</h2>
    <p>When your outer presentation aligns with your inner identity, a remarkable thing happens: you feel more confident, more capable, and more ready to take on challenges. This alignment is the ultimate goal of personal styling.</p>
  `,
  "seasonal-transitions": `
    <p class="lead">Master the art of transitioning your wardrobe between seasons without buying a whole new closet.</p>
    
    <p>One of the biggest challenges in maintaining a functional wardrobe is navigating the changing seasons. But with the right strategies, you can create smooth transitions without breaking the bank or cluttering your closet.</p>
    
    <h2>Layering Essentials</h2>
    <p>The key to seasonal transitions is mastering the art of layering. A lightweight cardigan, a versatile jacket, and quality knits can extend the life of your summer pieces well into fall. Think of layers as the bridge between seasons.</p>
    
    <h2>Transitional Pieces</h2>
    <p>Invest in pieces that work across multiple seasons: midi skirts, long-sleeved dresses, ankle boots, and lightweight trench coats are all excellent transitional items that earn their keep year-round.</p>
    
    <h2>Color Palettes</h2>
    <p>Choose a cohesive color palette that works year-round. Earth tones, navy, and classic neutrals transition beautifully between seasons. This approach also makes mixing and matching significantly easier.</p>
    
    <h2>Storage Strategy</h2>
    <p>Rather than completely swapping wardrobes each season, consider a rotation system where transitional pieces remain accessible while extreme seasonal items are stored. This keeps your closet functional and prevents the overwhelming bi-annual wardrobe overhaul.</p>
  `,
  "color-analysis": `
    <p class="lead">Learn how to identify the colors that complement your skin tone and elevate your entire wardrobe.</p>
    
    <p>Color analysis is a powerful tool that can transform how you shop and dress. Understanding which colors enhance your natural coloring can save you money, simplify shopping, and ensure you always look your best.</p>
    
    <h2>Understanding Color Seasons</h2>
    <p>Traditional color analysis divides people into four seasonal categories—Spring, Summer, Autumn, and Winter—based on their skin undertones, hair color, and eye color. Each season has a palette of colors that harmonize with those natural features.</p>
    
    <h2>Finding Your Undertone</h2>
    <p>The first step in color analysis is identifying whether you have warm, cool, or neutral undertones. Look at the veins on your wrist: blue or purple veins typically indicate cool undertones, while green veins suggest warm undertones.</p>
    
    <h2>Building a Color Palette</h2>
    <p>Once you know your season, you can build a wardrobe around colors that make you glow. This doesn't mean you can never wear other colors—it means you'll know which colors to prioritize for pieces worn near your face.</p>
    
    <h2>The Confidence of Color</h2>
    <p>When you wear your best colors, people notice you first—not your clothes. The right colors can make your skin look clearer, your eyes brighter, and your overall appearance more vibrant and healthy.</p>
  `,
  "sustainable-fashion": `
    <p class="lead">How conscious fashion choices are reshaping the luxury industry and why quality matters more than ever.</p>
    
    <p>The fashion industry is experiencing a fundamental shift. Consumers are increasingly aware of the environmental and social impact of their clothing choices, and luxury brands are responding with more sustainable practices.</p>
    
    <h2>The True Cost of Fast Fashion</h2>
    <p>Fast fashion's environmental impact is staggering—it's responsible for 10% of global carbon emissions and is the second-largest consumer of water. Moving toward quality over quantity isn't just a style choice; it's an environmental imperative.</p>
    
    <h2>Investing in Quality</h2>
    <p>When you invest in well-made pieces from responsible manufacturers, you're making a choice that benefits both your wardrobe and the planet. Quality items last longer, look better, and ultimately cost less per wear than disposable fashion.</p>
    
    <h2>The Circular Economy</h2>
    <p>Luxury resale, rental services, and repair culture are growing rapidly. These circular economy approaches extend the life of garments and reduce the demand for new production, creating a more sustainable fashion ecosystem.</p>
    
    <h2>Conscious Consumption</h2>
    <p>Sustainable fashion isn't about buying more "sustainable" products—it's about buying less, buying better, and making what you have last. The most sustainable garment is the one you already own.</p>
  `,
  "power-dressing": `
    <p class="lead">Modern executive style that commands respect while staying true to your authentic self.</p>
    
    <p>Power dressing has evolved significantly from the bold shoulder pads of the 1980s. Today's executive style is about projecting confidence and competence while expressing your individual personality and values.</p>
    
    <h2>The Modern Power Suit</h2>
    <p>Today's power suit comes in many forms—from classic tailored blazers to relaxed yet polished separates. The key is impeccable fit and quality fabrics that move with you and maintain their shape throughout demanding days.</p>
    
    <h2>Color and Authority</h2>
    <p>While navy and charcoal remain boardroom staples, modern power dressing embraces a broader palette. Deep burgundy, forest green, and rich camel can project authority while distinguishing you from the sea of black suits.</p>
    
    <h2>The Details Matter</h2>
    <p>In executive dressing, details communicate competence. Well-maintained shoes, quality leather accessories, and thoughtful jewelry choices all contribute to an image of someone who pays attention and takes things seriously.</p>
    
    <h2>Authenticity in Authority</h2>
    <p>The most powerful dressers are those who've found their signature style within professional parameters. When your outside matches your inside, you project an authenticity that no borrowed style can replicate.</p>
  `,
};

const BlogPost = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const post = blogPosts.find((p) => p.slug === slug);
  const content = slug ? blogContent[slug] : null;

  if (!post || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Article Not Found</h1>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  // Get related posts (same category, excluding current)
  const relatedPosts = blogPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2);

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
          <Link to="/" className="text-2xl font-bold gradient-text">Sable</Link>
          <div className="w-24" />
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Article Content */}
      <article className="relative -mt-32 z-10 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          {/* Article Header */}
          <div className="bg-background rounded-t-2xl p-6 md:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="capitalize">
                {post.category}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif leading-tight">
              {post.title}
            </h1>
          </div>

          {/* Article Body */}
          <div 
            className="bg-background px-6 md:px-10 pb-10 prose prose-lg max-w-none 
              prose-headings:font-serif prose-headings:text-foreground prose-headings:mt-8 prose-headings:mb-4
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-lead:text-xl prose-lead:text-foreground prose-lead:font-medium
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Share & Actions */}
          <div className="bg-background px-6 md:px-10 py-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Share:</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Twitter</Button>
                <Button variant="outline" size="sm">LinkedIn</Button>
              </div>
            </div>
            <Button onClick={() => navigate("/blog")} variant="ghost">
              ← More Articles
            </Button>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 mt-16">
            <h2 className="text-2xl font-bold font-serif mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.slug} to={`/blog/${related.slug}`}>
                  <div className="group flex gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {related.category}
                      </Badge>
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{related.readTime}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogPost;
