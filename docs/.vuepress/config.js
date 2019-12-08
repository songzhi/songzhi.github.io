module.exports = {
  title: "松直的博客",
  themeConfig: {
    sidebar: "auto",
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
  head: [["link", { rel: "icon", href: "/logo.png" }]],
  plugins: [
    "@vuepress/active-header-links",
    "@vuepress/back-to-top",
    "@vuepress/medium-zoom",
    "@vuepress/nprogress"
  ]
};
