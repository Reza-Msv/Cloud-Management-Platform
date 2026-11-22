import { NextRequest, NextResponse } from "next/server";

const GO_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_API_GO_SERVICE_BASE_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service_id");

  // If service_id is provided, enforce session authorization:
  // User must possess an active sessionid cookie to inspect service details
  if (serviceId !== null) {
    const sessionCookie = request.cookies.get("sessionid")?.value;
    if (!sessionCookie || sessionCookie.trim() === "") {
      return NextResponse.json(
        {
          error: "unauthorized",
          detail: "Authentication required to query cloud service status",
        },
        { status: 401 }
      );
    }

    const parsedId = Number(serviceId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        {
          error: "invalid service_id",
          detail: "service_id must be a positive integer",
        },
        { status: 400 }
      );
    }
  }

  // Build target URL for Go microservice
  let targetUrl = `${GO_SERVICE_BASE_URL.replace(/\/+$/, "")}/health`;
  if (serviceId !== null) {
    targetUrl += `?service_id=${encodeURIComponent(serviceId)}`;
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const upstreamResponse = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    const isJson = upstreamResponse.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson
      ? await upstreamResponse.json()
      : { detail: await upstreamResponse.text() };
    
    return NextResponse.json(data, {
      status: upstreamResponse.status,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        {
          error: "upstream timeout",
          detail: "Go microservice request timed out",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: "service unavailable",
        detail: "Unable to reach Go microservice",
      },
      { status: 502 }
    );
  }
}
