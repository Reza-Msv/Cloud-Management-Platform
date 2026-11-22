"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, LoginCredentials } from "@/services/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";
import { UserProfile } from "@/types";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, setUser, clearAuth } = useAuthStore();

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.isSuccess && meQuery.data) {
      setUser(meQuery.data);
    } else if (meQuery.isError) {
      clearAuth();
    }
  }, [meQuery.isSuccess, meQuery.isError, meQuery.data, setUser, clearAuth]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data: UserProfile) => {
      setUser(data);
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      queryClient.clear();
    },
  });

  const isAdmin = user?.roles?.includes("Admin") || user?.is_superuser === true;
  const isOperator = user?.roles?.includes("Operator");

  return {
    user,
    isAuthenticated: !!user,
    isLoading: meQuery.isPending,
    isAdmin,
    isOperator,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    refetchUser: meQuery.refetch,
  };
}
