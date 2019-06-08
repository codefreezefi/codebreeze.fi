import { trelloApi } from './trello/api';
import { config } from 'dotenv';
import * as showdown from 'showdown';
import { promises as fs } from 'fs';
import * as path from 'path';

config();

const apiKey = process.env.API_KEY!;
const apiToken = process.env.API_TOKEN!;
const websiteContentList = process.env.WEBSITE_CONTENT_LIST!;

const fetchContentFromTrello = async () => {
  const cards = await trelloApi({ apiKey, apiToken }).lists.cards({
    list: websiteContentList,
  });
  return cards.map(({ name, desc }) => ({ name, desc }));
};

fetchContentFromTrello()
  .then(cards =>
    cards.reduce((content, { desc }) => `${content}\n\n${desc}`, ''),
  )
  .then(content => new showdown.Converter().makeHtml(content))
  .then(async contentAsMarkdown => {
    const tpl = await fs.readFile(
      path.join(__dirname, '..', 'src', 'index.html'),
      'utf-8',
    );
    const targetFile = path.join(__dirname, '..', 'web', 'index.html');
    await fs.writeFile(
      targetFile,
      tpl.replace('{{content}}', contentAsMarkdown),
      'utf-8',
    );
    console.log(`${targetFile} written`);
  })
  .then(() => {
    console.log('website generated successfully');
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
