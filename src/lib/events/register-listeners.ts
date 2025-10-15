import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

const currentDir = process.cwd();

export async function registerAllListeners(
	startDir: string = currentDir,
): Promise<void> {
	try {
		console.log('Starting listener registration process...');

		const projectRoot = findSrc(startDir);
		if (!projectRoot) {
			console.log(
				'No `src` directory found in the project. `src` directory is required for finding listeners',
			);
			return;
		}

		console.log(`Project root: ${projectRoot}`);

		const listenerFiles = await findListenerFiles(projectRoot);
		if (listenerFiles.length === 0) {
			console.log('No listener files found.');
			return;
		}

		let processedCount = 0;
		let executedCount = 0;

		for (const filePath of listenerFiles) {
			try {
				await executeRegisterListeners(filePath);
				executedCount++;
			} catch (error) {
				console.error(`Error processing file ${filePath}:`, error);
			}
			processedCount++;
		}

		console.log(`Registration complete`);
		console.log(`Processed: ${processedCount} files`);
		console.log(`Executed: ${executedCount} listeners`);
	} catch (error) {
		console.error('Error in registerListeners:', error);
	}
}

function findSrc(dirPath: string): string | null {
	if (!fs.lstatSync(path.resolve(dirPath)).isDirectory()) {
		console.error(`${dirPath} is not a directory.`);
		return null;
	}

	if (dirPath.endsWith('/src')) {
		return dirPath;
	}

	const ls = fs.readdirSync(dirPath);

	for (const entry of ls) {
		if (
			fs.lstatSync(path.join(dirPath, entry)).isDirectory() &&
			entry === 'src'
		) {
			return path.join(dirPath, 'src');
		}
	}

	if (ls.includes('package.json')) {
		return null;
	}

	const parentDir = path.resolve(dirPath, '..');
	if (parentDir !== dirPath) {
		return findSrc(parentDir);
	}

	return null;
}

async function findListenerFiles(rootDir: string): Promise<string[]> {
	const searchPattern = path.join(rootDir, '**/*.listener.{js,ts}');
	console.log('Searching in directory:', searchPattern);

	try {
		const files = await glob(searchPattern, {
			absolute: true,
		});
		console.log(`Found ${files.length} listener files`);
		return files;
	} catch (error) {
		console.error('Error finding listener files:', error);
		return [];
	}
}

async function executeRegisterListeners(filePath: string): Promise<void> {
	try {
		console.log(`Executing registerListeners from: ${filePath}`);

		const module = await import(filePath);

		if (typeof module.registerListeners === 'function') {
			await module.registerListeners();
			console.log(`Executed registerListeners from ${path.basename(filePath)}`);
			return;
		}

		if (typeof module.default?.registerListeners === 'function') {
			await module.default.registerListeners();
			console.log(
				`Executed registerListeners from ${path.basename(filePath)} (default export)`,
			);
			return;
		}

		console.warn(
			`registerListeners function not found in ${path.basename(filePath)}`,
		);
	} catch (error) {
		console.error(`Error executing registerListeners from ${filePath}:`, error);
	}
}
