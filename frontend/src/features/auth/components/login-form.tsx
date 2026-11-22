"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../hooks/use-auth";
import { Cloud, Lock, User, AlertCircle, Eye, EyeOff, ArrowLeft, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { toast } from "sonner";

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    username: z.string().min(1, t("usernameRequired")),
    password: z.string().min(1, t("passwordRequired")),
  });

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export function LoginForm() {
  const tAuth = useTranslations("Auth");
  const tVal = useTranslations("Validation");
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(tVal)),
    defaultValues: {
      username: "admin_user",
      password: "SecretPassword123!",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    try {
      setFormError(null);
      await login(values);
      toast.success(tAuth("loginSuccess"));
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message || tAuth("loginError"));
        toast.error(err.message || tAuth("loginError"));
      } else {
        setFormError(tAuth("loginError"));
        toast.error(tAuth("loginError"));
      }
    }
  };

  const handleSelectRole = (username: string) => {
    setValue("username", username, { shouldValidate: true });
    setValue("password", "SecretPassword123!", { shouldValidate: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20 relative">
      <div className="absolute top-4 start-4 flex items-center">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{tAuth("backToHome")}</span>
          </Link>
        </Button>
      </div>

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
            <CardTitle className="text-base font-semibold">{tAuth("cardTitle")}</CardTitle>
            <CardDescription className="text-xs">
              {tAuth("cardDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Quick role selection badge buttons */}
            <div className="mb-4 p-2.5 rounded-lg border border-border bg-muted/40">
              <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                {tAuth("loginAs")}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1.5 h-8 font-normal"
                  onClick={() => handleSelectRole("admin_user")}
                >
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>{tAuth("adminRole")}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1.5 h-8 font-normal"
                  onClick={() => handleSelectRole("operator_user")}
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{tAuth("operatorRole")}</span>
                </Button>
              </div>
            </div>

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
                    type={showPassword ? "text" : "password"}
                    placeholder={tAuth("passwordPlaceholder")}
                    className="ps-9 pe-9"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute end-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                    title={showPassword ? tAuth("hidePassword") : tAuth("showPassword")}
                    data-testid="toggle-password-visibility-btn"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
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
