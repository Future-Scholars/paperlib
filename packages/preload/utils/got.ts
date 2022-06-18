import got, { HTTPError } from "got";
import { ipcRenderer } from "electron";

export async function safeGot(url: string, headers: Record<string, string>) {
  const options = {
    headers: headers,
    retry: 0,
    timeout: {
      request: 5000,
    },
  };

  let response;
  try {
    response = await got(url, options);
  } catch (error) {
    if (error instanceof HTTPError) {
      if (
        error.response.statusCode === 429 ||
        error.response.statusCode === 403
      ) {
        const robot_checked_body = await ipcRenderer.invoke("robot-check", url);
        response = {
          body: robot_checked_body,
        };
      }
    }
  }
  if (
    response?.body.includes("Please show you're not a robot") ||
    response?.body.includes("Please show you&#39;re not a robot") ||
    response?.body.includes("does not have permission")
  ) {
    const robot_checked_body = await ipcRenderer.invoke("robot-check", url);
    response = {
      body: robot_checked_body,
    };
  }
  return response;
}
