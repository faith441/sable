import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const Blog = () => {
  const navigate = useNavigate();

  // Placeholder for UGC creator videos - admin will upload these
  const ugcVideos = [
    { id: 1, src: "/videos/ugc-1.mp4", thumbnail: "/images/ugc-1.jpg" },
    { id: 2, src: "/videos/ugc-2.mp4", thumbnail: "/images/ugc-2.jpg" },
    { id: 3, src: "/videos/ugc-3.mp4", thumbnail: "/images/ugc-3.jpg" },
    { id: 4, src: "/videos/ugc-4.mp4", thumbnail: "/images/ugc-4.jpg" },
    { id: 5, src: "/videos/ugc-5.mp4", thumbnail: "/images/ugc-5.jpg" },
  ];

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

      {/* UGC Video Feed */}
      <section className="py-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Style Stories</h2>
            <p className="text-xl text-muted-foreground">
              Real people, real style transformations
            </p>
          </div>

          {/* Horizontal Scrolling Video Feed */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
              {ugcVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </div>
      </section>

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

// Video Card Component with auto-play
const VideoCard = ({ video }: { video: { id: number; src: string; thumbnail: string } }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(() => {
            // Auto-play was prevented, which is fine
          });
        } else if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div className="flex-shrink-0 snap-center">
      <Card className="overflow-hidden border-border/50 hover-scale w-[280px] h-[500px] bg-card/50">
        <div className="relative w-full h-full">
          {/* Placeholder for video - shows message until videos are uploaded */}
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-center p-4">
            <div>
              <p className="text-sm font-medium">Upload videos to</p>
              <p className="text-sm">/public/videos/ugc-{video.id}.mp4</p>
            </div>
          </div>
          
          {/* Video element (will display when videos are uploaded) */}
          <video
            ref={videoRef}
            src={video.src}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            poster={video.thumbnail}
          />
        </div>
      </Card>
    </div>
  );
};

export default Blog;
