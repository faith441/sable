import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileSheet = ({ open, onOpenChange }: ProfileSheetProps) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (open) {
      const preferences = localStorage.getItem('guest_preferences');
      if (preferences) {
        setFormData(JSON.parse(preferences));
      }
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('guest_preferences', JSON.stringify(formData));
    toast.success("Profile updated successfully");
    onOpenChange(false);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-light text-2xl">Your Profile</SheetTitle>
          <SheetDescription className="font-light">
            View and update your style preferences
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)] mt-6">
          <div className="space-y-4 pr-4">
            <Accordion type="multiple" defaultValue={["style", "lifestyle", "body", "photos"]} className="w-full">
              {/* Style Preferences Section */}
              <AccordionItem value="style">
                <AccordionTrigger className="text-lg font-light">Style Preferences</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Gender */}
                    <div className="space-y-2">
                      <Label className="font-light">Gender Preference</Label>
                      <div className="text-sm text-muted-foreground">
                        {formData.gender?.join(", ") || "Not specified"}
                      </div>
                    </div>

                    {/* Style Types */}
                    <div className="space-y-2">
                      <Label className="font-light">Style Types</Label>
                      <div className="text-sm text-muted-foreground">
                        {formData.styleTypes?.join(", ") || "Not specified"}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-2">
                      <Label className="font-light">Preferred Colors</Label>
                      <div className="text-sm text-muted-foreground">
                        {formData.colors?.join(", ") || "Not specified"}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                      <Label className="font-light">Budget Range</Label>
                      <div className="text-sm text-muted-foreground">
                        {formData.budget || "Not specified"}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Lifestyle & Occasions Section */}
              <AccordionItem value="lifestyle">
                <AccordionTrigger className="text-lg font-light">Lifestyle & Occasions</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Lifestyle */}
                    <div className="space-y-2">
                      <Label className="font-light">Lifestyle</Label>
                      <div className="text-sm text-muted-foreground">
                        {formData.lifestyle?.join(", ") || "Not specified"}
                      </div>
                    </div>

                    {/* Occasions */}
                    <div className="space-y-2">
                      <Label className="font-light">Occasions</Label>
                      <div className="text-sm text-muted-foreground">
                        {formData.occasions?.join(", ") || "Not specified"}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Body & Measurements Section */}
              <AccordionItem value="body">
                <AccordionTrigger className="text-lg font-light">Body & Measurements</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Body Type */}
                    <div className="space-y-2">
                      <Label className="font-light">Body Type</Label>
                      <div className="text-sm text-muted-foreground">
                        {formData.bodyType || "Not specified"}
                      </div>
                    </div>

                    {/* Measurements */}
                    {formData.measurements && (
                      <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
                        <Label className="font-light">Measurements</Label>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {formData.measurements.torsoLength && (
                            <div>
                              <span className="text-muted-foreground">Torso: </span>
                              {formData.measurements.torsoLength}
                            </div>
                          )}
                          {formData.measurements.legLength && (
                            <div>
                              <span className="text-muted-foreground">Leg: </span>
                              {formData.measurements.legLength}
                            </div>
                          )}
                          {formData.measurements.hairColor && (
                            <div>
                              <span className="text-muted-foreground">Hair: </span>
                              {formData.measurements.hairColor}
                            </div>
                          )}
                          {formData.measurements.eyeColor && (
                            <div>
                              <span className="text-muted-foreground">Eyes: </span>
                              {formData.measurements.eyeColor}
                            </div>
                          )}
                          {formData.measurements.skinTone && (
                            <div>
                              <span className="text-muted-foreground">Skin: </span>
                              {formData.measurements.skinTone}
                            </div>
                          )}
                          {formData.measurements.weight && (
                            <div>
                              <span className="text-muted-foreground">Weight: </span>
                              {formData.measurements.weight}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Photos Section */}
              <AccordionItem value="photos">
                <AccordionTrigger className="text-lg font-light">Photos</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <div className="text-sm text-muted-foreground">
                      {formData.facialPhotos?.length > 0 && (
                        <div className="py-1">Facial photos: {formData.facialPhotos.length}</div>
                      )}
                      {formData.bodyPhotos?.length > 0 && (
                        <div className="py-1">Body photos: {formData.bodyPhotos.length}</div>
                      )}
                      {formData.swimsuitPhotos?.length > 0 && (
                        <div className="py-1">Swimsuit photos: {formData.swimsuitPhotos.length}</div>
                      )}
                      {!formData.facialPhotos?.length && !formData.bodyPhotos?.length && !formData.swimsuitPhotos?.length && (
                        <div className="py-1">No photos uploaded</div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
          <Button 
            variant="luxury" 
            className="w-full"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;
