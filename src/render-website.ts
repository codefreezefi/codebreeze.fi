import { trelloApi } from './trello/api';
import { config } from 'dotenv';
import * as showdown from 'showdown';
import { promises as fs } from 'fs';
import * as path from 'path';

config();

const apiKey = process.env.API_KEY!;
const apiToken = process.env.API_TOKEN!;
const websiteContentList = process.env.WEBSITE_CONTENT_LIST!;

const srcDir = path.join(__dirname, '..', 'src');
const webDir = path.join(__dirname, '..', 'web');

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
    try {
      await fs.stat(webDir);
    } catch {
      await fs.mkdir(webDir);
    }

    const tpl = await fs.readFile(path.join(srcDir, 'index.html'), 'utf-8');
    const targetFile = path.join(webDir, 'index.html');
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
