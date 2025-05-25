'use client';

import { useFormState } from 'react-dom';
import { login, signup } from './actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EyeIcon, EyeOffIcon, KeyIcon, MailIcon, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientWrapper } from '@/components/ClientWrapper';

type AuthState = { error?: string; message?: string; loading?: boolean } | null;

export default function LoginPage() {
  return (
    <ClientWrapper>
      <LoginPageContent />
    </ClientWrapper>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message');
  const error = searchParams.get('error');
  const verified = searchParams.get('verified');
  const redirectTo = searchParams.get('redirectTo');
  const initialTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Form states
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);
  
  // Form validation states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Server action state
  const [loginState, loginAction] = useFormState(login, null);
  const [signupState, signupAction] = useFormState(signup, null);

  // Validate email function
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!regex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  // Validate password function
  const validatePassword = (password: string, isSignup = false) => {
    if (!password) return 'Password is required';
    if (isSignup && password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  // Handle login submit with validation
  const handleLoginSubmit = (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setEmailError(emailError);
      setPasswordError(passwordError);
      return;
    }
    
    setIsLoginSubmitting(true);
    loginAction(formData);
  };

  // Handle signup submit with validation
  const handleSignupSubmit = (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, true);
    
    if (emailError || passwordError) {
      setEmailError(emailError);
      setPasswordError(passwordError);
      return;
    }
    
    setIsSignupSubmitting(true);
    signupAction(formData);
  };

  // Message handling
  useEffect(() => {
    if (message) {
      toast.error(message);
    }
    if (error) {
      toast.error(error);
    }
    if (verified) {
      toast.success('Email verified successfully! You can now log in.');
    }
  }, [message, error, verified]);

  // Login state handling
  useEffect(() => {
    if (loginState?.error) {
      toast.error(loginState.error);
      setIsLoginSubmitting(false);
    }
    if (loginState?.message) {
      toast.success(loginState.message);
      setIsLoginSubmitting(false);
    }
  }, [loginState]);

  // Signup state handling
  useEffect(() => {
    if (signupState?.error) {
      toast.error(signupState.error);
      setIsSignupSubmitting(false);
    }
    if (signupState?.message) {
      toast.success(signupState.message);
      setIsSignupSubmitting(false);
      // Auto-switch to login tab after successful signup
      setTimeout(() => setActiveTab('login'), 1500);
    }
  }, [signupState]);

  // Form validation for login
  useEffect(() => {
    if (loginEmail) setEmailError(validateEmail(loginEmail));
  }, [loginEmail]);
  
  useEffect(() => {
    if (loginPassword) setPasswordError(validatePassword(loginPassword));
  }, [loginPassword]);

  // Password strength indicator logic
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    
    return { 
      strength, 
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || ''
    };
  };

  const passwordStrength = getPasswordStrength(signupPassword);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md opacity-0 animate-fadeIn">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <KeyIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Odzai Budget</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form action={handleLoginSubmit} className="space-y-4">
                  <input type="hidden" name="redirectTo" value={redirectTo || ''} />
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email
                    </Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={`pl-10 ${emailError && loginEmail ? 'border-red-500' : ''}`}
                        disabled={isLoginSubmitting}
                        autoComplete="email"
                        aria-invalid={!!emailError}
                        required
                      />
                    </div>
                    {emailError && loginEmail && (
                      <p className="text-sm text-red-500">{emailError}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs"
                        onClick={() => router.push('/forgot-password')}
                        type="button"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative">
                      <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={`pl-10 ${passwordError && loginPassword ? 'border-red-500' : ''}`}
                        disabled={isLoginSubmitting}
                        autoComplete="current-password"
                        aria-invalid={!!passwordError}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        disabled={isLoginSubmitting}
                      >
                        {showLoginPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showLoginPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    {passwordError && loginPassword && (
                      <p className="text-sm text-red-500">{passwordError}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoginSubmitting}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </label>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoginSubmitting}>
                    {isLoginSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form action={handleSignupSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">
                      Email
                    </Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        disabled={isSignupSubmitting}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        disabled={isSignupSubmitting}
                        autoComplete="new-password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        disabled={isSignupSubmitting}
                      >
                        {showSignupPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showSignupPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    
                    {signupPassword && (
                      <div className="space-y-2 mt-2">
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>Password strength:</span>
                          <span className={passwordStrength.strength > 0 ? `text-${passwordStrength.color.split('-')[1]}-600` : ''}>
                            {passwordStrength.label || 'None'}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                          />
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                          <li className={signupPassword.length >= 8 ? "text-green-600" : ""}>
                            • At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(signupPassword) ? "text-green-600" : ""}>
                            • At least one uppercase letter
                          </li>
                          <li className={/[0-9]/.test(signupPassword) ? "text-green-600" : ""}>
                            • At least one number
                          </li>
                          <li className={/[^A-Za-z0-9]/.test(signupPassword) ? "text-green-600" : ""}>
                            • At least one special character
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSignupSubmitting}>
                    {isSignupSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t pt-4">
            <p className="text-center text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/terms')}>
                Terms of Service
              </Button>{" "}
              and{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/privacy')}>
                Privacy Policy
              </Button>
              .
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Social proof or testimonials */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Trusted by thousands of users worldwide</p>
        <div className="flex justify-center space-x-4">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <img src="/logos/logo1.svg" alt="Logo" className="h-6 w-auto opacity-50" />
          </div>
          <div className="bg-white p-2 rounded-full shadow-sm">
            <img src="/logos/logo2.svg" alt="Logo" className="h-6 w-auto opacity-50" />
          </div>
          <div className="bg-white p-2 rounded-full shadow-sm">
            <img src="/logos/logo3.svg" alt="Logo" className="h-6 w-auto opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
} 