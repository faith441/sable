import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Pencil, Trash2, Heart } from "lucide-react";

interface ClosetItemDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onToggleFavorite?: (item: any) => void;
}

const ClosetItemDialog = ({ item, open, onOpenChange, onEdit, onDelete, onToggleFavorite }: ClosetItemDialogProps) => {
  if (!item) return null;

  const handleEdit = () => {
    onEdit?.(item);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete?.(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Image */}
          <div className="aspect-[3/4] bg-secondary rounded-lg overflow-hidden">
            {item.is_custom ? (
              <img 
                src={item.custom_image_url} 
                alt={item.custom_description || 'Custom item'} 
                className="w-full h-full object-cover" 
              />
            ) : (
              item.product?.image_url && (
                <img 
                  src={item.product.image_url} 
                  alt={item.product.name} 
                  className="w-full h-full object-cover" 
                />
              )
            )}
          </div>

          {/* Custom Item Details */}
          {item.is_custom ? (
            <div className="space-y-3">
              <div>
                <Badge variant="secondary" className="mb-2">Custom Item</Badge>
                <h2 className="text-2xl font-light mb-1">{item.custom_category}</h2>
                {item.custom_brand && (
                  <p className="text-sm text-muted-foreground">{item.custom_brand}</p>
                )}
              </div>

              {item.custom_size && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Size</p>
                  <p className="text-base">{item.custom_size}</p>
                </div>
              )}

              {item.custom_description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{item.custom_description}</p>
                </div>
              )}

              {item.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{item.notes}</p>
                </div>
              )}
            </div>
          ) : (
            /* Purchased Item Details */
            <div className="space-y-3">
              <div>
                <Badge variant="secondary" className="mb-2">Purchased</Badge>
                <h2 className="text-2xl font-light mb-1">{item.product?.name}</h2>
                <p className="text-sm text-muted-foreground">{item.product?.brand?.name}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-base">{item.product?.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-xl font-light">${item.product?.price}</span>
              </div>

              {item.product?.colors && item.product.colors.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Colors</p>
                  <div className="flex gap-2">
                    {item.product.colors.map((color: string, i: number) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full border border-border"
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {item.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{item.notes}</p>
                </div>
              )}

              {item.product?.product_url && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(item.product.product_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original Product
                </Button>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Added {new Date(item.purchased_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Edit and Delete Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onToggleFavorite?.(item)}
              className="shrink-0"
            >
              <Heart className={`w-4 h-4 ${item.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleEdit}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClosetItemDialog;
