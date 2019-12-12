<template>
  <div id="base-list-layout">
    <div class="ui-posts">
      <article
        class="ui-post"
        v-for="page in pages"
      >
        <div class="ui-post-title">
          <NavLink :link="page.path">{{ page.title }}</NavLink>
        </div>
        <div class="ui-post-summary">
          {{ page.frontmatter.summary || page.summary }}
          <!-- <Content :page-key="page.key" slot-key="intro"/>-->
        </div>

        <div
          class="ui-post-author"
          v-if="page.frontmatter.author"
        >
          <NavigationIcon />
          <span>{{ page.frontmatter.author }} in {{ page.frontmatter.location }}</span>
        </div>

        <div
          class="ui-post-date"
          v-if="page.frontmatter.date"
        >
          <ClockIcon />
          <span>{{ resovlePostDate(page.frontmatter.date) }}</span>
          <a
            v-for="t in getTags(page)"
            class="ui-post-tag"
            :href="`/tag/${t}/`"
          >#{{t}}</a>
        </div>
      </article>
    </div>

    <component
      v-if="$pagination.length > 1 && paginationComponent"
      :is="paginationComponent"
    ></component>
  </div>
</template>

<script>
/* global THEME_BLOG_PAGINATION_COMPONENT */

import Vue from 'vue'
import { NavigationIcon, ClockIcon } from 'vue-feather-icons'
import { Pagination, SimplePagination } from '@vuepress/plugin-blog/lib/client/components'

export default {
  components: { NavigationIcon, ClockIcon },

  data() {
    return {
      paginationComponent: null
    }
  },

  created() {
    this.paginationComponent = this.getPaginationComponent()
  },

  computed: {
    pages() {
      return this.$pagination.pages
    },
  },

  methods: {
    getPaginationComponent() {
      const n = THEME_BLOG_PAGINATION_COMPONENT
      if (n === 'Pagination') {
        return Pagination
      }

      if (n === 'SimplePagination') {
        return SimplePagination
      }

      return Vue.component(n) || Pagination
    },

    resovlePostDate(date) {
      return new Date(date.replace(/\-/g, "/").trim()).toLocaleDateString()
    },
    getTags(page) {
      let tags = []
      if (page.frontmatter.tag)
        tags.push(page.frontmatter.tag)
      if (page.frontmatter.tags)
        tags.concat(page.frontmatter.tags)
      return tags
    }
  }
}
</script>

<style lang="stylus">
.common-layout {
  .content-wrapper {
    padding-bottom: 80px;
  }
}

.ui-post {
  padding-bottom: 25px;
  margin-bottom: 25px;
  border-bottom: 1px solid #f1f1f1;

  &:last-child {
    border-bottom: 0px;
    margin-bottom: 0px;
  }

  p {
    margin: 0;
  }
}

.ui-post-title {
  font-family: Serif;
  font-size: 28px;
  border-bottom: 0;
  text-transform: capitalize;

  a {
    cursor: pointer;
    color: #000;
    transition: all 0.2s;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.ui-post-summary {
  font-size: 14px;
  margin-bottom: 10px;
  color: rgba(0, 0, 0, 0.88);
  font-weight: 200;
}

.ui-post-author {
  display: flex;
  align-items: center;
  font-size: 12px;
  line-height: 12px;
  color: rgba(0, 0, 0, 0.84);
  margin-bottom: 3px;
  font-weight: 400;

  svg {
    margin-right: 5px;
    width: 14px;
    height: 14px;
  }
}

.ui-post-date {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
  font-weight: 200;

  svg {
    margin-right: 5px;
    width: 14px;
    height: 14px;
  }
}

.ui-post-tag {
  font-size: 0.95rem;
  color: #444;
  margin-left: 8px;
  font-weight: 400;
  text-transform: capitalize;
}
</style>

<style src="prismjs/themes/prism-okaidia.css"></style>


