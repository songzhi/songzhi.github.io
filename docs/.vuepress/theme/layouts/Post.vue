<template>
  <div id="vuperess-theme-blog__post-layout">
    <div class="vuepress-blog-theme-content">
      <Content />
      <hr />
      <Comment v-if="!isDev" />
    </div>
    <Toc />
  </div>
</template>

<script>
import Toc from '@theme/components/Toc.vue'
import { Comment } from '@vuepress/plugin-blog/lib/client/components'

export default {
  components: {
    Toc,
    Comment,
  },
  computed: {
    isDev() {
      return process.env.NODE_ENV === 'development'
    }
  }
}
</script>

<style lang="stylus">
@require '../styles/wrapper.styl';

.vuepress-blog-theme-content {
  @extend $wrapper;

  @media (min-width: 960px) {
    padding: 1.5rem;
    font-size: 1.15rem;
  }
}
</style>

<style src="prismjs/themes/prism-okaidia.css"></style>

