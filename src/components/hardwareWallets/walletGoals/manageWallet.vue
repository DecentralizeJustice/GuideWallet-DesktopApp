<template>
  <div>
    <mainWalletComp
    v-if='gettingStatus'
    v-bind:goal='goal'
    v-bind:goalInfo='goalInfo'
    v-on:goalCompleted='goalCompleted'/>
    <v-row justify="space-around" v-if='!gettingStatus'>
      <v-col cols="6">
        <trezorT
        v-bind:walletInfo='walletInfo'
        v-bind:status='status'/>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import trezorT from '@/components/hardwareWallets/wallets/trezorT.vue'
export default {
  props: ['walletInfo', 'goalInfo'],
  name: 'manageWallet',
  components: {
    trezorT
  },
  data: () => ({
    gettingStatus: false,
    status: [],
    goal: 'getStatus'
  }),
  methods: {
    goalCompleted: function (goal, info) {
      if (goal === 'getStatus') {
        this.status = info.status
        this.gettingStatus = false
      }
    }
  },
  computed: {
  },
  async mounted () {
    this.gettingStatus = true
  }
}
</script>
