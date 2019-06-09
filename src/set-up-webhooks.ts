import { trelloApi } from './trello/api'
import { config } from 'dotenv'

config()

const apiKey = process.env.API_KEY!
const apiToken = process.env.API_TOKEN!
const websiteContentList = process.env.WEBSITE_CONTENT_LIST!
const netlifyWebhook = process.env.NETLIFY_WEBHOOK!

const api = trelloApi({ apiKey, apiToken })

Promise.all([
  // Delete existing webhooks
  api.tokens
    .token({ token: apiToken })
    .webhooks()
    .then(webhooks =>
      Promise.all(webhooks.map(({ id }) => api.webhook({ id }).delete())),
    ),
  // Fetch cards
  api.lists.cards({
    list: websiteContentList,
  }),
])
  .then(([_, cards]) =>
    Promise.all([
      // Notify about changes on cards in the list
      ...cards.map(({ id, name }) =>
        api.webhooks.create({
          active: true,
          callbackURL: netlifyWebhook,
          description: `Notify Netlify if ${name} card has changed`,
          idModel: id,
        }),
      ),
      // Notify about changes to the list
      api.webhooks.create({
        active: true,
        callbackURL: netlifyWebhook,
        description: `Notify Netlify if Website Content list has changed`,
        idModel: websiteContentList,
      }),
    ]),
  )
  .then(() =>
    api.tokens
      .token({ token: apiToken })
      .webhooks()
      .then(webhooks => {
        console.log(webhooks)
      }),
  )
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
