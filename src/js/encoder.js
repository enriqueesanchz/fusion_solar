const rs = require('jsrsasign');
const https = require('https');

async function getPublicKey() {
  return new Promise((resolve, reject) => {
    https.get('https://eu5.fusionsolar.huawei.com/unisso/pubkey', res => {
      let data = [];

      res.on('data', chunk => {
        data.push(chunk);
      });

      res.on('end', () => {
        const pubkey = JSON.parse(Buffer.concat(data).toString());
        resolve(pubkey);
      });
    }).on('error', err => {
      reject(err);
    });
  });
}

async function encodeData(username, password) {
    const result = await getPublicKey();
    var pubKey = rs.KEYUTIL.getKey(result.pubKey);
    var valueEncode = encodeURIComponent(password);
    
    var encryptValue = "";
    for (var i = 0; i < valueEncode.length / 270; i++) {
        var currntValue = valueEncode.substring(i * 270, (i + 1) * 270);
        //var currntValue = valueEncode.substr(i * 270, 270)
        var encryptValueCurrent = rs.crypto.Cipher.encrypt(currntValue, pubKey, "RSAOAEP384");
        encryptValue = encryptValue == "" ? "" : encryptValue + "00000001";
        encryptValue = encryptValue + Buffer.from(encryptValueCurrent, 'hex').toString('base64');
    }

    var data = {"username": username};
    data.password = encryptValue + result.version;
    var loginUserInfo = JSON.stringify(data);
    return loginUserInfo;
}

async function main() {
    const encoded = await encodeData(process.env.USER_NAME, process.env.PASSWORD)
    console.log(encoded)
}

if (require.main === module) {
  main()
}
