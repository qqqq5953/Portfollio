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
import { CalendarIcon, RefreshCw } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
  isToday,
  type DateValue,
} from "@internationalized/date";
import { toDate } from "reka-ui/date";
import { callEdgeFunction, debounce } from "@/lib/helper";
import { supabase } from "@/lib/supabase";
import { DateTime } from "luxon";
import { fetchClosingPrice, fetchExchangeRate } from "@/api/stock";

const df = new DateFormatter("en-US", {
  dateStyle: "long",
});
const placeholder = ref();

const formSchema = z.object({
  side: z.enum(["buy", "sell"]),
  market: z.enum(["US", "TW"]),
  date: z.string().min(1, "Date is required."),
  symbol: z.string().min(1, "Symbol is required."),
  share: z
    .number({ required_error: "Share is required." })
    .min(1, "Share must be at least 1"),
  cost: z
    .number({ required_error: "Cost is required." })
    .min(1, "Cost must be at least 1"),
  closingPrice: z.number({ required_error: "Closing price is required." }),
  exchangeRate: z.number().optional(),
  fee: z.number().optional(),
  tax: z.number().optional(),
  note: z.string().optional(),
});

const {
  handleSubmit,
  values,
  setFieldValue,
  resetForm,
  setFieldError,
  errors,
} = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    side: "buy",
    market: "US",
    date: "",
    symbol: "",
    share: undefined,
    cost: undefined,
    closingPrice: -1,
    exchangeRate: undefined,
    fee: undefined,
    tax: undefined,
    note: undefined,
  },
});

const currency = computed(() => {
  return values.market === "US" ? "USD" : "TWD";
});

const dateValue = computed({
  get: () => (values.date ? parseDate(values.date) : undefined),
  set: (val) => val,
});

function isDisabledDate(calenderDateValue: DateValue) {
  const jsDate = new Date(
    calenderDateValue.year,
    calenderDateValue.month - 1,
    calenderDateValue.day
  );
  const dayOfWeek = jsDate.getDay();

  // 基本規則：週末不可選
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;

  const taipeiNow = DateTime.local().setZone("Asia/Taipei");
  const currentHour = taipeiNow.hour;
  const currentMinute = taipeiNow.minute;
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // 判斷傳入的日期是今天還是昨天
  const todayDate = today(getLocalTimeZone());
  const yesterdayDate = todayDate.subtract({ days: 1 });

  const isCheckingToday = isToday(calenderDateValue, getLocalTimeZone());
  const isCheckingYesterday = calenderDateValue.compare(yesterdayDate) === 0;

  if (values.market === "TW") {
    // 台股：只處理今天的情況，如果現在時間在13:30前，則禁用今天日期
    if (isCheckingToday) {
      const marketCloseMinutes = 13 * 60 + 30; // 13:30
      if (currentTimeInMinutes < marketCloseMinutes) {
        return true;
      }
    }
  } else if (values.market === "US") {
    const nyNow = taipeiNow.setZone("America/New_York");
    const isDST = nyNow.offset === -240;

    const OPEN_HOUR_DST = 21;
    const OPEN_MINUTE_DST = 30;
    const CLOSE_HOUR_DST = 4;
    const CLOSE_MINUTE_DST = 0;

    const OPEN_HOUR_STD = 22;
    const OPEN_MINUTE_STD = 30;
    const CLOSE_HOUR_STD = 5;
    const CLOSE_MINUTE_STD = 0;

    const nowMinutes = taipeiNow.hour * 60 + taipeiNow.minute;

    const openMinutes = isDST
      ? OPEN_HOUR_DST * 60 + OPEN_MINUTE_DST
      : OPEN_HOUR_STD * 60 + OPEN_MINUTE_STD;

    const closeMinutes = isDST
      ? CLOSE_HOUR_DST * 60 + CLOSE_MINUTE_DST
      : CLOSE_HOUR_STD * 60 + CLOSE_MINUTE_STD;

    // 當日的 00:00-04:00 (夏令時間) 或  00:00-05:00 (非夏令時間)
    if (nowMinutes >= 0 && nowMinutes < closeMinutes) {
      // 交易時間：禁用今天和前一天
      if (isCheckingToday || isCheckingYesterday) {
        return true;
      }
    }

    // 當日的 04:00-21:30 (夏令時間) 或  05:00-22:30 (非夏令時間)
    if (nowMinutes >= closeMinutes && nowMinutes < openMinutes) {
      // 非交易時間：禁用今天，但前一天可以選
      if (isCheckingToday) {
        return true; // 繼續禁用今天
      }
      if (isCheckingYesterday) {
        return false; // 前一天可以選了
      }
    }

    // 當日的 21:30-24:00 (夏令時間) 或  22:30-24:00 (非夏令時間)
    if (nowMinutes >= openMinutes) {
      // 交易時間：禁用今天和前一天
      if (isCheckingToday) {
        return true;
      }
    }
  }

  return false;
}

