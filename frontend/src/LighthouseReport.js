import * as dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

// eslint-disable-next-line no-unused-vars
export class LighthouseReports {
    constructor(baseUrl = '') {
        this._baseUrl = baseUrl
        this._dateFormat = 'DD.MM.YYYY HH:mm:ss.SSS'
    }

    async getReport(url, preset, date) {
        date = dayjs(date, this._dateFormat).toISOString()
        const response = await fetch(`${this._baseUrl}/report/url/${encodeURIComponent(url)}/${encodeURIComponent(preset)}/${encodeURIComponent(date)}`)
        const content = await response.text()
        if (content) {
            return JSON.parse(content)
        }
    }

    async getReportById(id) {
        const response = await fetch(`${this._baseUrl}/report/${id}`)
        const report = await response.json();
        report.date = dayjs(report.date).format(this._dateFormat)
        return report
    }

    async getUrls() {
        const response = await fetch(`${this._baseUrl}/report/url/`)
        return response.json()
    }

    async getPresetsFromUrl(url) {
        const response = await fetch(`${this._baseUrl}/report/url/${encodeURIComponent(url)}/`)
        return response.json()
    }

    async getDatesFromUrl(url, preset) {
        const data = await fetch(`${this._baseUrl}/report/url/${encodeURIComponent(url)}/${encodeURIComponent(preset)}/`)
            .then(response => response.json())
        return Object.keys(data)
            .map(date => dayjs(date))
            .sort((a, b) => a.isAfter(b) ? -1 : 1)
            .map(date => date.format(this._dateFormat))
    }
}
