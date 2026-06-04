import axios from "axios";
import { getQuintariToken } from "./quintariToken.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export interface QuintariCallOptions {
    baseUrl?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
}

export interface QuintariResponse<TResponse> {
    data: TResponse;
    status: number;
    headers: Record<string, unknown>;
}

export async function quintariRequest<TResponse = unknown, TBody = unknown>(
    method: string,
    path: string,
    body?: TBody,
    options: QuintariCallOptions = {}
): Promise<QuintariResponse<TResponse>> {
    const baseUrl = options.baseUrl || process.env.QUINTARI_API_BASE_URL;
    if (!baseUrl) {
        throw new Error(
            "QUINTARI_API_BASE_URL is not set in .env — cannot call Quintari API."
        );
    }

    const token = await getQuintariToken();
    const url = path.startsWith("http")
        ? path
        : `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

    const response = await axios.request({
        method,
        url,
        data: body,
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    });

    return {
        data: response.data as unknown as TResponse,
        status: response.status,
        headers: response.headers as Record<string, unknown>,
    };
}
