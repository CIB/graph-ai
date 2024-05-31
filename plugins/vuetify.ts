import { createVuetify } from 'vuetify';

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    // your config will come here
    theme: {
      defaultTheme: 'dark',
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
