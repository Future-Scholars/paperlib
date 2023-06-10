import { domReady } from "@/utils/misc";

import { appendLoading } from "./loading";

domReady().then(appendLoading);
