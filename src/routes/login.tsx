import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Paper Billing</CardTitle>
          <CardDescription className="text-center">
            Authentication has been disabled. Use the app directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This application no longer uses Supabase authentication. Navigate to the dashboard to continue.
          </p>
          <Button className="w-full" onClick={() => navigate({ to: "/" })}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

