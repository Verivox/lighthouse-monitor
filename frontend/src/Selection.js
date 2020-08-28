import { Autocomplete } from './Autocomplete'
import { PresetSelect } from './PresetSelect'
import { UrlState } from './UrlState'


export class Selection extends EventTarget {
    constructor(view, lighthouseReports) {
        super()
        this.lighthouseReports = lighthouseReports
        this.view = view
        this.url = new Autocomplete('url', view, lighthouseReports.getUrls())
        this.preset = new PresetSelect(view)
        this.date = new Autocomplete('date', view)
        this.date.disable()
        this.registerEvents()
        this.setFromURL()
    }

    async setFromURL() {
        const reportId = UrlState.get(this.view)
        if (!reportId) {
            return
        }
        const report = await this.lighthouseReports.getReportById(reportId)
        if (!report) {
            return
        }
        this.url.fill(report.url)
        this.preset.replaceItems(await this.lighthouseReports.getPresetsFromUrl(report.url))
        this.preset.selectItemWithoutTriggerEvent(report.preset)
        this.preset.enable()
        this.date.update(await this.lighthouseReports.getDatesFromUrl(report.url, report.preset))
        this.date.fill(report.date)
        this.date.enable()
        this.emitComplete()
    }

    registerEvents() {
        this.url.addEventListener('selected', async ({ detail: { value } }) => {
            const presets = await this.lighthouseReports.getPresetsFromUrl(value)
            if (!presets.length) {
                return this.emitResetUrl()
            }

            this.preset.replaceItems(presets)
            setTimeout(() => {
                this.preset.selectItem(presets[0])
                this.preset.enable()
            }, 1)
        })

        this.preset.addEventListener('changed', async ({ detail: { value } }) => {
            const dates = await this.lighthouseReports.getDatesFromUrl(this.url.value, value)
            this.date.update(dates)
            this.date.enable()
            this.date.fillIfEmpty(dates[0])
            setTimeout(() => {
                this.emitComplete()
            }, 1)
        })

        this.date.addEventListener('selected', () => {
            setTimeout(() => {
                this.emitComplete()
            }, 1)
        })

        this.url.addEventListener('reset', this.emitResetUrl.bind(this))
    }

    emitResetUrl() {
        this.dispatchEvent(new Event('reset:url'))
        this.preset.reset()
        this.date.reset()
        UrlState.clear(this.view)
    }

    async check(report) {
        if (report) {
            return false
        }

        const dates = await this.lighthouseReports.getDatesFromUrl(this.url.value, this.preset.value)
        if (dates.length === 0) {
            this.emitResetUrl()
            this.url.dispatchEvent(new CustomEvent('selected', { detail: { value: this.url.value } }))
            return true
        }

        this.date.fill(dates[0])
        this.emitComplete()
        return true
    }

    async emitComplete() {
        const report = await this.lighthouseReports.getReport(this.url.value, this.preset.value, this.date.value)
        if (await this.check(report)) {
            return
        }

        UrlState.set(this.view, report.id)
        this.dispatchEvent(
            new CustomEvent('complete',
                {
                    detail: {
                        report
                    }
                }))
    }

    fillDefault() {
        this.emitComplete()
    }

    emitReset() {
        this.dispatchEvent(new Event('reset'))
    }

    reset(emitEvent = true) {
        this.url.clearInput()
        this.preset.reset(false)
        this.date.reset(false)
        UrlState.clear(this.view)
        if (emitEvent) {
            this.emitReset()
        }
    }
}