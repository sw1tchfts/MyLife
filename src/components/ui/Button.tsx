"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import {
  btnPrimary,
  btnSecondary,
  btnDanger,
  btnDangerSm,
  btnSuccess,
  btnSuccessSm,
  btnSuccessXs,
  btnInfo,
  btnGhost,
} from "@/lib/styles";

const VARIANT_CLASSES = {
  primary: btnPrimary,
  secondary: btnSecondary,
  danger: btnDanger,
  dangerSm: btnDangerSm,
  success: btnSuccess,
  successSm: btnSuccessSm,
  successXs: btnSuccessXs,
  info: btnInfo,
  ghost: btnGhost,
} as const;

type Variant = keyof typeof VARIANT_CLASSES;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", icon, className = "", children, ...props },
  ref,
) {
  const base = VARIANT_CLASSES[variant];
  const composed = icon ? `inline-flex items-center gap-1.5 ${base}` : base;

  return (
    <button ref={ref} className={`${composed} ${className}`} {...props}>
      {children}
    </button>
  );
});

export default Button;
