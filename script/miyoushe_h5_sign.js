const cookieName = "米游社";
const miyoushe_cookie_key = "miyoushe_cookie";
const miyoushe_cookie_token_key = "miyoushe_cookie_token";

const evan = init();
const cookie = evan.getdata(miyoushe_cookie_key);
const cookie_token = JSON.parse(
  evan.getdata(miyoushe_cookie_token_key)
).cookie_token;
const account_id = JSON.parse(
  evan.getdata(miyoushe_cookie_token_key)
).account_id;

var roles = [];
var sign_info = [];
var game_id_mapping = new Map();

!(async () => {
  await get_roles()
  await get_sign_info()
  await get_game_list()
  sign_all()
})()
  .catch((e) => {
    evan.log(`catch expection: ${e}`)
    evan.msg(`❌ 签到失败`, `${e}`, ``)
  })
  .finally(() => evan.done);

async function get_sign_info() {
  for (var i = 0; i < roles.length; i++) {
    await get_action_id(roles[i].game_id, roles[i].region, roles[i].game_role_id)
  }
}

async function get_roles() {
  return new Promise((resolve, reject) => {
    const url = {
      url: `https://api-takumi-record.mihoyo.com/game_record/card/api/getGameRecordCard?uid=${account_id}`,
      headers: { Cookie: cookie },
    };
    url.headers["Host"] = "api-takumi-record.mihoyo.com";
    url.headers["x-rpc-app_version"] = "2.63.1"; // 必须要写死，不通客户端版本的salt不一样
    url.headers["x-rpc-client_type"] = "2"; // 不通的类型对应的DS算法逻辑不一样
    url.headers["DS"] = get_ds();
    evan.get(url, (error, response, data) => {
      try {
        const result = JSON.parse(data);
        if (result.retcode == 0) {
          roles = result.data.list;
        } else {
          evan.log(
            `get roles failed:${JSON.stringify(
              result
            )}, 请求URL: ${JSON.stringify(url)}`
          );
          evan.msg(`❌获取角色信息失败!`, `原因：${result.message}`, ``);
        }
        resolve();
      } catch (e) {
        evan.log(`get roles catch, expection: ${e}`);
        evan.log(`get roles catch, response: ${JSON.stringify(response)}`);
        evan.msg(`❌ 获取角色信息失败!`, `原因：${e}`, ``);
        resolve();
      }
    });
  });
}

async function get_game_list() {
  return new Promise((resolve, reject) => {
    evan.get('https://bbs-api.miyoushe.com/apihub/api/getGameList', (error, response, data) => {
      try {
        const result = JSON.parse(data)
        if (result.retcode == 0) {
          result.data.list.forEach((item) => {
            game_id_mapping.set(item.id, item)
          })
        } else {
          evan.log(`error:${error}, response:${response}, data:${data}`)
          evan.msg(`❌ 获取游戏列表失败`, `${result.message}`, ``)
        }
        resolve();
      }catch(e) {
          evan.log(`get game list catch, exception:${e}`);
          evan.msg(`❌ 获取游戏列表失败`, `原因：${e}`, ``);
          resolve();
      }
    })
  })
}

async function get_action_id(game_id, region, uid) {
  return new Promise((resolve, reject) => {
    evan.get(`https://bbs-api.miyoushe.com/apihub/api/home/new?gids=${game_id}`,
      (error, response, data) => {
        try {
          result = JSON.parse(data);
          if (result.retcode != 0) {
            evan.msg(`❌ 获取签到福利标识失败`, `原因：${result.message}`, ``);
          } else {
            for (var i = 0; i < result.data.navigator.length; i++) {
              if (result.data.navigator[i].name == "签到福利") {
                const regex = /act_id\=(.+?)(&|$)/;
                const app_path = result.data.navigator[i].app_path
                regex_arr = regex.exec(app_path)
                if (regex_arr && regex_arr.length > 2) {
                  act_id = regex_arr[1]
                  sign_info.push({ 'game_id': game_id, 'act_id': act_id, 'region': region, 'uid': uid})
                  evan.log(`game_id:${game_id}, act_id:${act_id}, region:${region}, uid:${uid}`)
                } else {
                  evan.log(`获取act_id失败, app_path: ${app_path}, regex_arr: ${regex_arr}`)
                  evan.msg(`❌ 获取签到福利标识失败`, ``, ``)
                }
              }
            }
          }
          resolve();
        } catch (e) {
          evan.log(`get act_id catch, expection: ${e}`);
          evan.log(`get act_id catch, response: ${JSON.stringify(response)}`);
          evan.msg(`❌ 获取签到福利标识失败`, `原因：${e}`, ``);
          resolve();
        }
      }
    );
  });
}

