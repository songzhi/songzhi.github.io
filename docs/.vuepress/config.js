module.exports = {
  title: "松直的博客",
  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "技术", link: "/tech/" },
      { text: "想法", link: "/idea/" }
    ]
  },
  locales: {
    "/": {
      lang: "zh-CN"
    }
  },
  head: [
    ["link", { rel: "icon", href: "/logo.png" }],
    [
      "link",
      {
        href: "https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.css",
        rel: "stylesheet",
        integrity:
          "sha384-zB1R0rpPzHqg7Kpt0Aljp8JPLqbXI3bhnPWROx27a9N0Ll6ZP/+DiW/UqRcLbRjq",
        crossorigin: "anonymous"
      }
    ]
  ],
  plugins: [
    "@vuepress/active-header-links",
    "@vuepress/back-to-top",
    "@vuepress/medium-zoom",
    "@vuepress/nprogress",
    [
      "vuepress-plugin-container",
      {
        type: "details",
        before: info =>
          `<details class="custom-block details"><summary>${info}</summary>`,
        after: "</details>"
      }
    ]
  ],
  markdown: {
    extendMarkdown: md => {
      // 使用更多的 markdown-it 插件!
      md.use(require("markdown-it-footnote"));
      md.use(require("@liradb2000/markdown-it-katex"));
      md.use(require("markdown-it-mark"));
      md.use(require("markdown-it-task-lists"));
    }
  }
};
