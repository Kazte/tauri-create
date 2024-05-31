#!/usr/bin/env node

import fs, { existsSync, mkdirSync } from 'fs';
import yargs, { Arguments } from 'yargs';

import cp from 'child_process';
import { hideBin } from 'yargs/helpers';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { promisify } from 'util';

const argv = yargs(hideBin(process.argv))
  .options({
    name: {
      type: 'string',
      description: 'Name of the project',
      alias: 'n',
      demandOption: true
    }
  })
  .parse();

// check if is running in dev mode
const isDev = existsSync(path.resolve(__dirname, '../src'));
if (isDev) {
  console.log('Running in dev mode');
  console.log(argv);
}

const exec = promisify(cp.exec);
const rm = promisify(fs.rm);

const projectName = argv.name;
const currentPath = process.cwd();
const projectPath = path.join(currentPath, projectName);
const gitRepo =
  'https://github.com/Kazte/tauri-react-tailwind-shadcn-boilerplate';

const spinner = ora('Creating project').start();

const clone = async () => {
  if (!projectName || projectName === '') {
    throw new Error('Project name is required');
  }

  if (existsSync(projectPath)) {
    throw new Error('Project already exists');
  }

  await exec(`git clone ${gitRepo} ${projectPath}`);
  spinner.succeed('Project created');
};

const removeGit = async () => {
  spinner.start('Finalizing project');
  await rm(`${projectPath}/.git`, { recursive: true, force: true });
  // change package.json name
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = require(packageJsonPath);
  packageJson.name = projectName;
  spinner.succeed('Finalizing project');
};

const install = async () => {
  spinner.start('Installing dependencies');

  spinner.stop();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Select a package manager',
      choices: ['yarn', 'npm', 'pnpm', "Don't install"],
      default: 'yarn'
    }
  ]);

  spinner.start('Installing dependencies');

  const packageManager = answers.packageManager;

  if (packageManager === "Don't install") {
    spinner.succeed('Dependencies not installed');
    return;
  }

  await exec(`cd ${projectPath} && ${packageManager} install`);

  spinner.succeed('Dependencies installed');
};

const run = async () => {
  try {
    await clone();
    await removeGit();
    await install();
  } catch (error: any) {
    spinner.fail(error.message);
  }
};

run();
