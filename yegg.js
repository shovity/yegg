#!/usr/bin/env node

const fs = require('fs')
const https = require('https')
const path = require('path')
const crypto = require('crypto')
const jsdom = require('jsdom')
const yargs = require('yargs')

const JSDOM = jsdom.JSDOM
const argv = yargs(process.argv.slice(2)).argv

const option = {
    headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
    },
}

const download = (url, dir='') => {
    const hasher = crypto.createHash('md5')

    hasher.update(url)

    const name = `${hasher.digest('hex')}.${url.split('/').pop()}`
    const file = fs.createWriteStream(path.join(dir, name))
    
    https.get(url, option, res => res.pipe(file))
}

const scan = async ({ url, selector }) => {

    return new Promise((resolve, reject) => {
        https.get(url, option, (res) => {
            const chunks = []
    
            res.on('data', (chunk) => {
                chunks.push(chunk)
            })
    
            res.on('end', (chunk) => {
                const body = Buffer.concat(chunks)
                const dom = new jsdom.JSDOM(body.toString())
                const images = dom.window.document.querySelectorAll(selector)

                resolve()

                if (!images.length) {
                    console.error('no image found')
                } else {
                    images.forEach(image => {
                        download(image.src)
                    })
                }
            })
        })
    })
}

const walk = async ({ url, selector, start, end, urls }) => {

    if (urls) {
        for (const u of urls) {
            await scan({ url: u, selector })
        }
    } else if (url && start !== undefined) {
        for (let i = start; i <= end; i++) {
            await scan({ url: url.replaceAll('${i}', i), selector })
        }
    } else if (url) {
        scan({ url, selector })
    }
}

if (argv._.length > 1) {
    walk({
        urls: argv._,
        selector: argv.selector || argv.s,
    })
} if (argv._.length === 1) {
    walk({
        url: argv._[0],
        selector: argv.selector || argv.s,
        start: argv.start,
        end: argv.end,
    })
} else {
    console.log(`yegg url [url] --selector 'img' [--start 1] [--end 10]`)
}