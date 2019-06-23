import { Card, trelloApi } from './trello/api'
import { config } from 'dotenv'
import * as path from 'path'
import { setUpWebhooks } from './trello-netlify-bridge/setUpWebhooks'
import { cacheToFile } from './cache/cache-to-file'
import { render } from './website/render'

config()

const apiKey = process.env.API_KEY!
const apiToken = process.env.API_TOKEN!
const websiteContentList = process.env.WEBSITE_CONTENT_LIST!
const netlifyWebhook = process.env.NETLIFY_WEBHOOK!

const srcDir = path.join(__dirname, '..', 'src')
const webDir = path.join(__dirname, '..', 'web')
const cacheLocation = path.join(webDir, 'cards.json')
const cacheCards = cacheToFile<Card[]>(cacheLocation)
const t = trelloApi({ apiKey, apiToken })

t.lists
	.cards({
		list: websiteContentList,
	})
	.then(cards =>
		Promise.all(
			cards.map(card =>
				card.badges.attachments > 0
					? t
							.card({ id: card.id })
							.attachments()
							.then(attachments => ({
								...card,
								attachments,
							}))
					: Promise.resolve(card),
			),
		),
	)
	.then(cards =>
		Promise.all([
			// Cache cards
			cacheCards(cards),
			// Render the website
			render({
				cards,
				webDir,
				srcDir,
			}).then(() => {
				console.log('website generated successfully')
			}),
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
