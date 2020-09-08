# 2.3.0

* Higher performance by better utilizing the sqlite database report cache
* New option to define the report cache via `cacheDir` - now defaults to `os.tmpdir()`
* cache dir file renamed to `lightmon-cache.sqlite3`


# 2.2.0

* Lightmon now uses a file system cache based on sqlite to decrease startup times dramatically
* FIX: Cleanup now correctly removes empty directories


# 2.1.0

* Receivers can provide an `afterEvaluation()`-method, which will be called before shutting down
* A new receiver `jsonMetrics` for a reduced set of json results is added.


# 2.0.0

* Switch to puppeteer as launcher
* Ability to add prehook-scripts to enable automation steps before launching an evaluation (e.g. logging into a homepage or filling a form)

## Breaking changes

Due to the usage of puppeteer instead of chromeLauncher, the syntax of the configuration has changed. `chromeFlags` have been deprecated and replaced with a new `browserOptions` object, which takes in [puppeteer launch options](https://github.com/puppeteer/puppeteer/blob/v2.0.0/docs/api.md#puppeteerlaunchoptions).

To migrate, you can use the `args` key inside:

```
// before 2.0.0
{
    chromeFlags: [
        "--some-option-for-chromium",
        "--no-sandbox"
    ]
}

// from 2.0.0
{
    browserOptions: {
        headless: false,
        args: [
            "--some-option-for-chromium",
            "--no-sandbox"
        ]
    }
}
```


# 1.0.0

Initial release