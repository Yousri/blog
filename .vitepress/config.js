import { defineConfig } from 'vitepress'
import { getPosts } from './theme/serverUtils'

//每页的文章数量
const pageSize = 8

export default defineConfig({
    title: 'Blog By Yousri',
    base: '/',
    cacheDir: './node_modules/vitepress_cache',
    description: 'blog about notes,salogs,tech,cloudnative,k8s,Cloud Service Provider,CSP',
    ignoreDeadLinks: true,
    themeConfig: {
        posts: await getPosts(pageSize),
        website: 'https://twitter.com/yousri', //copyright link
        // 评论的仓库地址
        comment: {
            repo: 'imyousri/imyousri.github.com',
            themes: 'github-light',
            issueTerm: 'pathname'
        },
        nav: [
            { text: 'Home', link: 'https://yousri.org' },
            { text: 'Posts', link: '/' },
            { text: 'Archives', link: '/pages/archives' },
            { text: 'Tags', link: '/pages/tags' },
            { text: 'About', link: '/pages/about' }
            // { text: 'Airene', link: 'http://airene.net' }  -- External link test
        ],
        search: {
            provider: 'local',
        },
        //outline:[2,3],
        outlineTitle: '文章摘要',
        socialLinks: [
	    //{ icon: 'github', link: 'https://github.com/yousri' },
	    { icon: 'twitter', link: 'https://twitter.com/yousri' },
	    { icon: 'instagram', link: 'https://instagram.com/imyousri' },
	]
    },
    srcExclude: ['README.md'], // exclude the README.md , needn't to compiler

    vite: {
        //build: { minify: false }
        server: { port: 5001 }
    }
    /*
      optimizeDeps: {
          keepNames: true
      }
      */
})
