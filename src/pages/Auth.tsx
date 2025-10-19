import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp } from "lucide-react";
import { signupSchema, loginSchema } from "@/lib/validationSchemas";
import { checkLoginAttempts, resetLoginAttempts, isWeakPassword } from "@/lib/authValidation";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Password reset
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validationResult = signupSchema.safeParse({
        fullName,
        email: signupEmail,
        password: signupPassword,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(", ");
        throw new Error(errors);
      }

      // Check for weak passwords
      if (isWeakPassword(signupPassword)) {
        throw new Error("Password is too common. Please choose a stronger password.");
      }

      const { error } = await supabase.auth.signUp({
        email: validationResult.data.email,
        password: validationResult.data.password,
        options: {
          data: {
            full_name: validationResult.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("This email is already registered. Please log in instead.");
        }
        throw error;
      }

      toast({
        title: "สำเร็จ / Success",
        description: "บัญชีของคุณถูกสร้างแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยัน / Account created. Please check your email to verify.",
      });

      // Switch to login tab
      setTimeout(() => {
        const loginTab = document.querySelector('[value="login"]') as HTMLButtonElement;
        loginTab?.click();
      }, 1500);
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validationResult = loginSchema.safeParse({
        email: loginEmail,
        password: loginPassword,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(", ");
        throw new Error(errors);
      }

      // Check rate limiting
      const rateLimitCheck = checkLoginAttempts(loginEmail);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.message);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw error;
      }

      // Reset login attempts on success
      resetLoginAttempts(loginEmail);

      toast({
        title: "สำเร็จ / Success",
        description: "เข้าสู่ระบบสำเร็จ / Login successful",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      const validationResult = loginSchema.pick({ email: true }).safeParse({ email: resetEmail });

      if (!validationResult.success) {
        throw new Error("Please enter a valid email address");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast({
        title: "อีเมลส่งแล้ว / Email Sent",
        description: "กรุณาตรวจสอบอีเมลเพื่อรีเซ็ตรหัสผ่าน / Check your email for password reset instructions",
      });

      setShowResetForm(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด / Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Thai Portfolio Tracker</CardTitle>
          <CardDescription>แพลตฟอร์มติดตามพอร์ตการลงทุน / Investment Portfolio Platform</CardDescription>
        </CardHeader>
        <CardContent>
          {showResetForm ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">อีเมล / Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isResetting}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetForm(false)}
                  disabled={isResetting}
                  className="flex-1"
                >
                  ย้อนกลับ / Back
                </Button>
                <Button type="submit" disabled={isResetting} className="flex-1">
                  {isResetting ? "กำลังส่ง... / Sending..." : "ส่งลิงก์ / Send Link"}
                </Button>
              </div>
            </form>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">เข้าสู่ระบบ / Login</TabsTrigger>
                <TabsTrigger value="signup">สมัครสมาชิก / Signup</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">อีเมล / Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">รหัสผ่าน / Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowResetForm(true)}
                    className="px-0 text-sm"
                  >
                    ลืมรหัสผ่าน? / Forgot password?
                  </Button>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "กำลังเข้าสู่ระบบ... / Logging in..." : "เข้าสู่ระบบ / Login"}
                  </Button>
                </form>
              </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">ชื่อ-นามสกุล / Full Name</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="สมชาย ใจดี / John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">อีเมล / Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">รหัสผ่าน / Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    ต้องมีอย่างน้อย 8 ตัว มีตัวอักษรใหญ่ เล็ก และตัวเลข / Must be 8+ chars with uppercase, lowercase, and number
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "กำลังสมัคร... / Signing up..." : "สมัครสมาชิก / Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
