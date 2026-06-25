import { NextResponse } from "next/server";
import { fetchTgjuCurrencyRates } from "../../../lib/currencyRates.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rates = await fetchTgjuCurrencyRates();
    return NextResponse.json(rates, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "currency_rates_unavailable",
        message: err instanceof Error ? err.message : "Currency rates unavailable",
      },
      { status: 502 },
    );
  }
}
