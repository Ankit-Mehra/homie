import { fireEvent, render } from "@testing-library/react-native";
import { Button } from "./primitives";
it("blocks duplicate submissions while pending", () => {
  const onPress = jest.fn();
  const view = render(<Button title="Saving" disabled onPress={onPress} />);
  fireEvent.press(view.getByRole("button"));
  expect(onPress).not.toHaveBeenCalled();
});
