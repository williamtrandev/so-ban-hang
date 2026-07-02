"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { GoogleIcon } from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DangNhapPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("Không đăng nhập được với Google. Thử lại.");
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground lg:hidden">
            NB
          </div>
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>Quản lý bán nem, bì, chả lụa</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            <GoogleIcon className="size-4" />
            {pending ? "Đang chuyển đến Google..." : "Đăng nhập với Google"}
          </Button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
