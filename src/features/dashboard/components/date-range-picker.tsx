"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PeriodPreset = "today" | "7d" | "30d" | "custom";

export type DateRangeValue = {
  from: Date;
  to: Date;
  preset: PeriodPreset;
};

const PRESETS: Array<{ id: Exclude<PeriodPreset, "custom">; label: string }> = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
];

function startOfLocalDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function presetToRange(preset: Exclude<PeriodPreset, "custom">): DateRangeValue {
  const to = startOfLocalDay();
  const from = startOfLocalDay();
  if (preset === "7d") from.setDate(from.getDate() - 6);
  if (preset === "30d") from.setDate(from.getDate() - 29);
  return { from, to, preset };
}

export function toIsoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatRangeLabel(value: DateRangeValue) {
  if (value.preset === "today") return "Hoje";
  if (value.preset === "7d") return "Últimos 7 dias";
  if (value.preset === "30d") return "Últimos 30 dias";
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  if (toIsoDay(value.from) === toIsoDay(value.to)) {
    return fmt.format(value.from);
  }
  return `${fmt.format(value.from)} – ${fmt.format(value.to)}`;
}

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
  align?: "start" | "center" | "end";
};

export function DateRangePicker({ value, onChange, className, align = "end", }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const today = useMemo(() => startOfLocalDay(), []);

  const selected: DateRange = draft ?? { from: value.from, to: value.to };
  const customActive = value.preset === "custom" || Boolean(draft);

  function applyPreset(preset: Exclude<PeriodPreset, "custom">) {
    setDraft(undefined);
    onChange(presetToRange(preset));
    setOpen(false);
  }

  function handleSelect(next: DateRange | undefined) {
    if (!next?.from) {
      setDraft(undefined);
      return;
    }
    if (!next.to) {
      setDraft({ from: next.from, to: undefined });
      return;
    }
    const from = startOfLocalDay(next.from);
    const to = startOfLocalDay(next.to);
    setDraft(undefined);
    onChange({
      from,
      to,
      preset:
        toIsoDay(from) === toIsoDay(startOfLocalDay()) &&
          toIsoDay(to) === toIsoDay(from)
          ? "today"
          : "custom",
    });
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setDraft(undefined);
      }}
    >
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "min-w-auto justify-between gap-2 rounded-md font-medium",
          className,
        )}
      >
        <CalendarIcon className="size-3.5 text-muted-foreground" />
        <span className="truncate">{formatRangeLabel(value)}</span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className="w-auto max-w-[calc(100vw-1.5rem)] gap-3 bg-popover p-3 backdrop-blur-none"
      >
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-wrap gap-1.5 lg:w-36 lg:flex-col">
            {PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyPreset(item.id)}
                className={cn(
                  "rounded-sm cursor-pointer px-3 py-1.5 text-left text-xs font-medium transition-all duration-300",
                  value.preset === item.id && !draft
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDraft({ from: value.from, to: value.to })}
              className={cn(
                "rounded-sm cursor-pointer px-3 py-1.5 text-left text-xs font-medium transition-all duration-300",
                customActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              Personalizado
            </button>
          </div>

          <Calendar
            mode="range"
            locale={ptBR}
            numberOfMonths={2}
            selected={selected}
            onSelect={handleSelect}
            disabled={{ after: today }}
            defaultMonth={selected.from}
            className="rounded-md border-2 border-dashed border-border p-2"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
