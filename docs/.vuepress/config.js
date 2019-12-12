module.exports = {
  title: "松直的博客",
  themeConfig: {
    nav: [
      {
        text: "首页",
        link: "/"
      },
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
      }
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
          text: "松直 © 2019",
          link: ""
        }
      ]
    },
    paginationComponent: "SimplePagination"
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
    ],
    [
      "@vuepress/blog",
      {
        directories: [
          {
            // Unique ID of current classification
            id: "post",
            // Target directory
            dirname: "_posts",
            // Path of the `entry page` (or `list page`)
            path: "/"
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
        }
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
