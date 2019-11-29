/**
 * This is a sample file, which MUST be copied to ./local.js to be loaded
 *
 * You can overwrite the module.exports from ./default.js here.
 *
 * An example: This would overwrite the default configuration of lighthouse.
 * During the configuration phase, the objects are merged in this order:
 *   preset > target
 * This means, that we can overwrite preset data, if we provide a similar
 * key in the target definition.
 * In the example, we do not only change the default presets, but also add
 * a cookie to be sent for one specific target and activate all categories.
 */

const presets = {
    'mobile-snail': {
        preset: 'mobile-snail',
        // browserOptions - is an options object that is accepted by launch command of puppeteer
        // https://github.com/puppeteer/puppeteer/blob/v2.0.0/docs/api.md#puppeteerlaunchoptions
        browserOptions: {
            headless: false,
            args: [
                '--remote-debugging-port=0',
                '--no-sandbox',
            ]
        },
        onlyCategories: [
            'performance',
        ],
        throttlingMethod: 'devtools'
    }
}


class LogMeIn {
    constructor(mailAddress, password, url) {
        this.url = url
        this.mailAddress = mailAddress
        this.password = password
    }

    async setup(browser) {
        const page = await browser.newPage()
        await page.goto(this.url)

        const emailInput = await page.waitForSelector('input#mail')
        await emailInput.type(this.mailAddress)
        const passwordInput = await page.waitForSelector('input#password')
        await passwordInput.type(this.password)

        const signInButtonSelector = 'submit'
        await page.waitForSelector(signInButtonSelector)
        await page.click(signInButtonSelector)

        await page.waitForSelector('#dashboard')
        await page.close()
    }
}


const loginPrehook = new LogMeIn('email@example.com',
    'password', 'https://verivox.de/login-url/');


const targets = [
    // this will take the default presets
    {
        name: 'landingpage',
        url: 'https://kumbier.it'
    },

    // this will overwrite 'flags' and 'onlyCategories' in every preset
    // for this specific target only.
    {
        name: 'dashboard',
        url: 'https://kumbier.it',
        flags: {
            extraHeaders: {Cookie: 'sessionId=.....'}
        },
        onlyCategories: []
    },
    /*
      This is a target with prehook.
      "prehook.setup" will be run before the evaluation of the target url.
      "loginPrehook" here is an instance of a class wich has a function called "setup"
      "setup" function accepts a browser "setup(browser)" instance of puppeteer for futher actions
      This case is a login prehook - opens a page with login form, fills in the email and password,
      submits the form, cookies are set and the evaluation of the account dashboard starts.
    */
    {
        name: 'Account dashboard',
        url: 'https://verivox.de/mein-konto/',
        prehook: loginPrehook
    },
]

module.exports = {
    presets,
    targets
}