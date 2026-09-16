import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

type Variant = "default" | "accent" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "default", className, children, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} ${className ?? ""}`} {...rest}>
      <span className="btn-bracket">[</span>
      <span className="btn-label">{children}</span>
      <span className="btn-bracket">]</span>
    </button>
  );
}
