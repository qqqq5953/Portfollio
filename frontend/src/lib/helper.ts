import { supabase } from "@/lib/supabase";

type CallEdgeFunctionOptions = {
  name: string;
  body?: any;
};

type EdgeFunctionResponse<T> = {
  data: T | null;
  error: {
    msg: string;
  };
};

export async function callEdgeFunction<T = any>({
  name,
  body,
}: CallEdgeFunctionOptions): Promise<EdgeFunctionResponse<T>> {
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
        return { data: null, error: { msg: errorBody } };
      }

      const response: EdgeFunctionResponse<T> = await res.json();
      // Unwrap the nested structure from jsonResponse
      return { data: response.data, error: response.error };
    } catch (error) {
      return { data: null, error: { msg: "Unknown error" } };
    }
  } else {
    const { data, error } = await supabase.functions.invoke<T>(name, {
      body,
    });
    
    if (error) {
      return { data: null, error };
    }

    return { data, error };
  }
}

export const debounce = (
  func: Function,
  wait: number,
  getCurrentValue?: () => string | undefined
) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);

      if (getCurrentValue) {
        const currentValue = getCurrentValue();
        if (!currentValue || currentValue.length === 0) return;
      }
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};