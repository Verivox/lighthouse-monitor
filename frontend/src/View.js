import * as Mustache from 'mustache'
import {MDCMenu} from '@material/menu'

import {Selection} from './Selection';

const attachDownloadMenu = (view) => {
    const menu = document.querySelector(`.download_menu.${view}`)
    const mdcMenu = new MDCMenu(menu)
    const fab = document.querySelector(`.mdc-fab.${view}`)
    mdcMenu.setAnchorElement(fab)
    fab.onclick = () => {
        if (mdcMenu.open) {
            mdcMenu.open = false
        } else {
            mdcMenu.open = true
        }
    }

    menu.addEventListener('blur', () => {
        setTimeout(() => {
            mdcMenu.open = false
        }, 16.7)
    }, true)

    mdcMenu.listen('MDCMenu:selected', (ev) => {
        window.location.href = ev.detail.item.dataset.href
    })
}

class View {
    constructor(viewSide, lighthouseReports) {
        this.view = viewSide
        this.renderTemplates()
        this.selection = new Selection(viewSide, lighthouseReports)

        this.selection.addEventListener('complete', async ({detail: {report}}) => {
            this.renderReport(await report)
            attachDownloadMenu(this.view)
        })

        this.selection.addEventListener('reset:url', this.clearReport.bind(this))
    }

    renderTemplates() {
        const template = document.getElementById('tpl_view').innerHTML
        const container = document.getElementById(`result-${this.view}`)
        const rendered = Mustache.render(template, { view: this.view })
        container.innerHTML = rendered
    }

    renderReport(report) {
        const template = document.getElementById('tpl_result').innerHTML
        const container = document.getElementById(`render-${this.view}`)
        const rendered = Mustache.render(template, {
            reportId: report.id,
            name: report.name,
            view: this.view
        })
        container.innerHTML = rendered
    }

    clearReport() {
        const container = document.getElementById(`render-${this.view}`)
        container.innerHTML = ''
    }

    reset() {
        this.selection.reset()
        this.clearReport()
    }
}

export class LeftView extends View {
    constructor(lighthouseReports)  {
        super('left', lighthouseReports)
    }
}

export class RightView extends View {
    constructor(lighthouseReports)  {
        super('right', lighthouseReports)
    }
}
