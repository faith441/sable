import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileSpreadsheet, X, ImageIcon } from "lucide-react";

const CATEGORIES = [
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", 
  "Accessories", "Activewear", "Swimwear", "Loungewear", "Formal"
];

const BrandProductUpload = () => {
  const navigate = useNavigate();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    price: "",
    product_url: "",
    sizes: "",
    colors: "",
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/brand/auth");
        return;
      }

      const { data: brandData } = await supabase
        .from("brands")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!brandData) {
        navigate("/brand/auth");
        return;
      }

      setBrandId(brandData.id);
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/brand/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !brandId) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${brandId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("brand-products")
      .upload(fileName, imageFile);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("brand-products")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) return;

    setUploading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const productData = {
        brand_id: brandId,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        price: parseFloat(formData.price) || 0,
        product_url: formData.product_url || `https://sable.app/product/${Date.now()}`,
        sizes: formData.sizes ? formData.sizes.split(",").map(s => s.trim()) : [],
        colors: formData.colors ? formData.colors.split(",").map(c => c.trim()) : [],
        image_url: imageUrl,
        approval_status: "pending",
        is_available: false,
      };

      const { error } = await supabase.from("products").insert([productData]);

      if (error) throw error;

      toast.success("Product submitted for review!");
      navigate("/brand/products");
    } catch (error) {
      console.error("Error uploading product:", error);
      toast.error("Failed to upload product");
    } finally {
      setUploading(false);
    }
  };

  const handleCsvFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx]?.trim() || '';
          return obj;
        }, {} as any);
      }).filter(row => row.name);
      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !brandId) return;

    setUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const products = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });
        return row;
      }).filter(row => row.name);

      const productsData = products.map(row => ({
        brand_id: brandId,
        name: row.name,
        description: row.description || null,
        category: row.category || "Other",
        tags: row.tags ? row.tags.split(';').map((t: string) => t.trim()) : [],
        price: parseFloat(row.price) || 0,
        product_url: row.product_url || row.url || `https://sable.app/product/${Date.now()}`,
        sizes: row.sizes ? row.sizes.split(';').map((s: string) => s.trim()) : [],
        colors: row.colors ? row.colors.split(';').map((c: string) => c.trim()) : [],
        image_url: row.image_url || row.image || null,
        approval_status: "pending",
        is_available: false,
      }));

      const { error } = await supabase.from("products").insert(productsData);

      if (error) throw error;

      toast.success(`${productsData.length} products submitted for review!`);
      navigate("/brand/products");
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/brand")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Upload Products</h1>
            <p className="text-muted-foreground text-sm">Add products to your inventory</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">
              <Upload className="mr-2 h-4 w-4" />
              Single Product
            </TabsTrigger>
            <TabsTrigger value="csv">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>
                  Fill in the details below. Products will be reviewed before going live.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {previewImage ? (
                        <div className="relative inline-block">
                          <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="max-h-48 rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => {
                              setPreviewImage(null);
                              setImageFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Drag & drop an image here, or{" "}
                            <label className="text-primary cursor-pointer hover:underline">
                              browse
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                              />
                            </label>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Classic White Oxford Shirt"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your product..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="99.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sizes">Sizes (comma-separated)</Label>
                      <Input
                        id="sizes"
                        value={formData.sizes}
                        onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                        placeholder="XS, S, M, L, XL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="colors">Colors (comma-separated)</Label>
                      <Input
                        id="colors"
                        value={formData.colors}
                        onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                        placeholder="Black, White, Navy"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="casual, summer, essentials"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="product_url">Product URL</Label>
                      <Input
                        id="product_url"
                        value={formData.product_url}
                        onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                        placeholder="https://yourbrand.com/product/..."
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={uploading || !formData.name || !formData.category}>
                    {uploading ? "Uploading..." : "Submit for Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload via CSV</CardTitle>
                <CardDescription>
                  Upload multiple products at once using a CSV file.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">CSV Format</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your CSV should include these columns:
                  </p>
                  <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                    name,description,category,price,sizes,colors,tags,image_url,product_url
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use semicolons (;) to separate multiple values in sizes, colors, and tags
                  </p>
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    csvFile ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {csvFile ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="h-12 w-12 mx-auto text-primary" />
                      <p className="font-medium">{csvFile.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCsvFile(null);
                          setCsvPreview([]);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        <label className="text-primary cursor-pointer hover:underline">
                          Choose a CSV file
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])}
                          />
                        </label>
                      </p>
                    </div>
                  )}
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Category</th>
                            <th className="text-left p-2">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((row, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">{row.name}</td>
                              <td className="p-2">{row.category}</td>
                              <td className="p-2">${row.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  disabled={!csvFile || uploading}
                  onClick={handleCsvUpload}
                >
                  {uploading ? "Uploading..." : "Upload CSV"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BrandProductUpload;