import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { 
  Zap, 
  ArrowRight, 
  FileText, 
  Key, 
  History, 
  Globe, 
  CheckCircle,
  Users,
  Rocket,
  Code
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="h-10 w-10" />
            <h1 className="text-4xl md:text-6xl font-bold">Promptever</h1>
          </div>
          
          <h2 className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The prompt management platform that lets you <span className="text-foreground font-semibold">edit once, deploy everywhere</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Create, manage, and deploy prompt templates with variables. 
            Get a secure API to integrate with any application, automation tool, or workflow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="flex items-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Everything you need to manage prompts</h3>
            <p className="text-lg text-muted-foreground">
              Build once, integrate everywhere. No more copy-pasting prompts across tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Template Management</CardTitle>
                <CardDescription>
                  Create prompt templates with variables like {`{{name}}`} and {`{{company}}`}. 
                  Preview your prompts with real values before deployment.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Key className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Secure API Access</CardTitle>
                <CardDescription>
                  Generate API keys for each project. Fetch rendered prompts 
                  from any application with a simple HTTP request.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <History className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Version Control</CardTitle>
                <CardDescription>
                  Track every change to your prompts. View history and 
                  revert to previous versions with a single click.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Project Organization</CardTitle>
                <CardDescription>
                  Organize prompts into projects. Perfect for teams 
                  managing multiple applications or clients.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Universal Integration</CardTitle>
                <CardDescription>
                  Works with any tool that can make HTTP requests. 
                  Zapier, Make.com, custom apps, or automation scripts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Rocket className="h-10 w-10 mb-4 text-primary" />
                <CardTitle>Instant Deployment</CardTitle>
                <CardDescription>
                  Changes go live immediately. Update your prompts 
                  and see the changes across all integrations instantly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">How it works</h3>
            <p className="text-lg text-muted-foreground">
              Simple workflow that saves you time and reduces errors
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center">1</Badge>
                  <h4 className="text-xl font-semibold">Create Templates</h4>
                </div>
                <p className="text-muted-foreground">
                  Write your prompts with variables using the {`{{variable}}`} syntax. 
                  Preview how they'll look with real data.
                </p>
              </div>
              <div className="flex-1">
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <code className="text-sm">
                      Hello {`{{name}}`}, welcome to {`{{company}}`}! 
                      Your role as {`{{role}}`} gives you access to...
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center">2</Badge>
                  <h4 className="text-xl font-semibold">Generate API Keys</h4>
                </div>
                <p className="text-muted-foreground">
                  Create secure API keys for each project or integration. 
                  Each key can access only its project's prompts.
                </p>
              </div>
              <div className="flex-1">
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <code className="text-sm">
                      x-api-key: pk_1a2b3c4d...
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center">3</Badge>
                  <h4 className="text-xl font-semibold">Integrate Anywhere</h4>
                </div>
                <p className="text-muted-foreground">
                  Make HTTP requests from any application to get your rendered prompts. 
                  Works with webhooks, automation tools, and custom applications.
                </p>
              </div>
              <div className="flex-1">
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <code className="text-sm">
                      POST /render-prompt<br/>
                      {`{ "promptId": "...", "variables": {...} }`}
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-2xl">
          <h3 className="text-3xl font-bold mb-4">Ready to streamline your prompts?</h3>
          <p className="text-lg mb-8 opacity-90">
            Join developers who've simplified their prompt management workflow.
          </p>
          
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="flex items-center gap-2 mx-auto">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="flex items-center gap-2 mx-auto">
                Start Free Today
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6" />
            <span className="text-lg font-semibold">Promptever</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Edit once, deploy everywhere. Built for developers who value simplicity.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
