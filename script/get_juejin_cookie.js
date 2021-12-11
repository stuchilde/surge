const cookieName = 'jue_jin'

const cookieKey = 'jue_jin_cookie_key'

const fun = init()

const cookieVal = $request.headers['Cookie']

if (cookieVal) {
    if (fun.setData(cookieKey, cookieVal)) {
        fun.msg(`${cookieName}`, '获取cookie成功', cookieVal)
        fun.log(`[${cookieName}]获取cookie成功，cookie: ${cookieVal}`)
    }
}

function init() {
    isSurge = () => {
        return undefined !== this.$httpClient
    };
    isQuanX = () => {
        return undefined !== this.$task
    }
    getData = (key) => {
        if (isSurge()) return $persistentStore.read(key)
        if (isQuanX()) return $prefs.valueForKey(key)
    }
    setData = (key, val) => {
        if (isSurge()) return $persistentStore.write(key, val)
        if (isQuanX()) return $prefs.setValueForKey(key, val)
    }
    msg = (title, subTitle, body) => {
        if (isSurge()) $notification.post(title, subTitle, body)
        if (isQuanX()) $notify(title, subTitle, body)
    }
    log = (message) => {
        console.log(message)
    }
    done = (value = {}) => {
        $done(value)
    }
    return {
        isSurge,
        isQuanX,
        getData,
        setData,
        log,
        msg,
        done,
    }
}
fun.done()