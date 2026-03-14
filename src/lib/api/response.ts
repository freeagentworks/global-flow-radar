import { NextResponse } from "next/server";
import type { ApiResponse, DataQuality } from "@/types";

// API共通レスポンスヘルパー（06_api-design.md 2.1節 準拠）

export function successResponse<T>(
  data: T,
  options?: {
    period?: { from: string; to: string };
    data_quality?: DataQuality;
    updated_at?: string;
  }
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      updated_at: options?.updated_at ?? new Date().toISOString(),
      period: options?.period ?? { from: "", to: "" },
      data_quality: options?.data_quality ?? "full",
    },
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 500,
  retryAfter?: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(retryAfter && { retry_after: retryAfter }),
      },
    },
    { status }
  );
}

// 期間パラメータからDate範囲を算出
export function periodToDateRange(period: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case "1d":
      from.setDate(to.getDate() - 1);
      break;
    case "1w":
      from.setDate(to.getDate() - 7);
      break;
    case "1m":
      from.setMonth(to.getMonth() - 1);
      break;
    case "3m":
      from.setMonth(to.getMonth() - 3);
      break;
    case "6m":
      from.setMonth(to.getMonth() - 6);
      break;
    case "1y":
      from.setFullYear(to.getFullYear() - 1);
      break;
    case "5y":
      from.setFullYear(to.getFullYear() - 5);
      break;
    default:
      from.setMonth(to.getMonth() - 1);
  }

  return { from, to };
}
