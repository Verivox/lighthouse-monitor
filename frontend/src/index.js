import './styles.scss'
import {MDCRipple} from '@material/ripple'
import {MDCDialog} from '@material/dialog'
import {MDCLinearProgress} from '@material/linear-progress'

import {LighthouseReports} from './LighthouseReport'
import {LeftView, RightView} from './View'

const modal = new MDCDialog(document.querySelector('.mdc-dialog'))
const helpBtn = document.getElementById('help-btn')
MDCRipple.attachTo(helpBtn, {isUnbounded: true})

helpBtn.onclick = () => {
    modal.open()
}

const resetBtn = document.getElementById('reset-btn')

document.addEventListener('DOMContentLoaded', async ( ) => {
    try {
        const progress = document.querySelector('.mdc-linear-progress')
        MDCLinearProgress.attachTo(progress)
        const reports = new LighthouseReports()
        const leftView = new LeftView(reports)
        const rightView = new RightView(reports)

        resetBtn.onclick = () => {
            leftView.reset()
            rightView.reset()
        }
        progress.setAttribute('hidden', true)
    } catch (err) {
        console.error(err)
    }
})


