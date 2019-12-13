<template>
  <div
    class="header-title"
    v-if="$page.title"
  >
    <a class="title-content" href="#">{{$page.title}}</a>
    <span class="right-part">
      <span>{{new Date($page.frontmatter.date).toLocaleDateString()}}</span>
    </span>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="stylus" scoped>
.header-title {
  display: inline-block;
  left: calc(50vw - 450px);
  position: absolute;
  width: 900px;
  font-family: '思源宋体', 'Times New Roman', '华文中宋', '宋体', serif;

  .title-content {
    font-size: 1.2em;
    text-transform: capitalize;

    &:hover {
      text-decoration: none;
    }
  }
}

@media screen and (max-width: 960px) {
  .header-title {
    display: none;
  }
}

.right-part {
  float: right;
  font-size: 0.75em;
}
</style>