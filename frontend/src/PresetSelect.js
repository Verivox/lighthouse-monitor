import { MDCSelect } from '@material/select'

export class PresetSelect extends EventTarget {
    constructor(view) {
        super()
        this.selectContainer = document.getElementById(`input-preset-${view}`)
        this.select = this.selectContainer.getElementsByTagName('select')[0]
        this.mdcSelect = new MDCSelect(this.selectContainer);
        this.mdcSelect.label_.float(true)
        this.mdcSelect.listen('MDCSelect:change', () => {
            this.dispatchEvent(new CustomEvent('changed', { detail: { value: this.mdcSelect.value } }))
        });
    }

    enable() {
        this.mdcSelect.disabled = false
    }

    disable() {
        this.mdcSelect.disabled = true
    }

    get value() {
        return this.mdcSelect.value
    }

    generateItem(text) {
        const option = document.createElement('option')
        option.innerText = text
        option.value = text
        return option
    }

    generateItems(texts) {
        return texts.map(this.generateItem)
    }

    appendChild(elem) {
        this.select.appendChild(elem)
    }

    appendChildren(elems) {
        for (const elem of elems) {
            this.appendChild(elem)
        }
    }

    setItems(items) {
        const elems = this.generateItems(items)
        this.appendChildren(elems)
    }

    clear() {
        const elems = Array.from(this.select.getElementsByTagName('option'))
        while (elems.length) {
            const n = elems.pop()
            this.select.removeChild(n)
        }
    }

    replaceItems(items) {
        this.clear()
        this.setItems(items)
    }

    reset(emitEvent = true) {
        const el = document.createElement('option')
        el.setAttribute('disabled', 'true')
        el.setAttribute('selected', 'true')
        el.innerText = 'Please choose a URL first'
        this.clear()
        this.disable()
        this.mdcSelect.label_.float(true)
        this.appendChild(el)
        this.disable()
        if (emitEvent) {
            this.dispatchEvent(new Event('reset'))
        }
    }

    selectItem(value) {
        this.mdcSelect.value = value
    }

    selectItemWithoutTriggerEvent(value) {
        this.select.value = value
    }


}