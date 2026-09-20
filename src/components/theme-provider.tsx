"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Props = React.ComponentProps<typeof NextThemesProvider> & {
  nonce?: string;
};

export function ThemeProvider({ children, nonce, ...props }: Props) {
  return (
    <NextThemesProvider nonce={nonce} {...props}>
      {children}
    </NextThemesProvider>
  );
}
