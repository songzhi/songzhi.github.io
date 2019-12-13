<template>
  <router-link
    class="blog-tag hvr-fade"
    :to="tag.path"
  >
    {{ tag.name }}
    <span class="badge">{{ tag.pages.length }}</span>
  </router-link>
</template>

<script>
export default {
  props: ['tag'],
}
</script>

<style lang="stylus">
.blog-tag {
  display: inline-flex;
  position: relative;
  align-items: center;
  height: 45px;
  word-break: break-word;
  margin-right: 20px;
  margin-bottom: 20px;
  padding: 0 20px;
  border-radius: 0;
  font-weight: 400;
  text-align: left;
  box-sizing: border-box;
  color: #000;
  border: 2px solid #000;
  text-decoration: none;
  transition: all 0.5s;
  text-transform: capitalize;

  &:hover {
    text-decoration: none;
  }
}

@media screen and (max-width: 768px) {
  .blog-tag {
    font-size: 14px;
    padding: 3px 10px;
    margin-right: 10px;
    margin-bottom: 10px;
  }
}

.badge {
  position: absolute;
  top: 0;
  right: 4px;
  font-size 0.9rem
}
</style>
