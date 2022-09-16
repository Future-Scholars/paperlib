import { readFileSync, readdirSync } from "fs";
import path from "path";

export const loadLocales = (code?: string) => {
  const locales: Record<string, any> = {};
  const files = readdirSync("./app/locales/locales");
  console.log(files);
  files.forEach((file) => {
    const locale = JSON.parse(
      readFileSync(path.join("./app/locales/locales", file), "utf8")
    );

    locales[locale.code] = locale;
  });

  if (code) {
    const locale = locales[code];
    locale.t = (key: string) => {
      return getObj(locale, key) as string;
    };

    return locales[code];
  } else {
    return locales;
  }
};

function getObj(obj: any, dest: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return dest.split(".").reduce((a, b) => a[b], obj);
}
