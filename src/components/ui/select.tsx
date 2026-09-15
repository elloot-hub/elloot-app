"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react";

const ELLOOT_EASE = [0.22, 1, 0.36, 1] as const;

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("p-1", className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn(
        "flex min-w-0 flex-1 text-left text-sm text-foreground",
        className,
      )}
      render={(spanProps, state) => (
        <span
          {...spanProps}
          className={cn(
            spanProps.className,
            "relative block min-w-0 flex-1 overflow-hidden",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={
                state.placeholder
                  ? "__placeholder__"
                  : String(state.value ?? "__empty__")
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: ELLOOT_EASE }}
              className={cn(
                "block truncate",
                state.placeholder && "text-muted-foreground",
              )}
            >
              {spanProps.children}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "group/select-trigger flex w-fit cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-background py-2 pr-2.5 pl-3 text-sm whitespace-nowrap shadow-xs outline-none select-none",
        "transition-[color,box-shadow,background-color,border-color,transform] duration-200 ease-out",
        "hover:border-primary/25 hover:bg-muted/40",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "data-popup-open:border-primary/35 data-popup-open:bg-accent/35 data-popup-open:shadow-[0_0_0_3px_var(--surface-glow)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "data-placeholder:text-muted-foreground",
        "data-[size=default]:h-9 data-[size=sm]:h-8",
        "dark:bg-input/30 dark:hover:bg-input/50 dark:data-popup-open:bg-accent/25",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground transition-[transform,color] duration-200 ease-out data-popup-open:rotate-180 data-popup-open:text-primary" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-[12rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-primary/15 bg-popover/95 p-1 text-popover-foreground shadow-lg shadow-primary/5 ring-0 ring-foreground/10 backdrop-blur-md",
            "duration-200",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List className="flex flex-col gap-0.5 p-0.5">
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-2.5 py-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-md py-2 pr-8 pl-3 text-sm outline-hidden select-none",
        "transition-[color,background-color,transform] duration-150 ease-out",
        "before:pointer-events-none before:absolute before:top-1/2 before:left-1.5 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:transition-transform before:duration-200 before:ease-out before:content-['']",
        "before:origin-center before:scale-y-0 data-highlighted:before:scale-y-100",
        "focus:bg-primary/8 focus:text-accent-foreground",
        "data-highlighted:bg-primary/8 data-highlighted:text-accent-foreground",
        "data-selected:bg-primary/10 data-selected:font-medium data-selected:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 truncate whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <motion.span
            layout
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.16, ease: ELLOOT_EASE }}
            className="pointer-events-none absolute right-2 flex size-4 items-center justify-center text-primary"
          />
        }
      >
        <CheckIcon className="pointer-events-none size-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-border",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover/95 py-1 backdrop-blur-md [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover/95 py-1 backdrop-blur-md [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
