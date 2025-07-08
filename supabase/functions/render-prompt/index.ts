import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RenderRequest {
  promptId: string;
  variables: Record<string, string>;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify API key and get project
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("project_id")
      .eq("key_hash", apiKey)
      .single();

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update last used timestamp
    await supabase
      .from("api_keys")
      .update({ last_used: new Date().toISOString() })
      .eq("key_hash", apiKey);

    const { promptId, variables = {} }: RenderRequest = await req.json();

    if (!promptId) {
      return new Response(JSON.stringify({ error: "promptId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get prompt from the same project as the API key
    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("content, variables")
      .eq("id", promptId)
      .eq("project_id", keyData.project_id)
      .single();

    if (promptError || !prompt) {
      return new Response(JSON.stringify({ error: "Prompt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Render the prompt by replacing variables
    let renderedContent = prompt.content;
    const promptVariables = prompt.variables as string[] || [];

    // Replace variables in the format {{variableName}}
    for (const variable of promptVariables) {
      const placeholder = `{{${variable}}}`;
      const value = variables[variable] || placeholder;
      renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), value);
    }

    return new Response(JSON.stringify({ 
      content: renderedContent,
      variables: promptVariables
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Error in render-prompt function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);