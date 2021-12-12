/**
 * 招商银行信用卡，每天自动签到脚本
 * @type {string}
 */

const title = "招商银行信用卡"
const checkinURL = 'https://weclub.xyk.cmbchina.com/SCRMCustomActivityFront/checkin-plus/request/checkin.json';
const cookieKey = 'cmbchina_cookieKey';
const userAgentKey = 'cmbchina_userAgentKey';

$utils = utils()

checkin()

$done()

function checkin() {
    let URL = {
        url: checkinURL,
        headers: {
            'Cookie': $utils.read(cookieKey),
            'User-Agent': $utils.read(userAgentKey),
            'Content-type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            'activityCode': 'checkin'
        }),
        method: 'POST',
    }
    $httpClient.post(URL, (error, response, data) => {
        const result = JSON.parse(data);
        console.log(result);
        if (error) {
            $utils.notify(title + "签到失败⚠️", "", "接口请求失败")
        }
        if (result.respCode === 1000) {
            $utils.notify(title, "", "签到成功，获得 " + result.data.awardValue + " 积分🎁");
        } else if (result.respCode === 1452) {
            $utils.notify(title, "", "签到失败，请获取 cookie");
        } else if (result.respCode === 'custom_8500') {
            $utils.notify(title, "", "签到失败，" + result.respMsg);
        } else {
            $utils.notify(title, "", "签到失败，请查看日志");
        }
    })
}


function utils() {
    const times = 0
    const start = Date.now()
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const isQuanX = typeof $task != "undefined"
    const isLoon = typeof $loon != "undefined"
    const isJSBox = typeof $app != "undefined" && typeof $http != "undefined"
    const isNode = typeof require == "function" && !isJSBox;
    const node = (() => {
        if (isNode) {
            const request = require('request');
            return ({
                request
            })
        } else {
            return null
        }
    })()
    const notify = (title, subtitle, message) => {
        if (isQuanX) $notify(title, subtitle, message)
        if (isSurge) $notification.post(title, subtitle, message)
        if (isNode) log('\n' + title + '\n' + subtitle + '\n' + message)
        if (isJSBox) $push.schedule({
            title: title,
            body: subtitle ? subtitle + "\n" + message : message
        })
    }
    const write = (value, key) => {
        if (isQuanX) return $prefs.setValueForKey(value, key)
        if (isSurge) return $persistentStore.write(value, key)
    }
    const read = (key) => {
        if (isQuanX) return $prefs.valueForKey(key)
        if (isSurge) return $persistentStore.read(key)
    }
    const adapterStatus = (response) => {
        if (response) {
            if (response.status) {
                response["statusCode"] = response.status
            } else if (response.statusCode) {
                response["status"] = response.statusCode
            }
        }
        return response
    }
    const get = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "GET"
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.get(options, (error, response, body) => {
            callback(error, adapterStatus(response), body)
        })
        if (isNode) {
            node.request(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isJSBox) {
            if (typeof options == "string") options = {
                url: options
            }
            options["header"] = options["headers"]
            options["handler"] = function (resp) {
                let error = resp.error;
                if (error) error = JSON.stringify(resp.error)
                let body = resp.data;
                if (typeof body == "object") body = JSON.stringify(resp.data);
                callback(error, adapterStatus(resp.response), body)
            };
            $http.get(options);
        }
    }
    const post = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "POST"
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) {
            options.headers['X-Surge-Skip-Scripting'] = false
            $httpClient.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isNode) {
            node.request.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
        if (isJSBox) {
            if (typeof options == "string") options = {
                url: options
            }
            options["header"] = options["headers"]
            options["handler"] = function (resp) {
                let error = resp.error;
                if (error) error = JSON.stringify(resp.error)
                let body = resp.data;
                if (typeof body == "object") body = JSON.stringify(resp.data)
                callback(error, adapterStatus(resp.response), body)
            }
            $http.post(options);
        }
    }
    const log = (message) => console.log(message)
    const time = () => {
        const end = ((Date.now() - start) / 1000).toFixed(2)
        return console.log('\n签到用时: ' + end + ' 秒')
    }
    const done = (value = {}) => {
        if (isQuanX) return $done(value)
        if (isSurge) isRequest ? $done(value) : $done()
    }
    return {
        isRequest,
        isNode,
        notify,
        write,
        read,
        get,
        post,
        log,
        time,
        times,
        done
    }
}