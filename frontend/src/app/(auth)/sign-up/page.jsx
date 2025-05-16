"use client"

import { LogoSimple } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Building, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
// Try importing only the Provider first to see if the module itself is accessible
import { GoogleReCaptchaProvider } from "@google-recaptcha/react";
// import { GoogleReCaptchaProvider, GoogleReCaptcha } from "@google-recaptcha/react"; // Original import

export default function SignUpPage() {
  const { signUp, signInWithGoogleAuth } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [captchaToken, setCaptchaToken] = useState(null); // Temporarily remove state for the component

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    organizationType: "",
    agreeTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Temporarily remove captcha handlers if GoogleReCaptcha component is not used
  // const handleCaptchaVerify = useCallback((token) => {
  //   console.log("Captcha Token Received:", token);
  //   setCaptchaToken(token);
  // }, []);

  // const handleCaptchaError = useCallback(() => {
  //   toast({
  //       title: "CAPTCHA Error",
  //       description: "There was an error loading or verifying the CAPTCHA. Please try refreshing.",
  //       variant: "destructive",
  //   });
  //   setCaptchaToken(null);
  // }, [toast]);

  // const handleCaptchaExpired = useCallback(() => {
  //   toast({
  //       title: "CAPTCHA Expired",
  //       description: "The CAPTCHA has expired. Please verify again.",
  //       variant: "warning",
  //   });
  //   setCaptchaToken(null);
  // }, [toast]);

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      toast({
        title: "Terms and conditions",
        description: "You must agree to the terms and conditions.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Temporarily bypass captcha check for this test
    // if (!captchaToken) {
    //   toast({
    //     title: "CAPTCHA verification required",
    //     description: "Please complete the CAPTCHA verification.",
    //     variant: "destructive",
    //   });
    //   setIsLoading(false);
    //   return;
    // }
    const temporaryCaptchaToken = "build-test-bypass-no-component";

    try {
      const createdUser = await signUp(
        formData.name,
        formData.email,
        formData.password,
        formData.organization,
        formData.organizationType,
        temporaryCaptchaToken // Sending placeholder
      );

      if (createdUser) {
        if (createdUser.is_approved) {
          toast({
            title: "Account Created & Approved!",
            description: `Welcome, ${createdUser.name || 'user'}! You can now sign in.`,
          });
          router.push('/sign-in');
        } else {
          toast({
            title: "Account Created Successfully!",
            description: "Your account is now pending administrative approval. Please check back later or contact support if you have questions.",
            duration: 7000,
          });
          setFormData({ name: "", email: "", password: "", confirmPassword: "", organization: "", organizationType: "", agreeTerms: false });
          // setCaptchaToken(null); 
        }
      } else {
        console.error("SignUpPage onSubmit: signUp function did not return user data as expected.");
        toast({
          title: "Sign Up Processed",
          description: "Your account creation request has been processed. If you don't receive a confirmation or see your account pending, please contact support.",
          variant: "default",
          duration: 7000,
        });
      }
    } catch (error) {
      console.error("Sign up error:", error);
      const errorMessage = error.response?.data?.message || error.message || "There was a problem creating your account. Please try again.";
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      // setCaptchaToken(null); 
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setIsLoading(true);
    try {
      const googleUser = await signInWithGoogleAuth();

      if (googleUser) {
        if (googleUser.is_approved) {
          toast({
            title: "Signed up & Approved with Google!",
            description: `Welcome, ${googleUser.name || 'user'}! You are now signed in.`,
          });
          router.push('/dashboard');
        } else {
          toast({
            title: "Signed up with Google!",
            description: `Welcome, ${googleUser.name || 'user'}! Your account has been created and is now pending administrative approval. You will be able to sign in after approval.`,
            duration: 7000,
          });
        }
      } else {
        console.error("SignUpPage handleGoogleSignUp: signInWithGoogleAuth function did not return user data as expected.");
        toast({
          title: "Google Sign Up Processed",
          description: "Your Google sign-up request has been processed. If you don't receive a confirmation or see your account pending, please contact support.",
          variant: "default",
          duration: 7000,
        });
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      let descriptiveError = error.response?.data?.message || error.message || "There was a problem signing up with Google.";
      if (descriptiveError.toLowerCase().includes("account pending approval")) {
        descriptiveError = `Welcome! Your account (found via Google) is pending administrative approval.`;
      }
      toast({
        title: "Google Sign Up Failed",
        description: descriptiveError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!recaptchaSiteKey) {
    return (
      <div className="flex justify-center items-center h-screen min-h-screen">
        <p className="text-red-500 p-4 text-center">
          Error: reCAPTCHA Site Key is not configured.<br />
          Please set the NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable in your .env.local file.
        </p>
      </div>
    );
  }

  return (
    // Wrap with Provider, but don't render the GoogleReCaptcha component itself for this test
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <div className="w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <LogoSimple />
          <h1 className="mt-4 text-2xl font-bold text-cedo-blue">Create an account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign up to get started with CEDO</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 flex items-center justify-center gap-2"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Sign up with Google
            </Button>

            <div className="relative my-4">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-muted-foreground">or continue with email</span>
              </div>
            </div>

            <form onSubmit={onSubmit}>
              <div className="space-y-4">
                {/* Form Items remain the same */}
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="John Doe" autoComplete="name" name="name" value={formData.name} onChange={handleChange} className="pl-10" disabled={isLoading} required /></div></FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="your.email@example.com" type="email" autoComplete="email" name="email" value={formData.email} onChange={handleChange} className="pl-10" disabled={isLoading} required /></div></FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Organization Name <span className="text-xs text-muted-foreground">(Optional for some roles)</span></FormLabel>
                  <FormControl><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Your organization name" name="organization" value={formData.organization} onChange={handleChange} className="pl-10" disabled={isLoading} /></div></FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Organization Type <span className="text-xs text-muted-foreground">(Optional for some roles)</span></FormLabel>
                  <Select onValueChange={(value) => handleSelectChange("organizationType", value)} value={formData.organizationType} disabled={isLoading}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select organization type" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="internal">Internal (City Hall Department)</SelectItem><SelectItem value="external">External (Institution/Company)</SelectItem></SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="••••••••" type={showPassword ? "text" : "password"} autoComplete="new-password" name="password" value={formData.password} onChange={handleChange} className="pl-10" disabled={isLoading} required /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} <span className="sr-only">Toggle password visibility</span></Button></div></FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="••••••••" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="pl-10" disabled={isLoading} required /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} <span className="sr-only">Toggle confirm password visibility</span></Button></div></FormControl>
                  <FormMessage />
                </FormItem>

                {/* The GoogleReCaptcha component itself is commented out for this test */}
                {/* <div className="flex justify-center my-4">
                  <GoogleReCaptcha
                    onVerify={handleCaptchaVerify}
                    onErrored={handleCaptchaError}
                    onExpired={handleCaptchaExpired}
                  />
                </div> */}
                <div className="my-4 text-center text-sm text-gray-500">
                  (reCAPTCHA component temporarily removed for build test)
                </div>


                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={formData.agreeTerms} onCheckedChange={(checked) => handleSelectChange("agreeTerms", !!checked)} disabled={isLoading} id="agreeTerms" />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="agreeTerms" className="text-sm font-normal">
                      I agree to the{" "}
                      <Link href="/terms" className="text-cedo-blue hover:underline">terms of service</Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-cedo-blue hover:underline">privacy policy</Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>

                <Button type="submit" className="w-full bg-cedo-blue hover:bg-cedo-blue/90" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-cedo-blue font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </GoogleReCaptchaProvider>
  );
}
