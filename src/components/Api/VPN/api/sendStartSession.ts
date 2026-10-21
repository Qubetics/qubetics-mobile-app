import { IP_V4_REGEX } from "../../../../Constants";

export const sendStartSession = async ({
  url,
  pubKey,
  sessionId,
  signatureBase64,
  public_key,
}: {url: any; pubKey: any; sessionId: any; signatureBase64: any; public_key: any}) => {
  const sessionData = {public_key};
  const jsonData = JSON.stringify(sessionData);
  const dataBase64 = Buffer.from(jsonData).toString('base64');

  const payload = {
    id: parseInt(sessionId),
    pub_key: `ethsecp256k1:${pubKey}`,
    data: dataBase64,
    signature: signatureBase64,
  };

  const getHostname = (urlStr: any) => {
    try {
      const u = urlStr.startsWith('http') ? urlStr : `http://${urlStr}`;
      return new URL(u).hostname;
    } catch {
      return '';
    }
  };
  const isIPv4 = (host: any) => IP_V4_REGEX.test(host);
  const isIPv6 = (host: any) => host.includes(':');
  const isIPBasedUrl = (urlStr: any) => {
    const host = getHostname(urlStr);
    return host ? isIPv4(host) || isIPv6(host) : false;
  };

  const cleanUrl = isIPBasedUrl(url)
    ? url.replace(/^https?:\/\//, 'http://')
    : url;

  try {
    const response = await fetch(`${cleanUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const jsonResponse = JSON.parse(responseText); // ✅ Parse here

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    return jsonResponse;
  } catch (error) {
    console.error('sendStartSession ERROR--->>>', error);
    return null;
  }
};
