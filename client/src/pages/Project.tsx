import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Key, 
  History, 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  Book,
  Zap
} from "lucide-react";

interface ProjectData {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Prompt {
  id: string;
  name: string;
  content: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

interface PromptVersion {
  id: string;
  content: string;
  variables: string[];
  version_number: number;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used: string | null;
  created_at: string;
}

export default function Project() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePromptDialog, setShowCreatePromptDialog] = useState(false);
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [showEditPromptDialog, setShowEditPromptDialog] = useState(false);
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  
  const [newPrompt, setNewPrompt] = useState({ name: "", content: "" });
  const [newKeyName, setNewKeyName] = useState("");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    if (user && projectId) {
      fetchProjectData();
    }
  }, [user, projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from("prompts")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });

      if (promptsError) throw promptsError;
      setPrompts((promptsData || []).map(p => ({
        ...p,
        variables: (p.variables as string[]) || []
      })));

      // Fetch API keys
      const { data: keysData, error: keysError } = await supabase
        .from("api_keys")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;
      setApiKeys(keysData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch project data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? [...new Set(matches.map(match => match.slice(2, -2)))] : [];
  };

  const createPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const variables = extractVariables(newPrompt.content);

    try {
      const { data, error } = await supabase
        .from("prompts")
        .insert([{
          project_id: projectId,
          name: newPrompt.name,
          content: newPrompt.content,
          variables,
        }])
        .select()
        .single();

      if (error) throw error;

      setPrompts(prev => [{
        ...data,
        variables: (data.variables as string[]) || []
      }, ...prev]);
      setNewPrompt({ name: "", content: "" });
      setShowCreatePromptDialog(false);
      
      toast({
        title: "Success",
        description: "Prompt created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      });
    }
  };

  const updatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;

    const variables = extractVariables(editingPrompt.content);

    try {
      const { data, error } = await supabase
        .from("prompts")
        .update({
          name: editingPrompt.name,
          content: editingPrompt.content,
          variables,
        })
        .eq("id", editingPrompt.id)
        .select()
        .single();

      if (error) throw error;

      setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? {
        ...data,
        variables: (data.variables as string[]) || []
      } : p));
      setEditingPrompt(null);
      setShowEditPromptDialog(false);
      
      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update prompt",
        variant: "destructive",
      });
    }
  };

  const deletePrompt = async (promptId: string) => {
    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", promptId);

      if (error) throw error;

      setPrompts(prev => prev.filter(p => p.id !== promptId));
      
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Generate a secure API key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const apiKey = Array.from(keyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      const keyPrefix = `pk_${apiKey.substring(0, 8)}`;
      const keyHash = apiKey; // In production, this should be properly hashed

      const { data, error } = await supabase
        .from("api_keys")
        .insert([{
          project_id: projectId,
          name: newKeyName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
        }])
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data, ...prev]);
      setNewKeyName("");
      setShowCreateKeyDialog(false);
      
      // Show the full API key to the user (only time they'll see it)
      navigator.clipboard.writeText(apiKey);
      toast({
        title: "API Key Created",
        description: `Key copied to clipboard: ${keyPrefix}...`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;

      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const fetchPromptVersions = async (promptId: string) => {
    try {
      const { data, error } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", promptId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setPromptVersions((data || []).map(v => ({
        ...v,
        variables: (v.variables as string[]) || []
      })));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch prompt versions",
        variant: "destructive",
      });
    }
  };

  const revertToVersion = async (version: PromptVersion) => {
    if (!selectedPrompt) return;

    try {
      const { data, error } = await supabase
        .from("prompts")
        .update({
          content: version.content,
          variables: version.variables,
        })
        .eq("id", selectedPrompt.id)
        .select()
        .single();

      if (error) throw error;

      setPrompts(prev => prev.map(p => p.id === selectedPrompt.id ? {
        ...data,
        variables: (data.variables as string[]) || []
      } : p));
      setShowVersionsDialog(false);
      
      toast({
        title: "Success",
        description: `Reverted to version ${version.version_number}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to revert to version",
        variant: "destructive",
      });
    }
  };

  const renderPreview = (prompt: Prompt) => {
    let preview = prompt.content;
    prompt.variables.forEach(variable => {
      const value = previewVariables[variable] || `{{${variable}}}`;
      preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });
    return preview;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6" />
                <h1 className="text-xl font-semibold">{project.name}</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Integration Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Prompts</h2>
              <Dialog open={showCreatePromptDialog} onOpenChange={setShowCreatePromptDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Prompt</DialogTitle>
                    <DialogDescription>
                      Create a new prompt template with variables.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createPrompt} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="promptName">Prompt Name</Label>
                      <Input
                        id="promptName"
                        value={newPrompt.name}
                        onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter prompt name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promptContent">Content</Label>
                      <Textarea
                        id="promptContent"
                        value={newPrompt.content}
                        onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter your prompt template. Use {{variableName}} for variables."
                        rows={10}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Use {`{{variableName}}`} syntax for variables that can be replaced dynamically.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreatePromptDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Prompt</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {prompts.length === 0 ? (
              <Card className="premium-card text-center py-12">
                <CardHeader>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <CardTitle>No prompts yet</CardTitle>
                  <CardDescription>
                    Create your first prompt template to get started.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <Card key={prompt.id} className="premium-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {prompt.name}
                            {prompt.variables.length > 0 && (
                              <Badge variant="secondary">
                                {prompt.variables.length} variable{prompt.variables.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Updated {new Date(prompt.updated_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPrompt(prompt);
                              fetchPromptVersions(prompt.id);
                              setShowVersionsDialog(true);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPrompt({ ...prompt });
                              setShowEditPromptDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePrompt(prompt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Content:</Label>
                        <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
                          {prompt.content}
                        </div>
                      </div>
                      
                      {prompt.variables.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Variables:</Label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {prompt.variables.map(variable => (
                              <Badge key={variable} variant="outline">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {prompt.variables.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Preview with values:</Label>
                          <div className="mt-2 space-y-2">
                            {prompt.variables.map(variable => (
                              <div key={variable} className="flex gap-2 items-center">
                                <Label className="text-xs w-20">{variable}:</Label>
                                 <Input
                                  placeholder={`Enter ${variable}`}
                                  value={previewVariables[variable] || ""}
                                  onChange={(e) => setPreviewVariables(prev => ({
                                    ...prev,
                                    [variable]: e.target.value
                                  }))}
                                />
                              </div>
                            ))}
                            <div className="mt-3 p-3 bg-secondary rounded-md">
                              <Label className="text-sm font-medium">Preview:</Label>
                              <div className="mt-1 font-mono text-sm">
                                {renderPreview(prompt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">API Keys</h2>
              <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key for accessing your prompts externally.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createApiKey} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production App, Development"
                        required
                      />
                    </div>
                    <Alert>
                      <AlertDescription>
                        The API key will only be shown once. Make sure to copy and store it securely.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateKeyDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Key</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {apiKeys.length === 0 ? (
              <Card className="premium-card text-center py-12">
                <CardHeader>
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <CardTitle>No API keys yet</CardTitle>
                  <CardDescription>
                    Create API keys to access your prompts from external applications.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id} className="premium-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{apiKey.name}</CardTitle>
                          <CardDescription>
                            Created {new Date(apiKey.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm flex-1">
                          {apiKey.key_prefix}...
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(apiKey.key_prefix);
                            toast({
                              title: "Key Prefix Copied",
                              description: "Key prefix copied to clipboard. Note: Full key is only shown once during creation.",
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {apiKey.last_used && (
                          <Badge variant="outline">
                            Last used {new Date(apiKey.last_used).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Full API key is only shown once during creation for security reasons.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Integration Guide</CardTitle>
                <CardDescription>
                  Learn how to integrate Promptever with your applications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">API Endpoint</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <code className="text-sm">
                      POST {window.location.origin}/api/render-prompt
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Include your API key in the request headers:
                  </p>
                  <div className="bg-muted p-4 rounded-md">
                    <code className="text-sm">
                      x-api-key: YOUR_API_KEY
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Request Format</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-x-auto">
{`{
  "promptId": "your-prompt-id",
  "variables": {
    "name": "John Doe",
    "company": "Acme Corp"
  }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Response Format</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-x-auto">
{`{
  "content": "Hello John Doe from Acme Corp!",
  "variables": ["name", "company"]
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Example: JavaScript/Node.js</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-x-auto">
{`const response = await fetch('${window.location.origin}/api/render-prompt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    promptId: 'your-prompt-id',
    variables: {
      name: 'John Doe',
      company: 'Acme Corp'
    }
  })
});

const data = await response.json();
console.log(data.content); // "Hello John Doe from Acme Corp!"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Example: Python</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-x-auto">
{`import requests

# Replace with your actual domain
response = requests.post(
    '${window.location.origin}/api/render-prompt',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'
    },
    json={
        'promptId': 'your-prompt-id',
        'variables': {
            'name': 'John Doe',
            'company': 'Acme Corp'
        }
    }
)

data = response.json()
print(data['content'])  # "Hello John Doe from Acme Corp!"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Example: cURL</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-x-auto">
{`curl -X POST '${window.location.origin}/api/render-prompt' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -d '{
    "promptId": "your-prompt-id",
    "variables": {
      "name": "John Doe",
      "company": "Acme Corp"
    }
  }'`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Prompt Dialog */}
      <Dialog open={showEditPromptDialog} onOpenChange={setShowEditPromptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Update your prompt template.
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <form onSubmit={updatePrompt} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editPromptName">Prompt Name</Label>
                <Input
                  id="editPromptName"
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPromptContent">Content</Label>
                <Textarea
                  id="editPromptContent"
                  value={editingPrompt.content}
                  onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={10}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditPromptDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Prompt</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog open={showVersionsDialog} onOpenChange={setShowVersionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and revert to previous versions of your prompt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {promptVersions.map((version) => (
              <Card key={version.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Version {version.version_number}</CardTitle>
                      <CardDescription>
                        {new Date(version.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revertToVersion(version)}
                    >
                      Revert
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono bg-muted p-3 rounded">
                    {version.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}