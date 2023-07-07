import { domReady } from "@/base/misc";

import { appendLoading } from "./loading";

domReady().then(appendLoading);
