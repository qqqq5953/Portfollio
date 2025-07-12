import { supabase } from "@/lib/supabase";

type CallEdgeFunctionOptions = {
  name: string;
  body?: any;
};

export async function callEdgeFunction<T = any>({
  name,
  body,
}: CallEdgeFunctionOptions): Promise<{ data: T | null; error: any }> {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    try {
      const res = await fetch(`http://localhost:54321/functions/v1/${name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_LOCAL_ACCESS_TOKEN}`
        },
        body: JSON.stringify(body ?? {}),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return { data: null, error: { status: res.status, message: errorBody } };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  } else {
    const { data, error } = await supabase.functions.invoke<T>(name, {
      body,
    });
    return { data, error };
  }
}
