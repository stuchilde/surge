/**
 * 在微信公众号【招商银行信用卡】中访问【🔥签到领积分】获取cookie
 */


const checkinURL = 'https://weclub.ccc.cmbchina.com/SCRMCustomActivityFront/checkin/request/checkin.json';
const cookieKey = 'cmbchina_cookieKey';
const userAgentKey = 'cmbchina_userAgentKey';

if ($request.headers['Cookie']) {
    const cookie = $request.headers['Cookie'];
    const userAgent = $request.headers['User-Agent'];
    $persistentStore.write(cookie, cookieKey)
    $persistentStore.write(userAgent, userAgentKey);
    $notification.post("成功获取招商银行信用卡 cookie 🎉", "", "请禁用该脚本")
}

$done({})