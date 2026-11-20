import { useState } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { Button, Card, Field, styles } from "../../ui/primitives";
import { Item, useAddItem, useConfirm, useJob, useResearch } from "./hooks";
export function AddItem({ onSaved }: { onSaved: (item: Item) => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState("Appliance");
  const mutation = useAddItem();
  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.title}>Make yourself at home.</Text>
      <Text style={styles.body}>
        Start with one thing you own. You’ll confirm its model before we look
        for documentation.
      </Text>
      <Field label="Item name" value={name} onChangeText={setName} />
      <Field label="Brand" value={brand} onChangeText={setBrand} />
      <Field label="Model number" value={model} onChangeText={setModel} />
      <Field label="Category" value={category} onChangeText={setCategory} />
      <Field label="Room (optional)" value={room} onChangeText={setRoom} />
      {mutation.error && (
        <Text accessibilityRole="alert" style={styles.body}>
          {mutation.error.message}
        </Text>
      )}
      <Button
        title={mutation.isPending ? "Saving…" : "Add to your home"}
        disabled={
          mutation.isPending ||
          ![name, brand, model, category].every((v) => v.trim())
        }
        onPress={() =>
          mutation.mutate(
            { name, brand, model, category, room },
            { onSuccess: onSaved },
          )
        }
      />
      <Text style={styles.body}>
        Photo identification is coming in the next build.
      </Text>
    </View>
  );
}
export function ItemDetail({ item }: { item: Item }) {
  const confirm = useConfirm(item.id);
  const research = useResearch(item.id);
  const job = useJob(research.data?.id);
  const confirmed = item.model_confirmed || confirm.isSuccess;
  return (
    <View style={{ gap: 20 }}>
      <Text style={styles.label}>
        {item.room.toUpperCase() || "YOUR HOME"} · {item.category.toUpperCase()}
      </Text>
      <Text style={styles.title}>{item.name}</Text>
      <Card>
        <Text style={styles.heading}>
          {item.brand} {item.model}
        </Text>
        <Text style={styles.body}>
          {confirmed
            ? "Model confirmed by you."
            : "Check the model number against the label on your item."}
        </Text>
        {!confirmed && (
          <Button
            title={confirm.isPending ? "Confirming…" : "Yes, this is my model"}
            disabled={confirm.isPending}
            onPress={() => confirm.mutate()}
          />
        )}
      </Card>
      <Card>
        <Text style={styles.heading}>Documentation</Text>
        <Text style={styles.body}>
          Official guidance starts with an exact model match. No manual has been
          retrieved for this item.
        </Text>
        <Button
          title={research.isPending ? "Requesting…" : "Find documentation"}
          disabled={!confirmed || research.isPending}
          onPress={() => research.mutate()}
        />
        {job.data && <Text style={styles.body}>{job.data.detail}</Text>}
        {job.isFetching && (
          <ActivityIndicator accessibilityLabel="Checking research status" />
        )}
      </Card>
      {[confirm.error, research.error, job.error]
        .filter(Boolean)
        .map((error, i) => (
          <Text key={i} accessibilityRole="alert" style={styles.body}>
            {error?.message}
          </Text>
        ))}
      {job.isError && (
        <Button title="Retry status" onPress={() => void job.refetch()} />
      )}
      <Card>
        <Text style={styles.heading}>Care & service history</Text>
        <Text style={styles.body}>
          No service records yet. Schedule review and confirmed history
          recording are in the next milestone.
        </Text>
      </Card>
    </View>
  );
}