function get_ds() {
  const salt = "BIPaooxbWZW02fGHZL1If26mYCljPgst"; // 米游社客户端版本2.63.1对应的salt的值
  const timestamp = new Date().getTime();
  const t = Math.floor(timestamp / 1000);
  const r = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  const main = `salt=${salt}&t=${t}&r=${r}`;
  const ds = hex_md5(main);

  return `${t},${r},${ds}`; // 最终结果
}

function sign(game_id, act_id, region, uid) {
  const game_name = game_id_mapping.get(game_id).name
  const game = game_id_mapping.get(game_id).op_name
  const url = {url: 'https://api-takumi.mihoyo.com/event/luna/sign', headers: {Cookie: cookie + ';cookie_token=' + cookie_token + ';account_id='+ account_id} }
  url.headers['x-rpc-signgame'] = game
  url.body = JSON.stringify({act_id: act_id, region: region, uid: uid, lang: "zh-cn"})
  evan.post(url, (error, response, data) => {
    try {
      responseData = JSON.parse(data)
      if (responseData.retcode == 0) {
        evan.msg(`✅ ${game_name} 签到成功!`, ``, ``)
      } else {
        evan.log(`url:${JSON.stringify(url)}, error:${error}, response:${JSON.stringify(response)}, data:${data}`)
        evan.msg(`❌ ${game_name} 签到失败`, `${responseData.message}`, ``)
      }
    }catch(e){
      evan.log(`sign failed, url:${JSON.stringify(url)}, exception:${e}, data:${data}`)
      evan.msg(`❌ ${game_name} 签到失败`, `${e}`,``)
    }
    
  })
}

function sign_all() {
  sign_info.forEach(item => {
    sign(item.game_id, item.act_id, item.region, item.uid)
  })
}

function init() {
  isSurge = () => {
    return undefined === this.$httpClient ? false : true;
  };
  isQuanX = () => {
    return undefined === this.$task ? false : true;
  };
  getdata = (key) => {
    if (isSurge()) return $persistentStore.read(key);
    if (isQuanX()) return $prefs.valueForKey(key);
  };
  setdata = (key, val) => {
    if (isSurge()) return $persistentStore.write(key, val);
    if (isQuanX()) return $prefs.setValueForKey(key, val);
  };
  msg = (title, subtitle, body) => {
    if (isSurge()) $notification.post(title, subtitle, body);
    if (isQuanX()) $notify(title, subtitle, body);
  };
  log = (message) => console.log(message);
  get = (url, cb) => {
    if (isSurge()) {
      $httpClient.get(url, cb);
    }
    if (isQuanX()) {
      url.method = "GET";
      $task.fetch(url).then((resp) => cb(null, {}, resp.body));
    }
  };
  post = (url, cb) => {
    if (isSurge()) {
      $httpClient.post(url, cb);
    }
    if (isQuanX()) {
      url.method = "POST";
      $task.fetch(url).then((resp) => cb(null, {}, resp.body));
    }
  };
  done = (value = {}) => {
    $done(value);
  };
  return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done };
}

