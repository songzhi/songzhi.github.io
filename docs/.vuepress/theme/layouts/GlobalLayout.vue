<template>
  <div id="vuperess-theme-blog__global-layout">
    <Header />
    <MobileHeader
      :isOpen="isMobileHeaderOpen"
      @toggle-sidebar="isMobileHeaderOpen = !isMobileHeaderOpen"
    />
    <div
      class="TitleImage TitleImage--FullScreen"
      :style="{'background-image':`url(${$frontmatter.titleImage})`}"
      v-if="$frontmatter.titleImage"
    ></div>
    <div
      class="content-wrapper"
      @click="isMobileHeaderOpen = false"
    >
      <DefaultGlobalLayout />
    </div>
    <Footer />
  </div>
</template>

<script>
import GlobalLayout from '@app/components/GlobalLayout.vue'
import Header from '@theme/components/Header.vue'
import MobileHeader from '@theme/components/MobileHeader.vue'
import Footer from '@theme/components/Footer.vue'

export default {
  components: {
    DefaultGlobalLayout: GlobalLayout,
    Header,
    MobileHeader,
    Footer
  },

  data() {
    return {
      isMobileHeaderOpen: false
    }
  },

  mounted() {
    this.$router.afterEach(() => {
      this.isMobileHeaderOpen = false
    })
  }
}
</script>

<style lang="stylus">
.content-wrapper {
  padding: 0 15px 80px 15px;
  min-height: calc(100vh - 80px - 60px - 96px);
  max-width: 960px;
  margin: 0 auto;
  margin-top: 96px;
}

@media (max-width: $MQMobile) {
  .content-wrapper {
    padding: 0px 15px 20px 15px;
    min-height: calc(100vh - 20px - 60px - 0px);
  }
}
</style>
