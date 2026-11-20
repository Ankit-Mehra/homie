import { fireEvent, render, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text } from "react-native";
import { AuthGate, SignIn, SignOut } from "./AuthGate";
import { supabase } from "./supabase";
import { api } from "../api/client";

jest.mock("./supabase", () => ({
  devAuth: false,
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

function wrap(node: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {node}
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it("shows confirmation instructions when signup returns no session", async () => {
  (supabase!.auth.signUp as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  const view = wrap(<SignIn />);
  fireEvent.press(view.getByText("New here? Create an account"));
  fireEvent.changeText(view.getByLabelText("Email"), " person@example.com ");
  fireEvent.changeText(view.getByLabelText("Password"), "long-password");
  fireEvent.press(view.getByText("Create account"));
  await waitFor(() => expect(view.getByText(/Check your email/)).toBeTruthy());
  expect(supabase!.auth.signUp).toHaveBeenCalledWith({
    email: "person@example.com",
    password: "long-password",
  });
  expect(view.getByLabelText("Password").props.value).toBe("");
});

it("keeps failed sign-in on screen and lets the user retry", async () => {
  (supabase!.auth.signInWithPassword as jest.Mock).mockResolvedValue({
    error: new Error("Invalid login credentials"),
  });
  const view = wrap(<SignIn />);
  fireEvent.changeText(view.getByLabelText("Email"), "person@example.com");
  fireEvent.changeText(view.getByLabelText("Password"), "password");
  fireEvent.press(view.getByText("Sign in"));
  await waitFor(() =>
    expect(view.getByText("Invalid login credentials")).toBeTruthy(),
  );
  expect(view.getByLabelText("Email").props.value).toBe("person@example.com");
});

it("gates inventory behind onboarding and removes it on sign-out", async () => {
  let notify: (event: string, session: unknown) => void = () => {};
  (supabase!.auth.onAuthStateChange as jest.Mock).mockImplementation(
    (callback) => {
      notify = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    },
  );
  (supabase!.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  const get = jest.spyOn(api, "GET").mockResolvedValue({
    data: { user_id: "a", household_id: null },
    response: new Response(),
  } as never);
  const post = jest.spyOn(api, "POST").mockResolvedValue({
    data: { user_id: "a", household_id: "home-a" },
    response: new Response(),
  } as never);
  const view = wrap(
    <AuthGate>
      <Text>Private inventory</Text>
      <SignOut />
    </AuthGate>,
  );
  act(() => notify("SIGNED_IN", { user: { id: "a" } }));
  await waitFor(() =>
    expect(view.getByText("Create my household")).toBeTruthy(),
  );
  expect(view.queryByText("Private inventory")).toBeNull();
  get.mockResolvedValue({
    data: { user_id: "a", household_id: "home-a" },
    response: new Response(),
  } as never);
  fireEvent.press(view.getByText("Create my household"));
  await waitFor(() => expect(view.getByText("Private inventory")).toBeTruthy());
  expect(post).toHaveBeenCalledWith("/v1/me/household");
  (supabase!.auth.signOut as jest.Mock).mockImplementation(async () => {
    notify("SIGNED_OUT", null);
    return { error: null };
  });
  fireEvent.press(view.getByText("Sign out"));
  await waitFor(() => expect(view.getByText("Sign in")).toBeTruthy());
  expect(view.queryByText("Private inventory")).toBeNull();
  get.mockResolvedValue({
    data: { user_id: "b", household_id: null },
    response: new Response(),
  } as never);
  act(() => notify("SIGNED_IN", { user: { id: "b" } }));
  await waitFor(() =>
    expect(view.getByText("Create my household")).toBeTruthy(),
  );
  expect(view.queryByText("Private inventory")).toBeNull();
});
