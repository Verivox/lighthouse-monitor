import {MDCTextField} from '@material/textfield';
import {MDCMenu} from '@material/menu'

class DropdownList extends EventTarget {
    constructor(name, view) {
        super()
        this.menu = document.getElementById(`${name}-menu-${view}`)
        this.mdcMenu = new MDCMenu(this.menu)
        this.currentSelectedElement = -1

        this.mdcMenu.listen('MDCMenu:selected', ({detail: {item}}) => {
            this.dispatchEvent(new CustomEvent('selected', {detail: {value: item.innerText}}))
        })
    }

    generateItem(text) {
        const li = document.createElement('li', {'role': 'menuitem'})
        const span = document.createElement('span')
        span.classList.add('mdc-list-item__text')
        span.classList.add('mdc-typography--body1')
        span.innerText = text
        li.classList.add('mdc-list-item')
        li.appendChild(span)
        return li
    }

    generateItems(texts) {
        return texts.map(this.generateItem)
    }

    appendChild(elem) {
        this.menu.childNodes[1].appendChild(elem)
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
        while (this.menu.childNodes[1].hasChildNodes()) {
            this.menu.childNodes[1].removeChild(this.menu.childNodes[1].firstChild)
        }
    }

    replaceItems(items) {
        this.clear()
        this.setItems(items)
    }

    replaceItemsAndShow(items) {
        if (items.length) {
            if (!this.isOpen()) {
                this.open()
            }
            this.replaceItems(items)
        } else if (items.length === 0) {
            this.currentSelectedElement = -1
            this.close()
        }
    }

    open() {
        this.mdcMenu.open = true
        this.currentSelectedElement = -1
    }

    close() {
        this.mdcMenu.open = false
    }

    isOpen() {
        return this.mdcMenu.open
    }

    scroll(up) {
        const height = this.menu.querySelector('li').getBoundingClientRect().height
        const lastElement = this.mdcMenu.list_.listElements.length - 1
        const maxScrollTop = height * lastElement
        const menuHeight = this.menu.getBoundingClientRect().height
        const scrollTop = this.menu.scrollTop
        const itemTop = this.mdcMenu.list_.listElements[this.currentSelectedElement].getBoundingClientRect().top
        if (this.currentSelectedElement == 0) {
            this.menu.scroll({top: 0})
        } else if (this.currentSelectedElement == lastElement) {
            this.menu.scroll({top: maxScrollTop})
        } else if (itemTop >= (menuHeight + height * 2) && !up) {
            this.menu.scroll({top: scrollTop + height})
        } else if (itemTop <= (height * 2) && up) {
            this.menu.scroll({top: scrollTop - height})
        }

    }

    nextElement() {
        this.currentSelectedElement = (this.currentSelectedElement + 1) % this.mdcMenu.list_.listElements.length
        this.scroll(false)
        this.mdcMenu.list_.foundation_.setSelectedIndex(this.currentSelectedElement);
    }

    previousElement() {
        this.currentSelectedElement--
        if (this.currentSelectedElement <= -1) {
            this.currentSelectedElement = this.mdcMenu.list_.listElements.length - 1
        }
        this.scroll(true)
        this.mdcMenu.list_.foundation_.setSelectedIndex(this.currentSelectedElement);
    }

    confirmSelection() {
        if (this.currentSelectedElement === -1) {
            return
        }
        this.mdcMenu.foundation_.adapter_.notifySelected({index: this.currentSelectedElement})
    }

    selectFirstElement() {
        this.mdcMenu.list_.foundation_.setSelectedIndex(0);
        this.currentSelectedElement = 0;
    }
}

export class Autocomplete extends EventTarget {
    constructor(name, view, items = Promise.resolve([])) {
        super()
        this.listView = new DropdownList(name, view)
        this.textField = document.getElementById(`${name}-text-field-${view}`)
        this.mdcTextField = new MDCTextField(this.textField);
        this.inputElement = document.getElementById(`input-${name}-${view}`)
        this.previousContent = ''
        this._registerEvents()
        items.then(items => {
            this.items = items
            this.listView.replaceItems(this.items)
        })
    }

