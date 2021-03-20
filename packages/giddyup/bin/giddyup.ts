#!/usr/bin/env node

import fs from "fs-extra"
import slugify from "slugify"
import fsUtils from "fs-utils"
import chalk from "chalk"
import ora from "ora"
import spawn from "cross-spawn"
import inquirer from "inquirer"


const isEthAddress = (address) => {
    if ((/^(0x){1}[0-9a-fA-F]{40}$/i.test(address)) == false) {
        console.log('Enter a valid wallet address.')
        return process.exit(1)
    } else {
        return address
    }
}

;(async () => {
  console.log()
  console.log("RODEO BANNER")
  console.log()

  inquirer
    .prompt([
      {
        type: "input",
        name: "projectName",
        message: "What's the name of your project?",
      },
      {
        type: "input",
        name: "walletAddress",
        message: "Enter a wallet address.",
      }
    ])
    .then(async (answers) => {
      const dir = process.cwd()
      const projectName = slugify(answers.projectName, {
        remove: /[!@#$%^&*()_+|}{:"?><\[\];',./}]/g,
      })

      const walletAddress = isEthAddress(answers.walletAddress)

      const projectDir = `${dir}/${projectName}`

      const initializing = ora(`Initializing Project ${projectName}`).start()

      await fs
        .copy(`${__dirname}/template/rodeo.js`, `${projectDir}/rodeo.js`)
        .catch(console.log)

      await fs
        .copy(`${__dirname}/template/styles`, `${projectDir}/styles`)
        .catch(console.log)

      await fs
        .copy(`${__dirname}/template/site`, `${projectDir}/site`)
        .catch(console.log)

      await fsUtils.writeFileSync(
        `${projectDir}/package.json`,
        `
      {
        "name": "${projectName}",
        "wallet": "${walletAddress}",
        "version": "0.0.1",
        "description": "",
        "scripts": {
          "build": "rodeo build",
          "dev": "rodeo dev",
          "tokens": "rodeo tokens ${walletAddress}"
        },
        "keywords": [],
        "author": "",
        "license": "",
        "devDependencies": {
          "@giddyup/cli": "^0.0.5"
        }
      }`
      )

      initializing.succeed("Initialized")

      console.log()
      console.log("Installing Dependencies")
      console.log()

      process.chdir(`./${projectName}`)

      await spawnAsync(`yarn`, ["install"], {
        stdio: "inherit",
      }).catch((err) => {
        console.error(err)
      })

      console.log()
      console.log(`Rodeo installed into ./${projectName}`)
      console.log()
      console.log("Inside that directory, you can run several commands.")
      console.log()
      console.log("  " + chalk.blueBright("rodeo dev"))
      console.log("    Start the development server")
      console.log()
      console.log("  " + chalk.blueBright("rodeo build"))
      console.log("    Builds the app for production")
      console.log()
      console.log("We suggest that you begin by typing:")
      console.log()
      console.log("  " + chalk.yellowBright("cd" + " " + projectName))
      console.log("  " + chalk.yellowBright("rodeo dev"))
      console.log()
      console.log()
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
      } else {
        // Something else went wrong
      }
    })
})()

async function spawnAsync(program, args, options) {
  options = (Array.isArray(args) ? options : args) || {}
  args = Array.isArray(args) ? args : []
  const code = await new Promise((resolve, reject) => {
    const cp = spawn(program, args, options)
    cp.on("error", (ex) => reject(ex))
    cp.on("close", (code) => resolve(code))
  })
  if (code !== 0) {
    throw new Error(
      `${program}${
        args.length ? ` ${JSON.stringify(args)}` : ""
      } exited with non-zero code ${code}.`
    )
  }
}
