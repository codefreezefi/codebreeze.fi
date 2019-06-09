import { trelloApi } from '../trello/api'

/**
 * Sets up the Trello Webhooks so that if a card is changed or added the the website content list
 * a Netlify deploy will be triggered.
 */
export const setUpWebhooks = ({
  cards,
  websiteContentList,
  netlifyWebhook,
  apiKey,
  apiToken,
}: {
  cards: { id: string; name: string }[]
  websiteContentList: string
  netlifyWebhook: string
  apiKey: string
  apiToken: string,
}) => {
  const api = trelloApi({ apiKey, apiToken })
  return api.tokens
    .token({ token: apiToken })
    .webhooks()
    .then(webhooks =>
      Promise.all(webhooks.map(({ id }) => api.webhook({ id }).delete())),
    ) // Delete existing webhooks
    .then(() =>
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
    .then(() => api.tokens.token({ token: apiToken }).webhooks())
}
