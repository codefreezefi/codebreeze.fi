import * as showdown from 'showdown'
import * as handlebars from 'handlebars'
import { Card } from '../trello/api'
import { promises as fs } from 'fs'
import * as path from 'path'
import { exec } from 'child_process'

/**
 * Render the website
 */
export const render = async ({
	webDir,
	srcDir,
	cards,
}: {
	cards: Card[]
	webDir: string
	srcDir: string
}) => {
	const contentFromCards = cards.reduce(
		(content, { desc }) => `${content}\n\n${desc}`,
		'',
	)
	const contentAsMarkdown = new showdown.Converter().makeHtml(contentFromCards)
	try {
		await fs.stat(webDir)
	} catch {
		await fs.mkdir(webDir)
	}

	const tpl = await fs.readFile(path.join(srcDir, 'index.html'), 'utf-8')
	const targetFile = path.join(webDir, 'index.html')

	const content = {
		content: contentAsMarkdown,
		gitRev: await exec('git rev-parse HEAD')
			.toString()
			.trim(),
		timestamp: new Date().toISOString(),
	} as const

	await fs.writeFile(targetFile, handlebars.compile(tpl)(content), 'utf-8')
}
