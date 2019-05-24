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

presets = {
    'mobile-snail': {
        preset: 'mobile-snail',
        chromeFlags: [
            '--headless',
            '--no-sandbox',
        ],
        onlyCategories: [
            'performance',
        ],
        throttlingMethod: 'devtools'
    }
}

targets = [
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
      extraHeaders: { Cookie: 'sessionId=.....' }
    },
    onlyCategories: []
  }
]

module.exports = {
  presets,
  targets
}