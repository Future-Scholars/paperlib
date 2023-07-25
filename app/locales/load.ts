export const loadLocales = (code?: string) => {
  const locales: Record<string, any> = {};

  // @ts-ignore
  const data = import.meta.glob("./locales/*.json", { eager: true });

  for (const path in data) {
    const local = data[path];
    // @ts-ignore
    locales[local.code] = JSON.parse(JSON.stringify(local));
  }
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
