const title = '掘金'
const cookieName = 'jue_jin'

const cookieKey = 'jue_jin_cookie_key'

const signURLKey = 'jue_jin_sign_url'

const fun = init()

const cookieVal = $request.headers['Cookie']
const signURLVal = $request.url

fun.msg(`${title}`, signURLVal, cookieVal)

if (cookieVal && signURLVal) {
    if (fun.setData(cookieKey, cookieVal)) {
        fun.msg(`${cookieName}`, '获取cookie成功', cookieVal)
        fun.log(`[${cookieName}]获取cookie成功，cookie: ${cookieVal}`)
    }
    if (fun.setData(signURLKey, signURLVal)) {
        fun.msg(`${cookieName}`, "获取签到URL成功", signURLVal)
        fun.log(`[${cookieName}]获取签到URL成功，URL: ${signURLVal}`)
    }
}
console.log(`${title}-cookie:${cookieVal},checkin URL:${signURLVal}`);

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