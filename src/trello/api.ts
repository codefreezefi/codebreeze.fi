import fetch, { RequestInit } from 'node-fetch'
import * as querystring from 'querystring'

export const trelloApi = ({
  apiKey,
  apiToken,
}: {
  apiKey: string
  apiToken: string,
}) => {
  const apiEndpoint = 'https://api.trello.com/1'

  const f = ({
    res,
    query,
    options,
  }: {
    res: string
    query?: { [key: string]: any }
    options?: RequestInit,
  }) =>
    fetch(
      `${apiEndpoint}/${res}?${querystring.stringify({
        ...query,
        key: apiKey,
        token: apiToken,
      })}`,
      options,
    )

  const query = (args: { res: string }) => f(args).then(res => res.json())

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
        query({ res: `lists/${list}/cards` }) as Promise<
          { id: string; name: string; desc: string }[]
        >,
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
              active: boolean,
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
        active: boolean,
      }) =>
        post({
          res: 'webhooks',
          query,
        }),
    },
  }
}
