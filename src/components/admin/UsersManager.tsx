import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, Pencil, Key } from "lucide-react";

const UsersManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "" });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          style_preferences (*),
          capsule_wardrobes (count),
          user_wardrobe (count),
          outfit_plans (count),
          cart_items (count),
          chat_messages (count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const [profile, preferences, wardrobes, userWardrobe, outfits, carts, chats] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("style_preferences").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("capsule_wardrobes").select("*").eq("user_id", userId),
        supabase.from("user_wardrobe").select("*").eq("user_id", userId),
        supabase.from("outfit_plans").select("*").eq("user_id", userId),
        supabase.from("cart_items").select("*").eq("user_id", userId),
        supabase.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      setUserDetails({
        profile: profile.data,
        preferences: preferences.data,
        wardrobes: wardrobes.data,
        userWardrobe: userWardrobe.data,
        outfits: outfits.data,
        carts: carts.data,
        chats: chats.data,
      });
    } catch (error) {
      console.error("Error loading user details:", error);
      toast.error("Failed to load user details");
    }
  };

  const handleViewUser = async (user: any) => {
    setSelectedUser(user);
    await loadUserDetails(user.id);
    setViewDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({ full_name: user.full_name || "", email: user.email });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editForm.full_name, email: editForm.email })
        .eq("id", selectedUser.id);

      if (error) throw error;
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      toast.success("Password reset email sent");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error("Failed to send password reset email");
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">View and manage all user accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Total: {users.length} registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Style Profile</TableHead>
                <TableHead>Wardrobes</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.style_preferences ? (
                      <Badge variant="secondary">Completed</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.capsule_wardrobes?.[0]?.count || 0}</TableCell>
                  <TableCell>{user.user_wardrobe?.[0]?.count || 0}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleResetPassword(user.id, user.email)}>
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details: {selectedUser?.full_name || selectedUser?.email}</DialogTitle>
            <DialogDescription>Complete user data and activity</DialogDescription>
          </DialogHeader>
          {userDetails && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
                <TabsTrigger value="outfits">Outfits</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{userDetails.profile?.full_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{userDetails.profile?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="text-sm font-mono">{userDetails.profile?.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Joined</Label>
                    <p className="font-medium">{new Date(userDetails.profile?.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="preferences" className="space-y-4">
                {userDetails.preferences ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Style Type</Label>
                      <p className="font-medium">{userDetails.preferences.style_type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Lifestyle</Label>
                      <p className="font-medium">{userDetails.preferences.lifestyle}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Budget Range</Label>
                      <p className="font-medium">{userDetails.preferences.budget_range}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Color Preferences</Label>
                      <p className="font-medium">{userDetails.preferences.color_preferences?.join(", ") || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Body Type</Label>
                      <p className="font-medium">{userDetails.preferences.body_type || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Occasions</Label>
                      <p className="font-medium">{userDetails.preferences.occasions?.join(", ") || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Raw Sizes Data</Label>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(userDetails.preferences.sizes, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No style preferences set</p>
                )}
              </TabsContent>
              <TabsContent value="wardrobe" className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">User Wardrobe Items ({userDetails.userWardrobe?.length || 0})</Label>
                  <div className="space-y-2 mt-2">
                    {userDetails.userWardrobe?.map((item: any) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {item.custom_image_url && (
                              <img src={item.custom_image_url} alt="Item" className="w-20 h-20 object-cover rounded" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.custom_brand || "Custom Item"}</p>
                              <p className="text-sm text-muted-foreground">{item.custom_category}</p>
                              <p className="text-sm">{item.custom_description}</p>
                              {item.notes && <p className="text-sm text-muted-foreground mt-1">Notes: {item.notes}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="outfits" className="space-y-4">
                <Label className="text-muted-foreground">Saved Outfits ({userDetails.outfits?.length || 0})</Label>
                <div className="space-y-2">
                  {userDetails.outfits?.map((outfit: any) => (
                    <Card key={outfit.id}>
                      <CardContent className="p-4">
                        <p className="font-medium">{outfit.name}</p>
                        {outfit.day_of_week && <Badge variant="outline">{outfit.day_of_week}</Badge>}
                        <p className="text-sm text-muted-foreground mt-2">
                          {Object.keys(outfit.items || {}).length} items
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="activity" className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Chat Messages ({userDetails.chats?.length || 0})</Label>
                  <div className="space-y-2 mt-2 max-h-96 overflow-y-auto">
                    {userDetails.chats?.map((msg: any) => (
                      <div key={msg.id} className="p-3 bg-muted rounded">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <Badge variant={msg.role === "user" ? "default" : "secondary"}>{msg.role}</Badge>
                          <span>{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                type="email"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>Update User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManager;