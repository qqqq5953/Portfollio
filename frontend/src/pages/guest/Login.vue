<script setup lang="ts">
import { useForm } from "vee-validate";
import { supabase } from "@/lib/supabase";
import { toTypedSchema } from "@vee-validate/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    email: "",
    password: "",
  },
});

const onSubmit = handleSubmit(
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Login error:", error.message);
    } else {
      console.log("User:", data.user);
    }
  }
);

const getURL = () => {
  let url =
    import.meta.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    import.meta.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.startsWith("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
};

const loginWithGoogle = async () => {
  const redirectTo = `${window.location.origin}/auth/callback`;
  console.log("redirectTo", redirectTo);

  const url = getURL();
  console.log("url", url);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo,
    },
  });
  console.log("data", data);
  if (error) {
    console.error("OAuth error:", error.message);
  }
};
</script>

<template>
  <div class="flex justify-center items-center h-screen w-screen">
    <Card class="w-full md:w-1/2 max-w-md">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit" class="space-y-6">
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Password"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <Button type="submit" class="w-full">Submit</Button>
          <div class="text-center">or</div>
          <Button
            type="button"
            variant="outline"
            class="w-full"
            @click="loginWithGoogle"
          >
            Login with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
