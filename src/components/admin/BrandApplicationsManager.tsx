import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Eye, Copy, Clock, Building2, Mail, Globe, Package } from "lucide-react";

interface BrandApplication {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  website_url: string | null;
  product_categories: string[];
  estimated_products: number | null;
  description: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function BrandApplicationsManager() {
  const [applications, setApplications] = useState<BrandApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<BrandApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approving, setApproving] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("brand_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "sbl_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleApprove = async (app: BrandApplication) => {
    setApproving(true);
    const apiKey = generateApiKey();

    try {
      // Create brand record
      const { error: brandError } = await supabase.from("brands").insert({
        name: app.company_name,
        website_url: app.website_url,
        api_key: apiKey,
        is_active: true,
      });

      if (brandError) throw brandError;

      // Update application status
      const { error: appError } = await supabase
        .from("brand_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", app.id);

      if (appError) throw appError;

      setNewApiKey(apiKey);
      toast.success(`${app.company_name} approved and API key generated!`);
      loadApplications();
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;

    try {
      const { error } = await supabase
        .from("brand_applications")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedApp.id);

      if (error) throw error;

      toast.success("Application rejected");
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedApp(null);
      loadApplications();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Brand Applications</h2>
          <p className="text-muted-foreground">
            Review and approve brand partner requests
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-primary">{pendingCount} pending</Badge>
        )}
      </div>

      {newApiKey && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Brand Approved - API Key Generated
            </CardTitle>
            <CardDescription>
              Send this API key to the brand partner. It will only be shown once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-muted rounded font-mono text-sm">
                {newApiKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newApiKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setNewApiKey(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No brand applications yet
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.company_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{app.contact_name}</div>
                      <div className="text-muted-foreground">{app.contact_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {app.product_categories.slice(0, 3).map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {app.product_categories.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{app.product_categories.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(app.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedApp(app);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {app.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(app)}
                            disabled={approving}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedApp(app);
                              setShowRejectDialog(true);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{selectedApp?.company_name}</DialogTitle>
            <DialogDescription>Application Details</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Contact
                  </div>
                  <div>{selectedApp.contact_name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </div>
                  <div>{selectedApp.contact_email}</div>
                </div>
                {selectedApp.website_url && (
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Website
                    </div>
                    <a
                      href={selectedApp.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedApp.website_url}
                    </a>
                  </div>
                )}
                {selectedApp.estimated_products && (
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3" /> Est. Products
                    </div>
                    <div>{selectedApp.estimated_products.toLocaleString()}</div>
                  </div>
                )}
              </div>

              {selectedApp.product_categories.length > 0 && (
                <div>
                  <div className="text-muted-foreground text-sm mb-2">Categories</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.product_categories.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.description && (
                <div>
                  <div className="text-muted-foreground text-sm mb-1">Description</div>
                  <p className="text-sm">{selectedApp.description}</p>
                </div>
              )}

              <div className="pt-2">
                <div className="text-muted-foreground text-sm mb-1">Status</div>
                {getStatusBadge(selectedApp.status)}
                {selectedApp.rejection_reason && (
                  <p className="text-sm text-red-600 mt-2">
                    Reason: {selectedApp.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedApp?.company_name}'s application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