const onSubmit = handleSubmit(async (values) => {
  if (symbolValidation.value.status === "invalid") return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await callEdgeFunction({
    name: "transaction-create",
    body: {
      ...values,
      symbol: values.symbol.toUpperCase(),
      userId: session?.user?.id || "",
    },
  });

  if (error) {
    console.error(error);
  }

  if (data) {
    console.log(data);
    resetForm();
    symbolValidation.value = {
      status: "idle",
      message: "",
    };
  }
});

// Symbol validation
const isValidatingSymbol = ref(false);
const symbolValidation = ref({
  status: "idle" as "valid" | "invalid" | "idle",
  message: "",
});

const debouncedValidateSymbol = debounce(
  validateSymbolAndFetchPrice,
  500,
  () => values.symbol // Pure function - pass current value getter
);

async function validateSymbolAndFetchPrice(symbol: string) {
  if (!symbol || symbol.length < 1) {
    symbolValidation.value = {
      status: "idle",
      message: "",
    };
    return;
  }

  isValidatingSymbol.value = true;

  const endpoint =
    values.market === "US"
      ? `https://ws.api.cnyes.com/ws/api/v1/esg/state/USS:${symbol}:STOCK`
      : `https://ws.api.cnyes.com/internal/ws/api/v1/checkTWStock/${symbol}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      symbolValidation.value = {
        status: "invalid",
        message: "✗ Invalid symbol or wrong market",
      };
      return;
    }

    const res = await response.json();
    if (res.statusCode !== 200) {
      symbolValidation.value = {
        status: "invalid",
        message: "✗ Invalid symbol or wrong market",
      };
      return;
    }

    symbolValidation.value = {
      status: "valid",
      message: `✓ Valid symbol`,
    };

    if (!values.date) return;

    await handleFetchClosingPrice({
      status: symbolValidation.value.status,
      symbol: values.symbol,
      market: values.market,
      date: values.date,
    });
  } catch (error) {
    console.error("Symbol validation error:", error);
    symbolValidation.value = {
      status: "invalid",
      message: "✗ Error validating symbol",
    };
  } finally {
    isValidatingSymbol.value = false;
  }
}

function handleSymbolInput(symbol: string) {
  const symbolValue = symbol.trim().toUpperCase();
  if (symbolValue && symbolValue.length > 0) {
    debouncedValidateSymbol(symbolValue);
  } else {
    symbolValidation.value.status = "idle";
    symbolValidation.value.message = "";
  }
}

// Exchange rate fetching
const isLoadingExchangeRate = ref(false);

async function handleFetchExchangeRate(date: string) {
  if (values.market === "TW") {
    setFieldValue("exchangeRate", 1);
    return;
  }

  try {
    const res = await fetchExchangeRate(date);

    if (res.statusCode === 200 && res.data.h[0] > 0 && res.data.l[0] > 0) {
      setFieldValue("exchangeRate", (res.data.h[0] + res.data.l[0]) / 2);
    } else {
      setFieldError("exchangeRate", "Failed to fetch exchange rate");
    }
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    setFieldError("exchangeRate", "Failed to fetch exchange rate");
  } finally {
    isLoadingExchangeRate.value = false;
  }
}

// Closing price fetching

async function handleFetchClosingPrice({
  status,
  symbol,
  date,
  market,
}: {
  status: "valid" | "idle" | "invalid";
  date: string | undefined;
  symbol: string | undefined;
  market: string | undefined;
}) {
  if (status !== "valid" || !symbol) {
    setFieldError("symbol", "Invalid symbol");
    return;
  }
  if (!market) {
    setFieldError("market", "Market is required");
    return;
  }
  if (!date) {
    setFieldError("date", "Date is required");
    return;
  }

  const res = await fetchClosingPrice({
    symbol: market === "US" ? symbol : `${symbol}.TW`,
    date,
  });

  if (res.quotes.length > 0) {
    setFieldValue("closingPrice", Math.round(res.quotes[0].close * 100) / 100);
  } else {
    setFieldError("closingPrice", "Failed to fetch closing price");
  }
}

async function handleDateChange(dateValue: DateValue | undefined) {
  if (!dateValue) return setFieldValue("date", undefined);

  setFieldValue("date", dateValue.toString());
  handleFetchExchangeRate(dateValue.toString());

  if (
    symbolValidation.value.status === "valid" &&
    values.symbol &&
    values.market
  ) {
    handleFetchClosingPrice({
      status: symbolValidation.value.status,
      symbol: values.symbol,
      market: values.market,
      date: dateValue.toString(),
    });
  }
}

async function handleMarketChange(e: Event) {
  const market = (e.target as HTMLInputElement).value as "US" | "TW";
  setFieldValue("exchangeRate", market === "TW" ? 1 : undefined);
  setFieldValue("closingPrice", -1);
  if (values.symbol) {
    resetForm({
      values: {
        ...values,
        symbol: "",
      },
    });
  }

  symbolValidation.value.status = "idle";
  symbolValidation.value.message = "";
}
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <FormField name="side" v-slot="{ componentField }">
        <FormItem>
          <FormLabel>
            <div>
              Type
              <span class="text-xs text-red-500">*</span>
            </div>
          </FormLabel>
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

      <FormField name="market" v-slot="{ componentField }">
        <FormItem>
          <FormLabel>
            <div>
              Market
              <span class="text-xs text-red-500">*</span>
            </div>
          </FormLabel>
          <FormControl>
            <RadioGroup
              class="flex gap-4"
              v-bind="componentField"
              @change="handleMarketChange"
            >
              <FormItem class="flex items-center gap-3">
                <FormControl>
                  <RadioGroupItem value="US" />
                </FormControl>
                <FormLabel class="font-normal">US</FormLabel>
              </FormItem>
              <FormItem class="flex items-center gap-3">
                <FormControl>
                  <RadioGroupItem value="TW" />
                </FormControl>
                <FormLabel class="font-normal">TW</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      </FormField>
    </div>

    <FormField name="symbol" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>
          <div>
            Symbol
            <span class="text-xs text-red-500">*</span>
          </div>
        </FormLabel>
        <div class="relative">
          <FormControl>
            <Input
              :placeholder="
                values.market === 'US' ? 'AAPL, NVDA, ...' : '2330, 2317, ...'
              "
              v-bind="componentField"
              @input="(e: Event) => handleSymbolInput((e.target as HTMLInputElement).value)"
              :class="[
                'uppercase',
                symbolValidation.status === 'invalid'
                  ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200'
                  : '',
              ]"
            />
          </FormControl>
        </div>
        <FormMessage />
        <div
          v-if="symbolValidation.message"
          :class="[
            'text-xs',
            symbolValidation.status === 'valid'
              ? 'text-green-600'
              : 'text-red-600',
          ]"
        >
          {{ symbolValidation.message }}
        </div>
      </FormItem>
    </FormField>

    <FormField name="share" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>
          <div>
            Share
            <span class="text-xs text-red-500">*</span>
          </div>
        </FormLabel>
        <FormControl>
          <Input placeholder="1" type="number" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="cost" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>
          <div>
            Cost({{ currency }})
            <span class="text-xs text-red-500">*</span>
          </div>
        </FormLabel>
        <FormControl>
          <Input placeholder="100" type="number" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="date">
      <FormItem class="flex flex-col">
        <FormLabel>
          <div>
            Date
            <span class="text-xs text-red-500">*</span>
          </div>
          <div class="ml-auto text-xs">
            <div v-if="errors.closingPrice">
              <span class="text-red-500 mr-1">{{ errors.closingPrice }}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="
                  handleFetchClosingPrice({
                    status: symbolValidation.status,
                    symbol: values.symbol,
                    market: values.market,
                    date: values.date,
                  })
                "
                :disabled="isLoadingExchangeRate"
                class="h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3"
              >
                <RefreshCw /> Refresh
              </Button>
            </div>
            <div v-else-if="values.closingPrice !== -1">
              <span class="text-neutral-500">Closing Price: </span>
              <span
                class="bg-neutral-500 text-neutral-100 ml-1 px-2 py-0.5 rounded-full"
                >{{ values.closingPrice }}</span
              >
            </div>
          </div>
        </FormLabel>
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
              :is-date-disabled="isDisabledDate"
              @update:model-value="handleDateChange"
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="exchangeRate" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>
          <div>
            Exchange Rate ({{ currency }} → TWD)
            <span class="text-xs text-red-500">*</span>
          </div>
          <div class="ml-auto text-xs">
            <div v-if="errors.exchangeRate">
              <span class="text-red-500 mr-1">{{ errors.exchangeRate }}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="handleFetchExchangeRate"
                :disabled="isLoadingExchangeRate"
                class="h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3"
              >
                <RefreshCw /> Refresh
              </Button>
            </div>
          </div>
        </FormLabel>
        <div class="relative">
          <FormControl>
            <Input
              placeholder="USD:TWD"
              type="number"
              step="0.01"
              v-bind="componentField"
              :disabled="true"
              class="disabled:cursor-not-allowed disabled:pointer-events-auto"
            />
          </FormControl>
        </div>
        <FormMessage />
        <div class="flex items-center justify-between mt-1">
          <div class="text-xs text-gray-500">
            Rate is automatically fetched. You can manually override if needed.
          </div>
        </div>
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
                <FormLabel>Fee({{ values.market }})</FormLabel>
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
                <FormLabel>Tax({{ values.market }})</FormLabel>
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
      <Button type="submit"> Submit </Button>
    </div>
  </form>
</template>
