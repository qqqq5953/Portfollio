<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { z } from "zod";
import { ref, computed } from "vue";

import {
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from "@internationalized/date";
import { toDate } from "reka-ui/date";

const df = new DateFormatter("en-US", {
  dateStyle: "long",
});
const placeholder = ref();

const formSchema = z.object({
  symbol: z.string().min(1, "Symbol is required."),
  share: z
    .number({ required_error: "Share is required." })
    .min(1, "Share must be at least 1"),
  price: z
    .number({ required_error: "Price is required." })
    .min(1, "Price must be at least 1"),
  transectionType: z.enum(["buy", "sell"]),
  currency: z.enum(["USD", "TWD"]),
  date: z.string().min(1, "Date is required."),
  fee: z.number().optional(),
  tax: z.number().optional(),
  note: z.string().optional(),
});

const { handleSubmit, values, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    symbol: "",
    share: undefined,
    price: undefined,
    transectionType: "buy",
    currency: "USD",
    date: today(getLocalTimeZone()).toString(),
    fee: undefined,
    tax: undefined,
    note: "",
  },
});

const dateValue = computed({
  get: () => (values.date ? parseDate(values.date) : undefined),
  set: (val) => val,
});

const onSubmit = handleSubmit((values) => {
  console.log(values);
});
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <FormField name="transectionType" v-slot="{ componentField }">
        <FormItem>
          <FormLabel>Type<span class="text-xs text-red-500">*</span></FormLabel>
          <FormControl>
            <RadioGroup class="flex gap-4" v-bind="componentField">
              <FormItem class="flex items-center gap-3">
                <FormControl>
                  <RadioGroupItem value="buy" />
                </FormControl>
                <FormLabel class="font-normal">BUY</FormLabel>
              </FormItem>
              <FormItem class="flex items-center gap-3">
                <FormControl>
                  <RadioGroupItem value="sell" />
                </FormControl>
                <FormLabel class="font-normal">SELL</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      </FormField>

      <FormField name="currency" v-slot="{ componentField }">
        <FormItem>
          <FormLabel
            >Currency<span class="text-xs text-red-500">*</span></FormLabel
          >
          <FormControl>
            <RadioGroup class="flex gap-4" v-bind="componentField">
              <FormItem class="flex items-center gap-3">
                <FormControl>
                  <RadioGroupItem value="USD" />
                </FormControl>
                <FormLabel class="font-normal">USD</FormLabel>
              </FormItem>
              <FormItem class="flex items-center gap-3">
                <FormControl>
                  <RadioGroupItem value="TWD" />
                </FormControl>
                <FormLabel class="font-normal">TWD</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      </FormField>
    </div>

    <FormField name="symbol" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Symbol<span class="text-xs text-red-500">*</span></FormLabel>
        <FormControl>
          <Input placeholder="2330, AAPL, ..." v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="share" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Share<span class="text-xs text-red-500">*</span></FormLabel>
        <FormControl>
          <Input placeholder="1" type="number" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="price" v-slot="{ componentField }">
      <FormItem>
        <FormLabel
          >Price({{ values.currency }})<span class="text-xs text-red-500"
            >*</span
          ></FormLabel
        >
        <FormControl>
          <Input placeholder="100" type="number" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="date">
      <FormItem class="flex flex-col">
        <FormLabel>Date<span class="text-xs text-red-500">*</span></FormLabel>
        <Popover>
          <PopoverTrigger as-child>
            <FormControl>
              <Button
                variant="outline"
                :class="
                  cn(
                    'ps-3 text-start font-normal',
                    !dateValue && 'text-muted-foreground'
                  )
                "
              >
                <span>{{
                  dateValue ? df.format(toDate(dateValue)) : "Pick a date"
                }}</span>
                <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
              </Button>
              <input hidden />
            </FormControl>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <Calendar
              v-model:placeholder="placeholder"
              :model-value="dateValue"
              calendar-label="Transaction Date"
              :min-value="new CalendarDate(1900, 1, 1)"
              :max-value="today(getLocalTimeZone())"
              @update:model-value="
                (v) => {
                  if (v) {
                    setFieldValue('date', v.toString());
                  } else {
                    setFieldValue('date', undefined);
                  }
                }
              "
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    </FormField>

    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger class="text-neutral-500 cursor-pointer py-2"
          >Optional fields</AccordionTrigger
        >
        <AccordionContent class="space-y-6 pt-1 pl-4 pr-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField name="fee" v-slot="{ componentField }">
              <FormItem>
                <FormLabel>Fee({{ values.currency }})</FormLabel>
                <FormControl>
                  <Input
                    placeholder="10"
                    type="number"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField name="tax" v-slot="{ componentField }">
              <FormItem>
                <FormLabel>Tax({{ values.currency }})</FormLabel>
                <FormControl>
                  <Input
                    placeholder="100"
                    type="number"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <FormField name="note" v-slot="{ componentField }">
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write a note to record the transaction"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <div class="flex gap-2 justify-end">
      <Button type="button" variant="outline" @click="resetForm">Cancel</Button>
      <Button type="submit">Submit</Button>
    </div>
  </form>
</template>
