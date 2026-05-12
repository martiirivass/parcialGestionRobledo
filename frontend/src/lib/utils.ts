import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind evitando conflictos
 * Usa clsx para lógica condicional y twMerge para resolver conflictos
 * 
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", "px-8") // "py-2 bg-blue-500 px-8"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
