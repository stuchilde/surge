/* 
^https:\/\/passport-api.mihoyo.com\/account\/auth\/api\/getCookieAccountInfoBySToken
*/

const cookieName = '米游社'
const miyoushe_cookie_token_key = 'miyoushe_cookie_token'

const evan = init()

if ($response && $response.body) {
    const body = JSON.parse($response.body)
    if (body.retcode == 0) {
        const cookie_token = {
            'cookie_token' : body.data.cookie_token,
            'account_id': body.data.uid,
        }
        evan.setdata(miyoushe_cookie_token_key, JSON.stringify(cookie_token))
        evan.msg(cookieName, `获取cookie token: 成功`, ``)
        evan.log(`[${cookieName}] 获取cookie token 成功, cookie_token: ${JSON.stringify(cookie_token)}`)
    }
}

function init() {
    isSurge = () => {
        return undefined === this.$httpClient ? false : true
    }
    isQuanX = () => {
        return undefined === this.$task ? false : true
    }
    getdata = (key) => {
        if (isSurge()) return $persistentStore.read(key)
        if (isQuanX()) return $prefs.valueForKey(key)
    }
    setdata = (key, val) => {
        if (isSurge()) return $persistentStore.write(val, key)
        if (isQuanX()) return $prefs.setValueForKey(val, key)
    }
    msg = (title, subtitle, body) => {
        if (isSurge()) $notification.post(title, subtitle, body)
        if (isQuanX()) $notify(title, subtitle, body)
    }
    log = (message) => console.log(message)
    get = (url, cb) => {
        if (isSurge()) {
            $httpClient.get(url, cb)
        }
        if (isQuanX()) {
            url.method = 'GET'
            $task.fetch(url).then((resp) => cb(null, {}, resp.body))
        }
    }
    post = (url, cb) => {
        if (isSurge()) {
            $httpClient.post(url, cb)
        }
        if (isQuanX()) {
            url.method = 'POST'
            $task.fetch(url).then((resp) => cb(null, {}, resp.body))
        }
    }
    done = (value = {}) => {
        $done(value)
    }
    return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
}

evan.done()