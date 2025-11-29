import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone: string;
  orderNumber?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, orderNumber, message }: ContactEmailRequest = await req.json();

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate string lengths for security
    if (name.length > 100 || email.length > 255 || phone.length > 20 || 
        message.length > 2000 || (orderNumber && orderNumber.length > 50)) {
      return new Response(
        JSON.stringify({ error: "Field length exceeds maximum" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to admin
    const adminEmail = await resend.emails.send({
      from: "Sable Support <onboarding@resend.dev>", // Replace with your verified domain
      to: ["admin@yourdomain.com"], // Replace with actual admin email
      replyTo: email,
      subject: `New Support Request from ${name}${orderNumber ? ` - Order: ${orderNumber}` : ""}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7C6F5C; font-size: 24px; font-weight: 300; margin-bottom: 24px;">New Support Request</h1>
          
          <div style="background-color: #F8F6F3; border-left: 4px solid #9CA986; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
            <h2 style="color: #5C5647; font-size: 16px; font-weight: 500; margin-bottom: 12px;">Contact Information</h2>
            <p style="color: #5C5647; margin: 8px 0;"><strong>Name:</strong> ${name}</p>
            <p style="color: #5C5647; margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #5C5647; margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>
            ${orderNumber ? `<p style="color: #5C5647; margin: 8px 0;"><strong>Order Number:</strong> ${orderNumber}</p>` : ""}
          </div>

          <div style="background-color: #FFFFFF; border: 1px solid #E5E1DB; padding: 20px; border-radius: 4px;">
            <h2 style="color: #5C5647; font-size: 16px; font-weight: 500; margin-bottom: 12px;">Message</h2>
            <p style="color: #5C5647; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="color: #9CA986; font-size: 12px; margin-top: 24px; text-align: center;">
            This email was sent from the Sable contact form
          </p>
        </div>
      `,
    });

    // Send confirmation to user
    const userEmail = await resend.emails.send({
      from: "Sable Support <onboarding@resend.dev>", // Replace with your verified domain
      to: [email],
      subject: "We received your message - Sable Support",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7C6F5C; font-size: 24px; font-weight: 300; margin-bottom: 24px;">Thank You for Contacting Us</h1>
          
          <p style="color: #5C5647; line-height: 1.6; margin-bottom: 20px;">
            Hi ${name},
          </p>

          <p style="color: #5C5647; line-height: 1.6; margin-bottom: 20px;">
            We've received your support request and our team will review it shortly. We typically respond within 24 hours during business days.
          </p>

          <div style="background-color: #F8F6F3; border-left: 4px solid #9CA986; padding: 20px; margin: 24px 0; border-radius: 4px;">
            <h2 style="color: #5C5647; font-size: 16px; font-weight: 500; margin-bottom: 12px;">Your Request Details</h2>
            ${orderNumber ? `<p style="color: #5C5647; margin: 8px 0;"><strong>Order Number:</strong> ${orderNumber}</p>` : ""}
            <p style="color: #5C5647; margin: 8px 0;"><strong>Message:</strong></p>
            <p style="color: #5C5647; line-height: 1.6; white-space: pre-wrap; margin-top: 8px;">${message}</p>
          </div>

          <p style="color: #5C5647; line-height: 1.6; margin-top: 24px;">
            Best regards,<br>
            The Sable Team
          </p>

          <p style="color: #9CA986; font-size: 12px; margin-top: 32px; text-align: center; border-top: 1px solid #E5E1DB; padding-top: 16px;">
            This is an automated confirmation email. Please do not reply directly to this message.
          </p>
        </div>
      `,
    });

    console.log("Emails sent successfully:", { adminEmail, userEmail });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
