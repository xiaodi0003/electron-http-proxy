import { ref } from 'vue';
import zhCN from '../locales/zh-CN';
import enUS from '../locales/en-US';

const locales: Record<string, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const currentLocale = ref(localStorage.getItem('locale') || 'zh-CN');

export function useI18n() {
  const t = (key: string) => {
    const messages = locales[currentLocale.value] || locales['zh-CN'];
    return messages[key] || key;
  };

  const setLocale = (locale: string) => {
    currentLocale.value = locale;
    localStorage.setItem('locale', locale);
    window.location.reload();
  };

  const getLocale = () => {
    return currentLocale.value;
  };

  return {
    t,
    setLocale,
    getLocale,
  };
}
