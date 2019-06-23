import * as showdown from 'showdown'
import * as handlebars from 'handlebars'
import { Attachment, Card } from '../trello/api'
import { promises as fs } from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const converter = new showdown.Converter({
	simplifiedAutoLink: true,
	excludeTrailingPunctuationFromURLs: true,
	strikethrough: true,
})
const linkAttachment = (attachment: Attachment) =>
	`[${attachment.name}](${attachment.url})`
const isImage = (attachment: Attachment) => /^image\//.test(attachment.mimeType)
const imageAttachment = (
	template: string,
	card: Card,
	attachment: Attachment,
) => {
	const srcset = attachment.previews.reduce(
		(srcset, { width, url }) => ({
			...srcset,
			[`${width}w`]: url,
		}),
		{} as { [key: string]: string },
	)
	return handlebars.compile(template)({
		...attachment,
		srcset: Object.entries(srcset)
			.map(([w, s]) => `${s} ${w}`)
			.join(',\n'),
		alt: card.name,
		content: converter.makeHtml(card.desc),
	})
}

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
	const [tpl, imageAttachmentTemplate] = await Promise.all([
		fs.readFile(path.join(srcDir, 'index.html'), 'utf-8'),
		fs.readFile(path.join(srcDir, 'image.html'), 'utf-8'),
	])
	const targetFile = path.join(webDir, 'index.html')

	const contentFromCards = cards.reduce((content, card) => {
		const { desc, attachments } = card
		content = `${content}\n\n`
		if (attachments && attachments.length) {
			attachments.forEach(attachment => {
				if (isImage(attachment)) {
					content = `${content}\n${imageAttachment(
						imageAttachmentTemplate,
						card,
						attachment,
					)}`
				} else {
					content = `${content}\n${linkAttachment(attachment)}`
				}
			})
		} else {
			content = `${content}\n<section>${converter.makeHtml(desc)}</section>`
		}
		return content
	}, '')

	const content = {
		content: contentFromCards,
		gitRev: execSync('git rev-parse HEAD')
			.toString()
			.trim(),
		timestamp: new Date().toISOString(),
	} as const

	await Promise.all([
		fs.writeFile(targetFile, handlebars.compile(tpl)(content), 'utf-8'),
		fs.writeFile(
			path.join(webDir, 'styles.css'),
			await fs.readFile(path.join(srcDir, 'styles.css')),
			'utf-8',
		),
	])
}
