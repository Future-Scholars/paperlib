import { createDecorator } from "@/base/injection/injection";
import ky, { Options as KyOptions, KyResponse } from "ky";

import { compressString } from "@/base/string";

const cache = new Map();

export const INetworkTool = createDecorator("networkTool");

export class NetworkTool {
  constructor() {}

  private async _cachePreHook(_request: Request) {
    const cacheKey = `${_request.method}-${_request.url}-${_request.headers}`;
    if (cache.has(cacheKey)) {
      const storedCache = cache.get(cacheKey);

      if (storedCache.ttl < Date.now()) {
        cache.delete(cacheKey);
        return undefined;
      } else {
        return storedCache.response;
      }
    }
  }

  private async _cacheAfterHook(
    _request: Request,
    _options: KyOptions,
    response: KyResponse
  ) {
    const cacheKey = `${_request.method}-${_request.url}-${_request.headers}`;
    const ttl = Date.now() + 1000 * 60 * 60 * 24;
    const storedCache = {
      ttl: ttl,
      response: response.clone(),
    };
    cache.set(cacheKey, storedCache);
    return response;
  }

  private async _parseResponse(response: KyResponse, parse = false) {
    const contentType = response.headers.get("content-type");
    let body: any;
    if (contentType?.includes("application/json") && parse) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return {
      body: body,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  }

  /**
   * HTTP GET
   * @param url - URL
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
   * @param cache - Use cache
   * @param parse - Try to parse response body
   * @returns Response
   */
  async get(
    url: string,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    cache = false,
    parse = false
  ) {
    const options: KyOptions = {
      headers: headers,
      retry: retry,
      timeout: timeout,
      hooks: {
        beforeRequest: cache ? [this._cachePreHook] : [],
        afterResponse: cache ? [this._cacheAfterHook] : [],
      },
    };

    const response = await ky.get(url, options);
    return await this._parseResponse(response, parse);
  }

  /**
   * HTTP POST
   * @param url - URL
   * @param data - Data
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
   * @param compress - Compress data
   * @param parse - Try to parse response body
   * @returns Response
   */
  async post(
    url: string,
    data: Record<string, any> | string,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    compress = false,
    parse = false
  ) {
    let options: KyOptions;
    if (compress) {
      const dataString = typeof data === "string" ? data : JSON.stringify(data);
      const buffer = await compressString(dataString);

      options = {
        body: buffer,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    } else if (typeof data === "string") {
      options = {
        body: data,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    } else if (typeof data === "object") {
      options = {
        json: data,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    } else {
      options = {
        body: data,
        headers: headers,
        retry: retry,
        timeout: timeout,
      };
    }

    const response = await ky.post(url, options);
    return await this._parseResponse(response, parse);
  }

  /**
   * HTTP POST with form data
   * @param url - URL
   * @param data - Data
   * @param headers - Headers
   * @param retry - Retry times
   * @param timeout - Timeout
   * @returns Response
   */
  async postForm(
    url: string,
    data: FormData,
    headers?: Record<string, string>,
    retry = 1,
    timeout = 5000,
    parse = false
  ) {
    if (!(data instanceof FormData)) {
      if (typeof data === "object") {
        const formData = new FormData();
        for (const key in data as Record<string, any>) {
          formData.append(key, data[key]);
        }
        data = formData;
      }
    }
    const options = {
      body: data,
      headers: headers,
      retry: retry,
      timeout: timeout,
    };

    const response = await ky.post(url, options);
    return await this._parseResponse(response, parse);
  }

  /**
   * Check if the network is connected
   * @returns Whether the network is connected
   */
  async connected() {
    try {
      const response = await ky.get("https://httpbin.org/ip", {
        timeout: 5000,
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
}
