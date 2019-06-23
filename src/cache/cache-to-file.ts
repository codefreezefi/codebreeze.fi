import { promises as fs } from 'fs'

export const cacheToFile = <T>(cacheLocation: string) => async (data: T) => {
	await fs.writeFile(cacheLocation, JSON.stringify(data), 'utf-8')
	return data
}

export const readFromFileCache = <T>(
	cacheLocation: string,
) => async (): Promise<T> => {
	return JSON.parse(await fs.readFile(cacheLocation, 'utf-8')) as T
}
