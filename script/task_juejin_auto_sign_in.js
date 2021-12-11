const title = '掘金'

const cookieKey = 'jue_jin_cookie_key'

const signURLKey = 'jue_jin_sign_url'

util = init()
sign()

function sign() {
    let url = {
        url: util.getData(signURLKey),
        headers: {
            Cookie: util.getData(cookieKey)
        }
    }
    url.headers['Origin'] = 'https://juejin.cn'
    url.headers['Referer'] = 'https://juejin.cn/'
    url.headers['Accept'] = '*/*'
    url.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15'
    util.post(url, (error, response, data) => {
        let result = JSON.parse(data)
        // 签到成功
        if (result && result.err_no === 0) {
            let subTitle = `签到结果: 成功`
            util.msg(title + "," + subTitle, result.err_msg, '')
        }
        // 签到重复
        else if (result && result.err_node === 15001) {
            let subTitle = `签到结果：失败`
            util.msg(title + "," + subTitle, result.err_msg, '')
        }
        // 签到失败
        else {
            let subTitle = `签到结果: 失败`
            util.msg(title + "," + subTitle, result.err_msg, '')
        }
        util.log(`${title}, data: ${result}`)
        util.done()
    })
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
        get,
        post,
        log,
        msg,
        done,
    }
}