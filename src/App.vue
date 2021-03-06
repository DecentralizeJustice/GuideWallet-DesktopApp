<template>
  <v-app>
    <navDrawer app/>
    <v-main>
      <transition name="fade">
        <v-container fluid fill-height
          align-content='center' justify='center'
          :style="btnStyles"
        >
          <router-view/>
        </v-container>
      </transition>
          <v-dialog
            v-model="showDialog"
            width="800"
            persistent
            overlay-opacity='90'
            class="text-center"
          >
            <updateWindow @downloadUpdate='downloadUpdate'
            v-bind:readyToShutdown="readyToShutdown"
            v-bind:updateAvailable="updateAvailable"
            v-bind:updateStarted='updateStarted'
            v-bind:torReady='torReady'/>
          </v-dialog>
    </v-main>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex'
import back from '@/assets/photos/background.jpg'
import navDrawer from '@/components/general/navDrawer.vue'
import updateWindow from '@/components/general/update.vue'
import { dormant, circuitEstablished } from '@/assets/util/tor.js'
import {
  hardStopDeamon, permissionElectrum, unpackElectrum
} from '@/assets/util/btc/electrum/general.js'
import {
  unpackBinary
} from '@/assets/util/hwi/general.js'
import {
  unpackMainBinary
} from '@/assets/util/trezorCli/general.js'
const appVersion = require('../package.json').version
const electron = window.require('electron')
const ipcRenderer = electron.ipcRenderer
const isDevelopment = process.env.NODE_ENV !== 'production'
const R = require('ramda')
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))
export default {
  name: 'App',
  components: {
    navDrawer,
    updateWindow
  },
  data: () => ({
    waitTime: 5,
    torReady: false,
    torDormant: false,
    torCircuitReady: false,
    updateAvailable: false,
    readyToShutdown: false,
    updateStarted: false
  }),
  methods: {
    copyBinary: async function () {
      if (this.singleSigHardwareWalletInfo.vpub !== '') {
        await unpackElectrum()
        await timeout(1000)
        await unpackBinary()
        await timeout(1000)
        await unpackMainBinary()
        await permissionElectrum()
        await hardStopDeamon()
      }
    },
    alsoStartup: async function () {
      this.loop()
      if (process.env.NODE_ENV !== 'development') {
        ipcRenderer.send('CHECK_FOR_UPDATE_PENDING')
        ipcRenderer.on('CHECK_FOR_UPDATE_SUCCESS', (event, updateInfo) => {
          const version = updateInfo.version
          const updateReady = this.shouldUpdate(version, appVersion)
          if (version && updateReady) {
            this.updateAvailable = true
          }
        })
        ipcRenderer.on('CHECK_FOR_UPDATE_FAILURE', () => {
          console.log('failed update')
        })
        ipcRenderer.on('DOWNLOAD_UPDATE_FAILURE', (event, err) => {
          console.log('download failed')
          console.log(err)
        })
      }
    },
    shouldUpdate: function (downloadVersion, currentVersion) {
      const downloadVersionArray = downloadVersion.split('.').map(e => parseInt(e))
      const currentVersionArray = currentVersion.split('.').map(e => parseInt(e))
      if (R.equals(downloadVersionArray, currentVersionArray)) {
        return false
      }
      for (var i = 0; i < downloadVersionArray.length; i++) {
        if (downloadVersionArray[i] > currentVersionArray[i]) {
          return true
        }
        if (downloadVersionArray[i] < currentVersionArray[i]) {
          return false
        }
      }
      return true
    },
    loop: async function () {
      if (isDevelopment || this.torDormant || this.torCircuitReady) {
        this.torReady = true
        return true
      } else {
        this.dormantb()
        this.circuitEstablishedb()
        await this.sleep(this.waitTime * 1000)
        await this.loop()
        console.log('lopping')
      }
    },
    dormantb: function () {
      ipcRenderer.on('dormant34', (event, message) => {
        const status = message.dormant
        if (status === '1\n') {
          this.torDormant = true
        }
      })
      dormant()
    },
    circuitEstablishedb: function () {
      ipcRenderer.on('circuitEstablished34', (event, message) => {
        const status = message.circuitEstablished
        if (status === '1\n') {
          console.log('circuit ready')
          this.torCircuitReady = true
        }
      })
      circuitEstablished()
    },
    sleep: function (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
    async start () {
      try {
        await this.$router.push(
          {
            name: 'announce'
          })
      } catch (err) {
      }
    },
    async downloadUpdate () {
      console.log('update download started')
      ipcRenderer.send('DOWNLOAD_UPDATE_PENDING')
      this.updateStarted = true
      ipcRenderer.on('DOWNLOAD_UPDATE_SUCCESS', () => {
        console.log('update Downloaded')
      })
      ipcRenderer.on('DOWNLOAD_UPDATE_FAILURE', (err) => {
        console.log('update download failed')
        console.log(err)
      })
    }
  },
  computed: {
    showDialog: function () {
      return !this.torReady || this.updateAvailable
    },
    photo: function () {
      return back
    },
    btnStyles: function () {
      return {
        'background-image': `url(${back})`,
        height: '100%',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'background-size': 'cover'
      }
    },
    ...mapGetters('hardwareInfo', [
      'singleSigHardwareWalletInfo'
    ])
  },
  async mounted () {
    this.copyBinary()
    this.start()
    this.alsoStartup()
  }
}
</script>
  <style lang="sass">
    @import '../node_modules/typeface-roboto/index.css'
  </style>
