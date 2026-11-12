export interface QuoteItem { id: string; qty?: number; tier?: number }
export interface QuoteExtra { label: string; hours?: number; amount: number }
export interface QuoteLine { id: string; name: string; unit: string; qty: number; tier: number; parts: number; hours: number; labor: number; extras: QuoteExtra[]; total: number }
export interface Quote { lines: QuoteLine[]; parts: number; hours: number; labor: number; supplies: number; tax: number; total: number; low: number; high: number }
type QuoteVehicle = { cylinders?: string | number | null } | null | undefined;

export const LABOR: Record<string, number[]>;
export const PAINT_HRS: Record<string, number>;
export const PAINT_MATERIALS: number;
export const NEEDS_ALIGNMENT: string[];
export const ALIGNMENT: number;
export const EXTRA_UNIT: number;
export const SUPPLIES: { share: number; cap: number };
export const RATES: { key: string; label: string; rate: number }[];
export const DEFAULTS: { rate: number; tax: number; tier: number };
export const TIER_NAMES: string[];
export function laborHours(id: string, vehicle?: QuoteVehicle): number;
export function jobHours(id: string, qty: number, vehicle?: QuoteVehicle): number;
export function quoteLine(item: QuoteItem, opts: { rate: number; vehicle?: QuoteVehicle }): QuoteLine;
export function quote(items: QuoteItem[], opts: { rate: number; tax?: number; vehicle?: QuoteVehicle }): Quote;
