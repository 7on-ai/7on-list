"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import * as motion from "motion/react-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ArrowRight, Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z
    .string({ required_error: "Email address is required." })
    .email("Please enter a valid email address."),
});

type FormValues = z.infer<typeof formSchema>;

export function WaitlistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    form.clearErrors(); // clear errors

    const validationResult = formSchema.safeParse(data);

    if (!validationResult.success) {
      validationResult.error.errors.forEach((error) => {
        form.setError(error.path[0] as keyof FormValues, {
          type: "manual",
          message: error.message,
        });
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      });

      let responseBody = {};
      try {
        // 204
        const text = await response.text();
        if (text) {
          responseBody = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("Failed to parse response body:", parseError);
        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${
              response.statusText || "Request failed"
            }`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          (responseBody as { message?: string })?.message ||
            `Request failed with status: ${response.status}`
        );
      }

      toast.success(
        (responseBody as { message?: string })?.message ||
          "You're on the list. We'll be in touch."
      );
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <motion.form
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative flex w-full max-w-md flex-col gap-2 sm:flex-row"
        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2, delay: 0.7, type: "spring", bounce: 0 }}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  placeholder="you@email.com"
                  type="email"
                  autoComplete="email"
                  className="h-11 rounded-lg border-transparent bg-transparent px-4 text-base text-[#111] shadow-none placeholder:text-zinc-400 focus-visible:border-transparent focus-visible:ring-0 md:text-sm"
                  aria-label="Email address for waitlist"
                  aria-invalid={!!form.formState.errors.email}
                  {...field}
                />
              </FormControl>
              <FormMessage className="absolute -bottom-8 left-2 text-xs text-[#C41D3B]" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="group h-11 shrink-0 rounded-lg bg-[#111] px-5 font-medium text-white hover:bg-black"
          aria-live="polite"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Claim your machine
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </motion.form>
    </Form>
  );
}
