import { useEffect, useRef, useState } from "react";

interface VideoGuideProps {
  gender: string[];
}

const VideoGuide = ({ gender }: VideoGuideProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentCaption, setCurrentCaption] = useState("");
  const [captionIndex, setCaptionIndex] = useState(0);

  const isWomen = gender.includes("Women's");

  // Captions with timestamps (in seconds)
  const captions = [
    { time: 0, text: "Hello! I'm here to help curate your perfect capsule wardrobe..." },
    { time: 3, text: "Analyzing your style preferences and lifestyle needs..." },
    { time: 6, text: "Selecting pieces that work together seamlessly..." },
    { time: 9, text: "Creating versatile outfits that match your aesthetic..." },
    { time: 12, text: "Finding the perfect colors and fits for you..." },
    { time: 15, text: "Almost there! Finalizing your personalized collections..." },
    { time: 18, text: "Your capsule wardrobes are ready!" },
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play video
    video.play().catch(err => console.log("Video autoplay prevented:", err));

    // Update captions based on video time
    const updateCaption = () => {
      const currentTime = video.currentTime;
      
      for (let i = captions.length - 1; i >= 0; i--) {
        if (currentTime >= captions[i].time) {
          if (captionIndex !== i) {
            setCaptionIndex(i);
            setCurrentCaption(captions[i].text);
          }
          break;
        }
      }
    };

    video.addEventListener('timeupdate', updateCaption);
    
    // Loop video if generation takes longer
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      video.play();
      setCaptionIndex(0);
    });

    return () => {
      video.removeEventListener('timeupdate', updateCaption);
    };
  }, [captionIndex]);

  // Placeholder video URLs - replace with actual AI guide videos
  const videoUrl = isWomen 
    ? "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" // Replace with female AI guide video
    : "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"; // Replace with male AI guide video

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-[9/16] object-cover"
            muted
            playsInline
            src={videoUrl}
          />
          
          {/* Video Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Caption Area */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="min-h-[4rem] flex items-center justify-center">
            <p className="text-lg md:text-xl font-light text-foreground px-6 animate-fade-in">
              {currentCaption}
            </p>
          </div>
          
          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2">
            {captions.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index <= captionIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGuide;