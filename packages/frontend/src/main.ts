import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { mdiMenu, mdiClose, mdiChevronRight, mdiChevronDown, mdiPlus, mdiDelete, mdiPencil } from '@mdi/js';

import App from './App.vue';
import './app.css';
import 'vuetify/styles';
import 'font-awesome/css/font-awesome.min.css';

const app = createApp(App);

// Vuetify setup
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          warning: '#FB8C00',
          info: '#2196F3',
          success: '#4CAF50',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    values: {
      mdi: {
        menu: mdiMenu,
        close: mdiClose,
        chevronRight: mdiChevronRight,
        chevronDown: mdiChevronDown,
        plus: mdiPlus,
        delete: mdiDelete,
        pencil: mdiPencil,
      },
    },
  },
});

// Pinia store
const pinia = createPinia();

app.use(pinia);
app.use(vuetify);

app.mount('#app');

