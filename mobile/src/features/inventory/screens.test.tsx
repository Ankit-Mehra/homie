import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddItem, ItemDetail } from "./screens";
import { api } from "../../api/client";
import type { Item } from "./hooks";

const item: Item = {
  id: "one",
  name: "Vacuum",
  brand: "Dyson",
  model: "V8",
  category: "Appliance",
  room: "Hall",
  model_confirmed: false,
};
function wrap(node: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { retry: false, gcTime: Infinity },
          },
        })
      }
    >
      {node}
    </QueryClientProvider>,
  );
}
afterEach(() => jest.restoreAllMocks());
it("keeps an unsuccessful save on the form and offers a retry", async () => {
  jest.spyOn(api, "POST").mockRejectedValue(new Error("Connection lost"));
  const saved = jest.fn();
  const view = wrap(<AddItem onSaved={saved} />);
  fireEvent.changeText(view.getByLabelText("Item name"), "Vacuum");
  fireEvent.changeText(view.getByLabelText("Brand"), "Dyson");
  fireEvent.changeText(view.getByLabelText("Model number"), "V8");
  fireEvent.press(view.getByText("Add to your home"));
  await waitFor(() => expect(view.getByText("Connection lost")).toBeTruthy());
  expect(saved).not.toHaveBeenCalled();
  expect(view.getByLabelText("Item name").props.value).toBe("Vacuum");
  expect(view.getByText("Add to your home")).toBeTruthy();
});
it("does not request research before model confirmation", () => {
  const post = jest.spyOn(api, "POST");
  const view = wrap(<ItemDetail item={item} />);
  fireEvent.press(view.getByText("Find documentation"));
  expect(post).not.toHaveBeenCalled();
});

it("saves an item and opens the returned item", async () => {
  const post = jest
    .spyOn(api, "POST")
    .mockResolvedValue({ data: item, response: new Response() } as never);
  const saved = jest.fn();
  const view = wrap(<AddItem onSaved={saved} />);
  fireEvent.changeText(view.getByLabelText("Item name"), "Vacuum");
  fireEvent.changeText(view.getByLabelText("Brand"), "Dyson");
  fireEvent.changeText(view.getByLabelText("Model number"), "V8");
  fireEvent.changeText(view.getByLabelText("Room (optional)"), "Hall");
  fireEvent.press(view.getByText("Add to your home"));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(saved.mock.calls[0][0]).toEqual(item);
  expect(post).toHaveBeenCalledWith("/v1/items", {
    body: {
      name: "Vacuum",
      brand: "Dyson",
      model: "V8",
      category: "Appliance",
      room: "Hall",
    },
  });
});
