import fetch, { RequestInit } from 'node-fetch'
import * as querystring from 'querystring'

export type Card = {
	id: string
	name: string
	desc: string
	badges: {
		attachments: number
	}
	customFieldItems?: CustomFieldItem[]
	attachments?: Attachment[]
}

// https://developers.trello.com/docs/getting-started-custom-fields#section-custom-field-values-on-cards
export type CustomFieldItem = {
	id: string
	value: {
		text?: string
		number?: string
		date?: string
		checked?: 'true'
		list?: string[]
	}
	idCustomField: string
	idModel: string
	modelType: 'card' | 'board'
}

export type Attachment = {
	id: string
	bytes: number
	date: string
	edgeColor: string
	idMember: string
	isUpload: boolean
	mimeType: string
	name: string
	previews: {
		bytes: number
		url: string
		height: number
		width: number
		_id: number
		scaled: boolean
	}[]
	url: string
	pos: number
}

export const trelloApi = ({
	apiKey,
	apiToken,
}: {
	apiKey: string
	apiToken: string
}) => {
	const apiEndpoint = 'https://api.trello.com/1'

	const f = ({
		res,
		query,
		options,
	}: {
		res: string
		query?: { [key: string]: any }
		options?: RequestInit
	}) =>
		fetch(
			`${apiEndpoint}/${res}?${querystring.stringify({
				...query,
				key: apiKey,
				token: apiToken,
			})}`,
			options,
		)

	const query = (args: { res: string; query?: { [key: string]: any } }) =>
		f(args).then(res => res.json())

	const del = (args: { res: string }) =>
		f({
			...args,
			options: { method: 'DELETE' },
		})
	const post = (args: { res: string; query?: { [key: string]: any } }) =>
		f({
			...args,
			options: { method: 'POST' },
		})

	return {
		lists: {
			cards: ({ list }: { list: string }) =>
				query({
					res: `lists/${list}/cards`,
					query: {
						customFieldItems: true,
					},
				}) as Promise<Card[]>,
		},
		tokens: {
			token: ({ token }: { token: string }) => ({
				webhooks: () =>
					query({ res: `tokens/${token}/webhooks` }) as Promise<
						{
							id: string
							description: string
							idModel: string
							callbackURL: string
							active: boolean
						}[]
					>,
			}),
		},
		webhook: ({ id }: { id: string }) => ({
			delete: () => del({ res: `webhook/${id}` }),
		}),
		webhooks: {
			create: (query: {
				description?: string
				callbackURL: string
				idModel: string
				active: boolean
			}) =>
				post({
					res: 'webhooks',
					query,
				}),
		},
		card: ({ id }: { id: string }) => ({
			attachments: () =>
				query({ res: `cards/${id}/attachments` }) as Promise<Attachment[]>,
		}),
	}
}
