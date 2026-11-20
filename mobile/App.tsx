import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthGate, SignOut } from "./src/auth/AuthGate";
import { Button, Card, colors, styles } from "./src/ui/primitives";
import { Item, useInventory } from "./src/features/inventory/hooks";
import { AddItem, ItemDetail } from "./src/features/inventory/screens";
const authCache = new QueryClient();
function Household() {
  const [screen, setScreen] = useState<
    "home" | "inventory" | "add" | "detail" | "help"
  >("home");
  const [selected, setSelected] = useState<Item>();
  const inventory = useInventory();
  const items = inventory.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[styles.heading, { letterSpacing: -1 }]}>
            homie<Text style={{ color: "#719449" }}>●</Text>
          </Text>
          <Text style={styles.label}>YOUR HOUSEHOLD</Text>
        </View>
        {screen !== "home" && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setScreen("home")}
          >
            <Text style={styles.body}>← Back home</Text>
          </Pressable>
        )}
        {screen === "add" ? (
          <AddItem
            onSaved={(item) => {
              setSelected(item);
              setScreen("detail");
            }}
          />
        ) : screen === "detail" && selected ? (
          <ItemDetail key={selected.id} item={selected} />
        ) : screen === "help" ? (
          <>
            <Text style={styles.title}>A little help at home.</Text>
            <Card>
              <Text style={styles.body}>
                Conversational troubleshooting is not connected yet. Start by
                adding your item and confirming its model.
              </Text>
              <Button title="Add an item" onPress={() => setScreen("add")} />
            </Card>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {screen === "home"
                ? "A little care.\nA happier home."
                : "Things you call yours."}
            </Text>
            <Text style={styles.body}>
              Your things, their stories, and what they need next.
            </Text>
            {screen === "home" && (
              <>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.accent, borderWidth: 0 },
                  ]}
                >
                  <Text style={styles.heading}>Something not quite right?</Text>
                  <Text style={styles.body}>
                    Let’s start with the thing that needs a little attention.
                  </Text>
                  <Button
                    title="Ask for help ↗"
                    onPress={() => setScreen("help")}
                  />
                </View>
                <Card>
                  <Text style={styles.label}>UPCOMING CARE</Text>
                  <Text style={styles.heading}>Room to breathe.</Text>
                  <Text style={styles.body}>
                    No active reminders. You’ll review and approve any proposed
                    schedule first.
                  </Text>
                </Card>
              </>
            )}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.heading}>Your things</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setScreen("add")}
              >
                <Text style={styles.label}>＋ Add item</Text>
              </Pressable>
            </View>
            {inventory.isPending ? (
              <ActivityIndicator accessibilityLabel="Loading your items" />
            ) : inventory.isError ? (
              <Card>
                <Text accessibilityRole="alert" style={styles.body}>
                  {inventory.error.message}
                </Text>
                <Button
                  title="Try again"
                  onPress={() => void inventory.refetch()}
                />
              </Card>
            ) : items.length === 0 ? (
              <Card>
                <Text style={styles.heading}>Every home has a first.</Text>
                <Text style={styles.body}>
                  Add your coffee maker, your vacuum, or the appliance you
                  always mean to look after.
                </Text>
                <Button
                  title="Add your first item"
                  onPress={() => setScreen("add")}
                />
              </Card>
            ) : (
              items.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}
                  onPress={() => {
                    setSelected(item);
                    setScreen("detail");
                  }}
                >
                  <Card>
                    <Text style={styles.label}>{item.room || "YOUR HOME"}</Text>
                    <Text style={styles.heading}>{item.name}</Text>
                    <Text style={styles.body}>
                      {item.brand} · {item.model} →
                    </Text>
                  </Card>
                </Pressable>
              ))
            )}
            {inventory.hasNextPage && (
              <Button
                title="Load more"
                disabled={inventory.isFetchingNextPage}
                onPress={() => void inventory.fetchNextPage()}
              />
            )}
          </>
        )}
        <SignOut />
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          padding: 18,
          gap: 32,
          justifyContent: "center",
          borderTopWidth: 1,
          borderColor: colors.line,
        }}
      >
        {(["home", "inventory"] as const).map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: screen === tab }}
            onPress={() => setScreen(tab)}
          >
            <Text style={styles.label}>
              {tab === "home" ? "⌂  Home" : "▤  Inventory"}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={authCache}>
        <AuthGate>
          <Household />
        </AuthGate>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
