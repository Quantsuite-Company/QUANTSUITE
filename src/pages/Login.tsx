import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Eye, EyeOff, Github, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import quantsuiteLogo from '@/assets/quantsuite-logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/command-center');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0F] via-[#1A1A1E] to-[#0D0D0F] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader className="text-center space-y-4">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img src={quantsuiteLogo} alt="QuantSuite" className="h-10 w-auto" />
            </button>
            <div>
              <CardTitle className="text-2xl text-white">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-white/70">
                {isLogin 
                  ? 'Sign in to your account to continue trading' 
                  : 'Join thousands of traders using QuantSuite'
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="bg-black/40 border-white/20 text-white placeholder-white/40 focus:border-cyan-400/50"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-black/40 border-white/20 text-white placeholder-white/40 focus:border-cyan-400/50 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="bg-black/40 border-white/20 text-white placeholder-white/40 focus:border-cyan-400/50 pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-white/20 bg-black/40" />
                    <span className="text-white/70 text-sm">Remember me</span>
                  </label>
                  <button type="button" className="text-cyan-400 hover:text-cyan-300 text-sm">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="relative">
                <Separator className="bg-white/20" />
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/40 px-2 text-white/60 text-sm">
                  or continue with
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
              </div>
            </div>

            <div className="text-center">
              <span className="text-white/60 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs">
                By continuing, you agree to our{' '}
                <button 
                  onClick={() => navigate('/privacy-policy')} 
                  className="text-cyan-400 hover:underline"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button 
                  onClick={() => navigate('/privacy-policy')} 
                  className="text-cyan-400 hover:underline"
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}