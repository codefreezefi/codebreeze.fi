import { trelloApi } from './trello/api'
import { config } from 'dotenv'
import * as showdown from 'showdown'
import { promises as fs } from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as handlebars from 'handlebars'
import { setUpWebhooks } from './trello-netlify-bridge/setUpWebhooks'

config()

const apiKey = process.env.API_KEY!
const apiToken = process.env.API_TOKEN!
const websiteContentList = process.env.WEBSITE_CONTENT_LIST!
const netlifyWebhook = process.env.NETLIFY_WEBHOOK!

const srcDir = path.join(__dirname, '..', 'src')
const webDir = path.join(__dirname, '..', 'web')

trelloApi({ apiKey, apiToken })
  .lists.cards({
    list: websiteContentList,
  })
  .then(cards =>
    Promise.all([
      // Render the website
      (async cards => {
        const contentFromCards = cards.reduce(
          (content, { desc }) => `${content}\n\n${desc}`,
          '',
        )
        const contentAsMarkdown = new showdown.Converter().makeHtml(
          contentFromCards,
        )
        try {
          await fs.stat(webDir)
        } catch {
          await fs.mkdir(webDir)
        }

        const tpl = await fs.readFile(path.join(srcDir, 'index.html'), 'utf-8')
        const targetFile = path.join(webDir, 'index.html')

        const content = {
          content: contentAsMarkdown,
          gitRev: execSync('git rev-parse HEAD')
            .toString()
            .trim(),
          release: execSync('git tag -l --points-at HEAD')
            .toString()
            .trim(),
          timestamp: new Date().toISOString(),
        } as const

        await fs.writeFile(
          targetFile,
          handlebars.compile(tpl)(content),
          'utf-8',
        )
        console.log(`${targetFile} written`)
        console.log('website generated successfully')
      })(cards),
      // Update webhooks
      setUpWebhooks({
        cards,
        websiteContentList,
        netlifyWebhook,
        apiToken,
        apiKey,
      }).then(webhooks => {
        console.log('Active webhooks:')
        webhooks.forEach(({ id, description, active }) => {
          console.log(
            `${id} (${active ? 'active' : 'inactive'}): ${description} `,
          )
        })
      }),
    ]),
  )
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
