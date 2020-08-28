export class UrlState {
    static set(view, value) {
        const params = new URLSearchParams(window.location.search)
        params.set(view, value)
        const newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?' + params.toString()
        window.history.pushState({path:newurl},'',newurl);
    }

    static get(view) {
        const params = new URLSearchParams(window.location.search)
        params.set('some', 'world')
        return params.get(view)
    }

    static clear(view) {
        const params = new URLSearchParams(window.location.search)
        params.delete(view)
        const newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?' + params.toString()
        window.history.pushState({path:newurl},'',newurl);
    }
}