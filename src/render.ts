import { Card } from './trello/api'
import * as path from 'path'
import { readFromFileCache } from './cache/cache-to-file'
import { render } from './website/render'

const srcDir = path.join(__dirname, '..', 'src')
const webDir = path.join(__dirname, '..', 'web')
const cacheLocation = path.join(webDir, 'cards.json')
const readCachedCards = readFromFileCache<Card[]>(cacheLocation)

readCachedCards()
	.then(cards =>
		render({
			cards,
			webDir,
			srcDir,
		}),
	)
	.then(() => {
		console.log('website generated successfully')
	})
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
