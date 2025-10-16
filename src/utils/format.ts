import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const DEFAULT_LOCALE = "en-US";

// Shared formatter used whenever we only need grouped integer output.
const INTEGER_FORMATTER = new Intl.NumberFormat(DEFAULT_LOCALE, {
  useGrouping: true,
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

// Strips everything except digits and decimal separators so we can reformat safely.
const stripToNumeric = (raw: string) => raw.replace(/[^0-9.]/g, "");

// General-purpose numeric formatter with grouping enabled by default.
export const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  const numeric = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    useGrouping: true,
    ...options,
  }).format(numeric);
};

// Formats a numeric value using locale-aware currency styling.
export const formatCurrency = (
  value: number,
  currency: string = "USD",
  options: Intl.NumberFormatOptions = {}
): string => {
  return formatNumber(value, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};

// Formats a SOL amount to a fixed number of decimal places with grouping.
export const formatSol = (
  sol: number,
  decimals: number = 4,
  options: Intl.NumberFormatOptions = {}
): string => {
  const numeric = Number.isFinite(sol) ? sol : 0;

  return formatNumber(numeric, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...options,
  });
};

// Converts lamports to SOL and applies the SOL formatter.
export const formatLamports = (
  lamports: number,
  decimals: number = 4,
  options: Intl.NumberFormatOptions = {}
): string => {
  const numeric = Number.isFinite(lamports) ? lamports : 0;
  const solValue = numeric / LAMPORTS_PER_SOL;

  return formatSol(solValue, decimals, options);
};

// Formats a numeric value as a percentage string with clamped precision.
export const formatPercent = (
  value: number,
  digits: number = 2,
  options: Intl.NumberFormatOptions = {}
): string => {
  const numeric = Number.isFinite(value) ? Math.max(value, 0) : 0;

  return `${formatNumber(numeric, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    ...options,
  })}%`;
};

// Formats amount input originating from either user text or a numeric value.
export const formatAmountInput = (
  value: string | number,
  maximumFractionDigits: number = 9
): string => {
  const raw =
    typeof value === "number"
      ? value.toLocaleString(DEFAULT_LOCALE, {
          useGrouping: false,
          maximumFractionDigits,
        })
      : value;

  if (!raw) {
    return "";
  }

  const digitsOnly = stripToNumeric(raw);
  if (!digitsOnly) {
    return "";
  }

  const hasTrailingDecimal =
    typeof value === "string" && raw.trim().endsWith(".");

  const [integerPart = "", ...fractionParts] = digitsOnly.split(".");
  const fraction = fractionParts.join("");
  const formattedInteger = integerPart.length
    ? INTEGER_FORMATTER.format(Number(integerPart))
    : "0";

  if (hasTrailingDecimal) {
    return `${formattedInteger}.`;
  }

  return fraction.length ? `${formattedInteger}.${fraction}` : formattedInteger;
};

// Produces a plain numeric string (no commas) for validation and parsing.
export const normalizeAmountInput = (value: string): string => {
  if (!value) {
    return "";
  }

  const digitsOnly = stripToNumeric(value);
  if (!digitsOnly) {
    return "";
  }

  const [rawInteger = "", ...fractionParts] = digitsOnly.split(".");
  const fraction = fractionParts.join("");
  const trimmedInteger = rawInteger.replace(/^0+(?=\d)/, "");
  const integerForOutput = trimmedInteger || (fraction ? "0" : "");

  if (!integerForOutput && !fraction) {
    return "";
  }

  return fraction ? `${integerForOutput}.${fraction}` : integerForOutput;
};
