import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'
Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: '#1976D2',
        secondary: colors.deepPurple.darken3
      }
    }
  }
})
