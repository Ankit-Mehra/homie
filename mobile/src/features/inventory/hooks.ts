import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, failure } from "../../api/client";
import type { components } from "../../api/schema";
export type Item = components["schemas"]["ItemRead"];
export type ItemInput = components["schemas"]["ItemCreate"];
export function useInventory() {
  return useInfiniteQuery({
    queryKey: ["items"],
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const { data, error } = await api.GET("/v1/items", {
        params: { query: { offset: pageParam, limit: 20 } },
        signal,
      });
      if (error || !data) throw failure();
      return data;
    },
    getNextPageParam: (page) => page.next_offset ?? undefined,
  });
}
export function useAddItem() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (body: ItemInput) => {
      const { data, error } = await api.POST("/v1/items", { body });
      if (error || !data) throw failure();
      return data;
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ["items"] }),
  });
}
export function useConfirm(itemId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST(
        "/v1/items/{item_id}/confirm-model",
        { params: { path: { item_id: itemId } } },
      );
      if (error || !data) throw failure();
      return data;
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ["items"] }),
  });
}
export function useResearch(itemId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/v1/items/{item_id}/research", {
        params: { path: { item_id: itemId } },
      });
      if (error || !data) throw failure();
      return data;
    },
  });
}
export function useJob(id?: string) {
  return useQuery({
    queryKey: ["research", id],
    enabled: !!id,
    queryFn: async ({ signal }) => {
      const { data, error } = await api.GET("/v1/research/{job_id}", {
        params: { path: { job_id: id! } },
        signal,
      });
      if (error || !data) throw failure();
      return data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === "queued" ? 2000 : false,
  });
}
