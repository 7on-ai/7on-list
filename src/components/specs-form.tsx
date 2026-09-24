"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import * as motion from "motion/react-client";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useI18n } from "@/i18n/provider";
import { readAttribution } from "@/lib/attribution";
import { track } from "@/lib/track";

type FormValues = { email: string };

export function SpecsForm() {
  const { t, locale } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({ defaultValues: { email: "" } });

  async function onSubmit(data: FormValues) {
    form.clearErrors();

    const schema = z.object({
      email: z.string().trim().min(1, t.form.required).email(t.form.invalid),
    });
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      form.setError("email", { type: "manual", message: parsed.error.errors[0]?.message });
      track("form_error", { reason: "invalid" });
      return;
    }
    track("cta_click", { location: "hero" });

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, locale, attribution: readAttribution() }),
      });

      // The API speaks English; the visitor hears their own language.
      if (response.ok) {
        toast.success(t.form.success);
        form.reset();
        track("spec_requested", { locale });
      } else if (response.status === 400 || response.status === 403) {
        form.setError("email", { type: "server", message: t.form.invalid });
        track("form_error", { reason: "rejected" });
      } else {
        toast.error(t.form.error);
        track("form_error", { reason: "server" });
      }
    } catch (error) {
      console.error("Spec request failed:", error);
      toast.error(t.form.error);
      track("form_error", { reason: "network" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <motion.form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative flex w-full flex-col gap-2 sm:flex-row"
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
                  placeholder={t.hero.placeholder}
                  type="email"
                  autoComplete="email"
                  className="h-11 rounded-lg border-transparent bg-transparent px-4 text-base text-[#111] shadow-none placeholder:text-zinc-400 focus-visible:border-transparent focus-visible:ring-0 md:text-sm"
                  aria-label={t.form.emailLabel}
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
              {t.form.sending}
            </>
          ) : (
            <>
              {t.hero.cta}
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </motion.form>
    </Form>
  );
}
