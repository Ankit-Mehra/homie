import { useEffect, useState, type PropsWithChildren } from "react";
import { ActivityIndicator, AppState, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Button, Field, styles } from "../ui/primitives";
import { api } from "../api/client";
import { devAuth, supabase } from "./supabase";

function Frame({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.heading}>homie●</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SignIn() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const login = useMutation({
    mutationFn: async () => {
      setMessage("");
      if (!supabase) throw new Error("Sign-in is not configured.");
      const credentials = { email: email.trim(), password };
      const result = signup
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (signup && !result.data.session) {
        setMessage(
          "Check your email to confirm your account, then return here and sign in.",
        );
        setSignup(false);
        setPassword("");
      }
    },
  });
  return (
    <Frame>
      <Text style={styles.title}>
        {signup ? "A home for your things." : "Welcome home."}
      </Text>
      <Text style={styles.body}>
        {signup
          ? "Create an account to start looking after your home."
          : "Sign in to your household."}
      </Text>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={signup ? "new-password" : "current-password"}
      />
      {signup && <Text style={styles.body}>Use at least 8 characters.</Text>}
      {message && (
        <Text accessibilityRole="alert" style={styles.body}>
          {message}
        </Text>
      )}
      {login.error && (
        <Text accessibilityRole="alert" style={styles.body}>
          {login.error.message}
        </Text>
      )}
      <Button
        title={
          login.isPending
            ? "Please wait…"
            : signup
              ? "Create account"
              : "Sign in"
        }
        disabled={
          login.isPending || !email.trim() || password.length < (signup ? 8 : 1)
        }
        onPress={() => login.mutate()}
      />
      <Button
        title={
          signup
            ? "Already have an account? Sign in"
            : "New here? Create an account"
        }
        disabled={login.isPending}
        onPress={() => {
          setSignup(!signup);
          login.reset();
          setMessage("");
        }}
      />
    </Frame>
  );
}

export function SignOut() {
  const logout = useMutation({
    mutationFn: async () => {
      const result = await supabase?.auth.signOut({ scope: "local" });
      if (result?.error) throw result.error;
    },
  });
  if (devAuth) return null;
  return (
    <>
      <Button
        title={logout.isPending ? "Signing out…" : "Sign out"}
        disabled={logout.isPending}
        onPress={() => logout.mutate()}
      />
      {logout.error && (
        <Text accessibilityRole="alert" style={styles.body}>
          {logout.error.message}
        </Text>
      )}
    </>
  );
}

function Onboarding({ children }: PropsWithChildren) {
  const profile = useQuery({
    queryKey: ["me"],
    queryFn: async ({ signal }) => {
      const { data } = await api.GET("/v1/me", { signal });
      if (!data) throw new Error("Could not load your household.");
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.POST("/v1/me/household");
      if (!data) throw new Error("Could not create your household.");
      return data;
    },
    onSuccess: () => profile.refetch(),
  });
  if (profile.isPending)
    return (
      <Frame>
        <ActivityIndicator accessibilityLabel="Loading your household" />
      </Frame>
    );
  if (profile.isError)
    return (
      <Frame>
        <Text accessibilityRole="alert" style={styles.body}>
          {profile.error.message}
        </Text>
        <Button title="Try again" onPress={() => void profile.refetch()} />
        <SignOut />
      </Frame>
    );
  if (!profile.data.household_id)
    return (
      <Frame>
        <Text style={styles.title}>Make yourself at home.</Text>
        <Text style={styles.body}>
          Create your household to keep your items and their details together.
        </Text>
        {create.error && (
          <Text accessibilityRole="alert" style={styles.body}>
            {create.error.message}
          </Text>
        )}
        <Button
          title={create.isPending ? "Creating…" : "Create my household"}
          disabled={create.isPending}
          onPress={() => create.mutate()}
        />
        <SignOut />
      </Frame>
    );
  return children;
}

function AccountScope({ children }: PropsWithChildren) {
  // Each identity gets its own cache; old in-flight requests cannot populate a new account.
  const [cache] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1 }, mutations: { retry: 0 } },
      }),
  );
  useEffect(
    () => () => {
      void cache.cancelQueries();
      cache.clear();
    },
    [cache],
  );
  return (
    <QueryClientProvider client={cache}>
      <Onboarding>{children}</Onboarding>
    </QueryClientProvider>
  );
}

export function AuthGate({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!devAuth);
  const [error, setError] = useState("");
  useEffect(() => {
    if (devAuth || !supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next);
        setLoading(false);
        setError("");
      }
    });
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (active && error) {
          setError(error.message);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not restore your session. Please sign in again.");
          setLoading(false);
        }
      });
    const refresh = (state: string) => {
      if (state === "active") supabase!.auth.startAutoRefresh();
      else supabase!.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState);
    const listener = AppState.addEventListener("change", refresh);
    return () => {
      active = false;
      subscription.unsubscribe();
      listener.remove();
      supabase!.auth.stopAutoRefresh();
    };
  }, []);
  if (devAuth) return <AccountScope key="development">{children}</AccountScope>;
  if (!supabase)
    return (
      <Frame>
        <Text style={styles.title}>Sign-in setup needed.</Text>
        <Text style={styles.body}>
          Configure the Supabase URL and public anon key, then restart the app.
        </Text>
      </Frame>
    );
  if (loading)
    return (
      <Frame>
        <ActivityIndicator accessibilityLabel="Restoring your session" />
      </Frame>
    );
  if (!session)
    return (
      <>
        <SignIn />
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      </>
    );
  return <AccountScope key={session.user.id}>{children}</AccountScope>;
}