    _registerEvents() {
        this.textField.addEventListener('keydown', (evt) => {
            switch (evt.code) {
            case 'ArrowDown':
                this.lastKeyEvent = 'ArrowDown'
                this.listView.nextElement()
                this.inputElement.setAttribute('placeholder', this.items[this.listView.currentSelectedElement])
                break
            case 'ArrowUp':
                this.lastKeyEvent = 'ArrowUp'
                this.listView.previousElement()
                this.inputElement.setAttribute('placeholder', this.items[this.listView.currentSelectedElement])
                break
            case 'NumpadEnter':
            case 'Enter':
                this.lastKeyEvent = 'Enter'
                this.listView.confirmSelection()
                this.listView.close()
                this.inputElement.removeAttribute('placeholder')
                break
            case 'Tab':
                this.lastKeyEvent = 'Tab'
                if (this.value) {
                    this.dispatchEvent(new CustomEvent('selected', {detail: {value: this.value}}))
                } else {
                    this.dispatchEvent(new Event('reset'))
                }
                this.listView.close()
                break
            default:
                break
            }
        }, true)

        this.textField.oninput = e => {
            const text = e.target.value
            this._filterAndReplace(text)
            this.listView.selectFirstElement()
            this.inputElement.setAttribute('placeholder', this.items[this.listView.currentSelectedElement])
        }

        this.textField.addEventListener('focus', (e) => {
            this.previousContent = this.inputElement.value
            this.inputElement.value = ''
            const text = e.target.value
            this._filterAndReplace(text)
            this.listView.selectFirstElement()
            this.inputElement.setAttribute('placeholder', this.items[this.listView.currentSelectedElement])
        }, true)

        this.textField.addEventListener('blur', () => {
            setTimeout(() => {
                if (!this.inputElement.value && this.previousContent && this.lastKeyEvent !== 'Tab') {
                    this.inputElement.value = this.previousContent
                    this.mdcTextField.label_.float(true)
                }
                this.listView.close()
            }, 100)
        }, true)

        this.listView.addEventListener('selected', (e) => {
            const value = e.detail.value
            this.dispatchEvent(new CustomEvent('selected', {detail: {value}}))
            this.mdcTextField.label_.float(true)
            this.inputElement.value = value
        })
    }

    get value() {
        return this.inputElement.value
    }

    _filter(text) {
        text = text.toLowerCase().trim()
        try {
            return this.items.filter(i => i.toLowerCase().trim().search(text) !== -1)
        } catch (e) {
            return []
        }
    }

    _filterAndReplace(text) {
        this.listView.replaceItemsAndShow(this._filter(text))
    }

    enable() {
        this.mdcTextField.disabled = false
    }

    disable() {
        this.mdcTextField.disabled = true
    }

    async update(items) {
        this.items = await items
        this.listView.replaceItems(this.items)
    }

    fill(text) {
        this.mdcTextField.label_.float(true)
        this.inputElement.value = text
    }

    fillWithEvent(text) {
        this.mdcTextField.value = text
        this.listView.dispatchEvent(new CustomEvent({detail: {value: text}}))
    }

    fillSelected() {
        this.fill(this.value)
    }

    fillIfEmpty(text) {
        if (!this.value) {
            this.fill(text)
        }
    }

    clear() {
        this.items = []
        this.inputElement.value = ''
        this.listView.clear()
        this.inputElement.removeAttribute('placeholder')
    }

    clearInput() {
        this.inputElement.value = ''
    }

    reset(emitEvent = true) {
        this.clear()
        this.disable()
        if (emitEvent) {
            this.dispatchEvent(new Event('reset'))
        }
    }
}

