import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateBrandUserRequest {
  email: string;
  company_name: string;
  website_url?: string;
  application_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, company_name, website_url, application_id }: CreateBrandUserRequest = await req.json();

    console.log(`Creating brand user for: ${email}, company: ${company_name}`);

    // Generate a temporary password
    const tempPassword = `Sable_${crypto.randomUUID().slice(0, 8)}!`;

    // Create the user
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: company_name,
        is_brand: true,
      },
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = userData.user.id;
    console.log(`User created with ID: ${newUserId}`);

    // Generate API key
    const apiKey = `sbl_${crypto.randomUUID().replace(/-/g, '')}`;

    // Create brand record linked to user
    const { data: brandData, error: brandError } = await supabaseAdmin
      .from("brands")
      .insert({
        name: company_name,
        website_url: website_url || null,
        api_key: apiKey,
        is_active: true,
        user_id: newUserId,
      })
      .select()
      .single();

    if (brandError) {
      console.error("Error creating brand:", brandError);
      // Try to clean up the user if brand creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: brandError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign brand role to user
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "brand",
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      // Continue anyway - role can be added manually
    }

    // Update application status
    const { error: appError } = await supabaseAdmin
      .from("brand_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: requestingUser.id,
      })
      .eq("id", application_id);

    if (appError) {
      console.error("Error updating application:", appError);
    }

    // Log activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: requestingUser.id,
      brand_id: brandData.id,
      action: "brand_approved",
      entity_type: "brand",
      entity_id: brandData.id,
      details: { 
        brand_name: company_name,
        brand_email: email,
      },
    });

    console.log(`Brand user created successfully for ${company_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        brand_id: brandData.id,
        api_key: apiKey,
        temp_password: tempPassword,
        email: email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in create-brand-user:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});