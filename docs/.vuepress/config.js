module.exports = {
  title: "松直的博客",
  themeConfig: {
    nav: [
      {
        text: "技术",
        link: "/tag/tech/"
      },
      {
        text: "想法",
        link: "/tag/idea/"
      },
      {
        text: "所有标签",
        link: "/tag/"
      },
      // {W
      //   text: "Posts",
      //   link: "/en/"
      // }
    ],
    footer: {
      contact: [
        {
          type: "github",
          link: "https://github.com/songzhi"
        },
        {
          type: "web",
          link: "https://www.zhihu.com/people/songzhili"
        }
      ],
      copyright: [
        {
          text: "松直 © 2020",
          link: "/"
        }
      ]
    },
    paginationComponent: "SimplePagination"
  },
  locales: {
    "/": {
      lang: "zh-CN"
    },
    "/en/": {
      lang: "en-US", // 将会被设置为 <html> 的 lang 属性
      title: "Songzhi's blog",
      description: "Songzhi's blog"
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
    ],
    [
      "script",
      {
        src: "https://hm.baidu.com/hm.js?65ab136d5be5d58c0be7a396bd05a3cd",
        async: true
      }
    ]
  ],
  plugins: [
    "@vuepress/active-header-links",
    "@vuepress/back-to-top",
    [
      "@vuepress/medium-zoom",
      {
        selector: ".content__default :not(a) > img"
      }
    ],
    "@vuepress/nprogress",
    [
      "vuepress-plugin-container",
      {
        type: "details",
        before: info =>
          `<details class="custom-block details"><summary>${info}</summary>`,
        after: "</details>"
      }
    ],
    [
      "@vuepress/blog",
      {
        directories: [
          {
            id: "zh",
            dirname: "_zh",
            path: "/",
            itemLayout: "Post",
            itemPermalink: "/zh/:year/:month/:day/:slug",
            frontmatter: { title: "所有文章" }
          },
          {
            id: "en",
            dirname: "_en",
            path: "/en/",
            itemLayout: "Post",
            itemPermalink: "/en/:year/:month/:day/:slug",
            frontmatter: { title: "Posts" }
          }
        ],
        frontmatters: [
          {
            id: "tag",
            keys: ["tag", "tags"],
            path: "/tag/",
            // layout: 'Tag',  defaults to `FrontmatterKey.vue`
            frontmatter: { title: "Tag" },
            pagination: {
              lengthPerPage: 5
            }
          }
        ],
        comment: {
          // Which service you'd like to use
          service: "vssue",
          // The owner's name of repository to store the issues and comments.
          owner: "songzhi",
          // The name of repository to store the issues and comments.
          repo: "songzhi.github.io",
          // The clientId & clientSecret introduced in OAuth2 spec.
          clientId: "f7a820943c1e739c08ed",
          clientSecret: "55c43562d938f64856378c537778fa7f0f0a2e2f",
          autoCreateIssue: true,
          prefix: "[Post]"
        },
        paginationComponent: "SimplePagination"
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
