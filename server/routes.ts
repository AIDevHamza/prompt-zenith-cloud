import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for server');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to render prompts (replaces Supabase Edge Function)
  app.post("/api/render-prompt", async (req, res) => {
    try {
      const apiKey = req.headers["x-api-key"] as string;
      if (!apiKey) {
        return res.status(401).json({ error: "API key required" });
      }

      const { promptId, variables = {} } = req.body;
      
      if (!promptId) {
        return res.status(400).json({ error: "promptId is required" });
      }

      // Verify API key and get project
      const { data: keyData, error: keyError } = await supabase
        .from("api_keys")
        .select("project_id")
        .eq("key_hash", apiKey)
        .single();

      if (keyError || !keyData) {
        return res.status(401).json({ error: "Invalid API key" });
      }

      // Update last used timestamp
      await supabase
        .from("api_keys")
        .update({ last_used: new Date().toISOString() })
        .eq("key_hash", apiKey);

      // Get prompt from the same project as the API key
      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .select("content, variables")
        .eq("id", promptId)
        .eq("project_id", keyData.project_id)
        .single();

      if (promptError || !prompt) {
        return res.status(404).json({ error: "Prompt not found" });
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

      return res.json({ 
        content: renderedContent,
        variables: promptVariables
      });

    } catch (error) {
      console.error("Error in render-prompt:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
