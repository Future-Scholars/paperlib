import { setCssVar } from 'quasar';

export class Theme {
  theme: 'dark' | 'light' | 'system';

  constructor(theme: 'dark' | 'light' | 'system') {
    this.theme = theme;
  }

  set(theme: 'dark' | 'light' | 'system') {
    this.theme = theme;
    if (theme === 'dark') {
      this.setDarkCss();
    }
    if (theme === 'light') {
      this.setLightCss();
    }
  }

  setLightCss() {
    setCssVar('primary', '#565656');
    setCssVar('secondary', '#c4c4c4');
    setCssVar('accent', '#0061e1');
    setCssVar('accent-2', '#c4c4c4');
    setCssVar('text', '#000000');
    setCssVar('text-2', 'rgb(128, 128, 128)');
    setCssVar('text-accent', '#ffffff');
    setCssVar('text-accent-2', 'rgb(178, 207, 245)');
    setCssVar('icon-1', 'rgb(11, 112, 231)');
    setCssVar('badge-1', 'rgba(83, 83, 83, 0.2)');
    setCssVar('button-1', 'rgb(114, 114, 114)');
    setCssVar('bg-primary', '#ffffff');
    setCssVar('bg-secondary', '#efefef');
    setCssVar('bg-table-even', '#f1f3f2');
    setCssVar('menu-bg', 'rgb(226, 226, 228)');
    setCssVar('menu-shortcut', 'rgb(148, 148, 148)');
    setCssVar('divider', '#dddddd');
    setCssVar('skeleton-bg', '#ffffff');
    setCssVar('skeleton-item', '#dddddd');
  }

  setDarkCss() {
    setCssVar('primary', 'rgb(223, 223, 223)');
    setCssVar('secondary', '#444444');
    setCssVar('bg-primary', '#242526');
    setCssVar('accent', '#0061e1');
    setCssVar('accent-2', '#232323');
    setCssVar('text', 'rgb(223, 223, 223)');
    setCssVar('text-2', 'rgb(126, 126, 126)');
    setCssVar('text-accent', '#ffffff');
    setCssVar('text-accent-2', 'rgb(178, 207, 245)');
    setCssVar('icon-1', 'rgb(37, 134, 241)');
    setCssVar('badge-1', 'rgba(120, 120, 120, 0.2)');
    setCssVar('button-1', 'rgb(150, 149, 147)');
    setCssVar('bg-primary', '#242526');
    setCssVar('bg-secondary', 'rgb(50, 50, 50)');
    setCssVar('bg-table-even', 'rgb(49, 49, 49)');
    setCssVar('menu-bg', 'rgb(45, 46, 46)');
    setCssVar('menu-shortcut', 'rgb(148, 148, 148)');
    setCssVar('divider', 'rgb(58, 54, 52)');
    setCssVar('skeleton-bg', 'rgb(25, 25, 25)');
    setCssVar('skeleton-item', '#333333');
  }
}
