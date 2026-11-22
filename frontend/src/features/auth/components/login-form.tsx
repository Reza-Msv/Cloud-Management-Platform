"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../hooks/use-auth";
import { Cloud, Lock, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    try {
      setFormError(null);
      await login(values);
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message || tAuth("loginError"));
      } else {
        setFormError(tAuth("loginError"));
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-3">
            <Cloud className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {tAuth("title")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {tAuth("subtitle")}
          </p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base font-semibold">Account Sign In</CardTitle>
            <CardDescription className="text-xs">
              Direct session authentication with Core API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <div
                role="alert"
                className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  {tAuth("username")}
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder={tAuth("usernamePlaceholder")}
                    className="ps-9"
                    error={errors.username?.message}
                    {...register("username")}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  {tAuth("password")}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={tAuth("passwordPlaceholder")}
                    className="ps-9"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 font-medium"
                data-testid="login-submit-btn"
              >
                {isLoggingIn ? tAuth("signingIn") : tAuth("signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
