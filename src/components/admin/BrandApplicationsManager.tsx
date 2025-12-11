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

interface BrandCredentials {
  email: string;
  temp_password: string | null;
  api_key: string;
  is_existing_user?: boolean;
}

export default function BrandApplicationsManager() {
  const [applications, setApplications] = useState<BrandApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<BrandApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approving, setApproving] = useState(false);
  const [newCredentials, setNewCredentials] = useState<BrandCredentials | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

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

  const handleApprove = async (app: BrandApplication) => {
    setApproving(true);

    try {
      // Call edge function to create brand user account
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("create-brand-user", {
        body: {
          email: app.contact_email,
          company_name: app.company_name,
          website_url: app.website_url,
          application_id: app.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create brand account");
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || "Failed to create brand account");
      }

      // Store credentials to show in dialog
      setNewCredentials({
        email: result.email,
        temp_password: result.temp_password,
        api_key: result.api_key,
        is_existing_user: result.is_existing_user,
      });
      setShowCredentialsDialog(true);
      
      const message = result.is_existing_user 
        ? `${app.company_name} approved! Brand linked to existing user account.`
        : `${app.company_name} approved! Brand account created.`;
      toast.success(message);
      loadApplications();
    } catch (error: any) {
      console.error("Error approving application:", error);
      toast.error(error.message || "Failed to approve application");
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

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Brand Account Created
            </DialogTitle>
            <DialogDescription>
              {newCredentials?.is_existing_user 
                ? "Brand linked to existing user account. Share the API key with the brand partner."
                : "Send these credentials to the brand partner. The password is temporary."}
            </DialogDescription>
          </DialogHeader>
          {newCredentials && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Login Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">{newCredentials.email}</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(newCredentials.email)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {newCredentials.temp_password ? (
                <div>
                  <label className="text-sm font-medium">Temporary Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">{newCredentials.temp_password}</code>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(newCredentials.temp_password!)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Brand should change this after first login</p>
                </div>
              ) : (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    User already exists. They can log in with their existing credentials.
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">API Key</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono truncate">{newCredentials.api_key}</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(newCredentials.api_key)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => {
                  const passwordLine = newCredentials.temp_password 
                    ? `Temporary Password: ${newCredentials.temp_password}\n`
                    : "(Use your existing password)\n";
                  const text = `Brand Portal Credentials\n\nLogin URL: ${window.location.origin}/brand/auth\nEmail: ${newCredentials.email}\n${passwordLine}API Key: ${newCredentials.api_key}\n\nPlease change your password after first login.`;
                  copyToClipboard(text);
                  toast.success("All credentials copied!");
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Credentials
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCredentialsDialog(false);
              setNewCredentials(null);
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
