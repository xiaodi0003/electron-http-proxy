import { defineStore } from 'pinia';

export interface Settings {
  colorWeak?: boolean;
  contentWidth?: 'Fluid' | 'Fixed';
  navTheme?: 'light' | 'dark';
  layout?: 'sidemenu' | 'topmenu';
}

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    colorWeak: false,
    contentWidth: 'Fluid',
    navTheme: 'dark',
    layout: 'sidemenu',
  }),

  actions: {
    changeSetting(payload: Partial<Settings>) {
      const { colorWeak, contentWidth } = payload;

      if (this.contentWidth !== contentWidth && window.dispatchEvent) {
        window.dispatchEvent(new Event('resize'));
      }
      
      if (colorWeak !== undefined) {
        this.updateColorWeak(colorWeak);
      }
      
      Object.assign(this, payload);
    },

    updateColorWeak(colorWeak: boolean) {
      const root = document.getElementById('root');
      if (root) {
        root.className = colorWeak ? 'colorWeak' : '';
      }
    },
  },
});
