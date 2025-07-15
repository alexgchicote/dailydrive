import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Determine score color based on the value using CSS variables
export const getScoreColor = (score: number) => {
  const green = "hsl(var(--score-green))";
  const yellow = "hsl(var(--score-yellow))";
  const red = "hsl(var(--score-red))";

  if (score === 1) return green;
  if (score > 0.6) return yellow;
  return red;
};

export const formatDateHeader = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Get weekday name
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

  // Get day without leading zero
  const day = date.getDate();

  // Get month abbreviated name
  const month = date.toLocaleDateString('en-US', { month: 'short' });

  // Get full year
  const year = date.getFullYear();

  return `${weekday}, ${day} ${month} ${year}`;
};