// MD5
function hex_md5(r) {
  return rstr2hex(rstr_md5(str2rstr_utf8(r)));
}
function b64_md5(r) {
  return rstr2b64(rstr_md5(str2rstr_utf8(r)));
}
function any_md5(r, t) {
  return rstr2any(rstr_md5(str2rstr_utf8(r)), t);
}
function hex_hmac_md5(r, t) {
  return rstr2hex(rstr_hmac_md5(str2rstr_utf8(r), str2rstr_utf8(t)));
}
function b64_hmac_md5(r, t) {
  return rstr2b64(rstr_hmac_md5(str2rstr_utf8(r), str2rstr_utf8(t)));
}
function any_hmac_md5(r, t, d) {
  return rstr2any(rstr_hmac_md5(str2rstr_utf8(r), str2rstr_utf8(t)), d);
}
function md5_vm_test() {
  return "900150983cd24fb0d6963f7d28e17f72" == hex_md5("abc").toLowerCase();
}
function rstr_md5(r) {
  return binl2rstr(binl_md5(rstr2binl(r), 8 * r.length));
}
function rstr_hmac_md5(r, t) {
  var d = rstr2binl(r);
  d.length > 16 && (d = binl_md5(d, 8 * r.length));
  for (var n = Array(16), _ = Array(16), m = 0; m < 16; m++)
    (n[m] = 909522486 ^ d[m]), (_[m] = 1549556828 ^ d[m]);
  var f = binl_md5(n.concat(rstr2binl(t)), 512 + 8 * t.length);
  return binl2rstr(binl_md5(_.concat(f), 640));
}
function rstr2hex(r) {
  for (
    var t, d = hexcase ? "0123456789ABCDEF" : "0123456789abcdef", n = "", _ = 0;
    _ < r.length;
    _++
  )
    (t = r.charCodeAt(_)), (n += d.charAt((t >>> 4) & 15) + d.charAt(15 & t));
  return n;
}
function rstr2b64(r) {
  for (
    var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    d = "",
    n = r.length,
    _ = 0;
    _ < n;
    _ += 3
  )
    for (
      var m =
        (r.charCodeAt(_) << 16) |
        (_ + 1 < n ? r.charCodeAt(_ + 1) << 8 : 0) |
        (_ + 2 < n ? r.charCodeAt(_ + 2) : 0),
      f = 0;
      f < 4;
      f++
    )
      8 * _ + 6 * f > 8 * r.length
        ? (d += b64pad)
        : (d += t.charAt((m >>> (6 * (3 - f))) & 63));
  return d;
}
function rstr2any(r, t) {
  var d,
    n,
    _,
    m,
    f,
    h = t.length,
    e = Array(Math.ceil(r.length / 2));
  for (d = 0; d < e.length; d++)
    e[d] = (r.charCodeAt(2 * d) << 8) | r.charCodeAt(2 * d + 1);
  var a = Math.ceil((8 * r.length) / (Math.log(t.length) / Math.log(2))),
    i = Array(a);
  for (n = 0; n < a; n++) {
    for (f = Array(), m = 0, d = 0; d < e.length; d++)
      (m = (m << 16) + e[d]),
        (_ = Math.floor(m / h)),
        (m -= _ * h),
        (f.length > 0 || _ > 0) && (f[f.length] = _);
    (i[n] = m), (e = f);
  }
  var o = "";
  for (d = i.length - 1; d >= 0; d--) o += t.charAt(i[d]);
  return o;
}
function str2rstr_utf8(r) {
  for (var t, d, n = "", _ = -1; ++_ < r.length;)
    (t = r.charCodeAt(_)),
      (d = _ + 1 < r.length ? r.charCodeAt(_ + 1) : 0),
      55296 <= t &&
      t <= 56319 &&
      56320 <= d &&
      d <= 57343 &&
      ((t = 65536 + ((1023 & t) << 10) + (1023 & d)), _++),
      t <= 127
        ? (n += String.fromCharCode(t))
        : t <= 2047
          ? (n += String.fromCharCode(192 | ((t >>> 6) & 31), 128 | (63 & t)))
          : t <= 65535
            ? (n += String.fromCharCode(
              224 | ((t >>> 12) & 15),
              128 | ((t >>> 6) & 63),
              128 | (63 & t)
            ))
            : t <= 2097151 &&
            (n += String.fromCharCode(
              240 | ((t >>> 18) & 7),
              128 | ((t >>> 12) & 63),
              128 | ((t >>> 6) & 63),
              128 | (63 & t)
            ));
  return n;
}
function str2rstr_utf16le(r) {
  for (var t = "", d = 0; d < r.length; d++)
    t += String.fromCharCode(
      255 & r.charCodeAt(d),
      (r.charCodeAt(d) >>> 8) & 255
    );
  return t;
}
function str2rstr_utf16be(r) {
  for (var t = "", d = 0; d < r.length; d++)
    t += String.fromCharCode(
      (r.charCodeAt(d) >>> 8) & 255,
      255 & r.charCodeAt(d)
    );
  return t;
}
function rstr2binl(r) {
  for (var t = Array(r.length >> 2), d = 0; d < t.length; d++) t[d] = 0;
  for (d = 0; d < 8 * r.length; d += 8)
    t[d >> 5] |= (255 & r.charCodeAt(d / 8)) << d % 32;
  return t;
}
function binl2rstr(r) {
  for (var t = "", d = 0; d < 32 * r.length; d += 8)
    t += String.fromCharCode((r[d >> 5] >>> d % 32) & 255);
  return t;
}
function binl_md5(r, t) {
  (r[t >> 5] |= 128 << t % 32), (r[14 + (((t + 64) >>> 9) << 4)] = t);
  for (
    var d = 1732584193, n = -271733879, _ = -1732584194, m = 271733878, f = 0;
    f < r.length;
    f += 16
  ) {
    var h = d,
      e = n,
      a = _,
      i = m;
    (d = md5_ff(d, n, _, m, r[f + 0], 7, -680876936)),
      (m = md5_ff(m, d, n, _, r[f + 1], 12, -389564586)),
      (_ = md5_ff(_, m, d, n, r[f + 2], 17, 606105819)),
      (n = md5_ff(n, _, m, d, r[f + 3], 22, -1044525330)),
      (d = md5_ff(d, n, _, m, r[f + 4], 7, -176418897)),
      (m = md5_ff(m, d, n, _, r[f + 5], 12, 1200080426)),
      (_ = md5_ff(_, m, d, n, r[f + 6], 17, -1473231341)),
      (n = md5_ff(n, _, m, d, r[f + 7], 22, -45705983)),
      (d = md5_ff(d, n, _, m, r[f + 8], 7, 1770035416)),
      (m = md5_ff(m, d, n, _, r[f + 9], 12, -1958414417)),
      (_ = md5_ff(_, m, d, n, r[f + 10], 17, -42063)),
      (n = md5_ff(n, _, m, d, r[f + 11], 22, -1990404162)),
      (d = md5_ff(d, n, _, m, r[f + 12], 7, 1804603682)),
      (m = md5_ff(m, d, n, _, r[f + 13], 12, -40341101)),
      (_ = md5_ff(_, m, d, n, r[f + 14], 17, -1502002290)),
      (n = md5_ff(n, _, m, d, r[f + 15], 22, 1236535329)),
      (d = md5_gg(d, n, _, m, r[f + 1], 5, -165796510)),
      (m = md5_gg(m, d, n, _, r[f + 6], 9, -1069501632)),
      (_ = md5_gg(_, m, d, n, r[f + 11], 14, 643717713)),
      (n = md5_gg(n, _, m, d, r[f + 0], 20, -373897302)),
      (d = md5_gg(d, n, _, m, r[f + 5], 5, -701558691)),
      (m = md5_gg(m, d, n, _, r[f + 10], 9, 38016083)),
      (_ = md5_gg(_, m, d, n, r[f + 15], 14, -660478335)),
      (n = md5_gg(n, _, m, d, r[f + 4], 20, -405537848)),
      (d = md5_gg(d, n, _, m, r[f + 9], 5, 568446438)),
      (m = md5_gg(m, d, n, _, r[f + 14], 9, -1019803690)),
      (_ = md5_gg(_, m, d, n, r[f + 3], 14, -187363961)),
      (n = md5_gg(n, _, m, d, r[f + 8], 20, 1163531501)),
      (d = md5_gg(d, n, _, m, r[f + 13], 5, -1444681467)),
      (m = md5_gg(m, d, n, _, r[f + 2], 9, -51403784)),
      (_ = md5_gg(_, m, d, n, r[f + 7], 14, 1735328473)),
      (n = md5_gg(n, _, m, d, r[f + 12], 20, -1926607734)),
      (d = md5_hh(d, n, _, m, r[f + 5], 4, -378558)),
      (m = md5_hh(m, d, n, _, r[f + 8], 11, -2022574463)),
      (_ = md5_hh(_, m, d, n, r[f + 11], 16, 1839030562)),
      (n = md5_hh(n, _, m, d, r[f + 14], 23, -35309556)),
      (d = md5_hh(d, n, _, m, r[f + 1], 4, -1530992060)),
      (m = md5_hh(m, d, n, _, r[f + 4], 11, 1272893353)),
      (_ = md5_hh(_, m, d, n, r[f + 7], 16, -155497632)),
      (n = md5_hh(n, _, m, d, r[f + 10], 23, -1094730640)),
      (d = md5_hh(d, n, _, m, r[f + 13], 4, 681279174)),
      (m = md5_hh(m, d, n, _, r[f + 0], 11, -358537222)),
      (_ = md5_hh(_, m, d, n, r[f + 3], 16, -722521979)),
      (n = md5_hh(n, _, m, d, r[f + 6], 23, 76029189)),
      (d = md5_hh(d, n, _, m, r[f + 9], 4, -640364487)),
      (m = md5_hh(m, d, n, _, r[f + 12], 11, -421815835)),
      (_ = md5_hh(_, m, d, n, r[f + 15], 16, 530742520)),
      (n = md5_hh(n, _, m, d, r[f + 2], 23, -995338651)),
      (d = md5_ii(d, n, _, m, r[f + 0], 6, -198630844)),
      (m = md5_ii(m, d, n, _, r[f + 7], 10, 1126891415)),
      (_ = md5_ii(_, m, d, n, r[f + 14], 15, -1416354905)),
      (n = md5_ii(n, _, m, d, r[f + 5], 21, -57434055)),
      (d = md5_ii(d, n, _, m, r[f + 12], 6, 1700485571)),
      (m = md5_ii(m, d, n, _, r[f + 3], 10, -1894986606)),
      (_ = md5_ii(_, m, d, n, r[f + 10], 15, -1051523)),
      (n = md5_ii(n, _, m, d, r[f + 1], 21, -2054922799)),
      (d = md5_ii(d, n, _, m, r[f + 8], 6, 1873313359)),
      (m = md5_ii(m, d, n, _, r[f + 15], 10, -30611744)),
      (_ = md5_ii(_, m, d, n, r[f + 6], 15, -1560198380)),
      (n = md5_ii(n, _, m, d, r[f + 13], 21, 1309151649)),
      (d = md5_ii(d, n, _, m, r[f + 4], 6, -145523070)),
      (m = md5_ii(m, d, n, _, r[f + 11], 10, -1120210379)),
      (_ = md5_ii(_, m, d, n, r[f + 2], 15, 718787259)),
      (n = md5_ii(n, _, m, d, r[f + 9], 21, -343485551)),
      (d = safe_add(d, h)),
      (n = safe_add(n, e)),
      (_ = safe_add(_, a)),
      (m = safe_add(m, i));
  }
  return Array(d, n, _, m);
}
function md5_cmn(r, t, d, n, _, m) {
  return safe_add(bit_rol(safe_add(safe_add(t, r), safe_add(n, m)), _), d);
}
function md5_ff(r, t, d, n, _, m, f) {
  return md5_cmn((t & d) | (~t & n), r, t, _, m, f);
}
function md5_gg(r, t, d, n, _, m, f) {
  return md5_cmn((t & n) | (d & ~n), r, t, _, m, f);
}
function md5_hh(r, t, d, n, _, m, f) {
  return md5_cmn(t ^ d ^ n, r, t, _, m, f);
}
function md5_ii(r, t, d, n, _, m, f) {
  return md5_cmn(d ^ (t | ~n), r, t, _, m, f);
}
function safe_add(r, t) {
  var d = (65535 & r) + (65535 & t),
    n = (r >> 16) + (t >> 16) + (d >> 16);
  return (n << 16) | (65535 & d);
}
function bit_rol(r, t) {
  return (r << t) | (r >>> (32 - t));
}
var hexcase = 0,
  b64pad = "";
