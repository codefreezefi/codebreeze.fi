import fetch from 'node-fetch';

export const trelloApi = ({
  apiKey,
  apiToken,
}: {
  apiKey: string
  apiToken: string,
}) => {
  const query = ({ res }: { res: string }) =>
    fetch(
      `https://api.trello.com/1/${res}?key=${apiKey}&token=${apiToken}`,
    ).then(res => res.json());
  return {
    lists: {
      cards: ({ list }: { list: string }) =>
        query({ res: `lists/${list}/cards` }) as Promise<
          { name: string; desc: string }[]
        >,
    },
  };
};
