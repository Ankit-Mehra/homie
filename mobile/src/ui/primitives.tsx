import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import type { PropsWithChildren } from "react";
export const colors = {
  ink: "#243D35",
  muted: "#64736B",
  paper: "#F6F4EC",
  card: "#FFFFFF",
  accent: "#D8EEB8",
  line: "#DFE4DA",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24, gap: 20, paddingBottom: 48 },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -1.2,
  },
  heading: { fontSize: 22, fontWeight: "600", color: colors.ink },
  body: { fontSize: 16, lineHeight: 25, color: colors.muted },
  card: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.card,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  button: {
    backgroundColor: colors.ink,
    padding: 17,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.ink,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: 0.5,
  },
});
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && { opacity: 0.5 }]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
} & TextInputProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
}
