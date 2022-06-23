export type Status = 'ERROR' | 'OK'
export type ResponseSMS = {
  responseStatus: Status
  smsStatus: Status | null
  smsId: string | null
}

export type ResponseFlashCall = {
  responseStatus: Status
  code: string | null
}

export interface IPhoneAuth {
  sendAuthCode(phone: string, message: string, userIp: string): Promise<ResponseSMS>
  flashCall(phone: string, userIp: string): Promise<ResponseFlashCall>
}

export default class PhoneAuth implements IPhoneAuth{
  private readonly apiId: string;
  constructor(apiId: string) {
    this.apiId = apiId
  }

  async sendAuthCode(
    phone: string,
    message: string,
    userIp?: string): Promise<ResponseSMS> {
    const path =
      `https://sms.ru/sms/send` +
      `?api_id=${this.apiId}` +
      `&to=${phone.trim()}` +
      `&msg=${encodeURI(message.trim())}` +
      `&json=1` +
      `&ip=${userIp}` + // Защита от спама по ip
      `&test=1`;        // Убрать на prod (Не отправляет смс, только возвращает статус запроса)


    let res = await fetch(encodeURI(path), {
      method: 'post'
    }).then(res => res.json());

    const isOk = 'sms' in res;
    if (!isOk) return this.resSms();

    const responseStatus = res['status'];
    const number: string = Object.keys(res['sms'])[0];
    const smsStatus = res['sms'][number]['status'];

    if (smsStatus === 'ERROR') return this
      .resSms(smsStatus, null, responseStatus);


    const smsID = res['sms'][number]['sms_id'];
    return this.resSms(smsStatus, smsID, responseStatus);
  }
  private resSms(smsStatus=null, smsId=null, responseStatus: Status='ERROR' as const): ResponseSMS {
    return {responseStatus, smsStatus, smsId}
  }

  async flashCall(
    phone: string,
    userIp: string
  ): Promise<ResponseFlashCall>{
    const path =
      `https://sms.ru/code/call` +
      `?phone=${phone}` +
      `&ip=${userIp}` + // Защита от спама по ip
      `&api_id=${this.apiId}`
    let res = await fetch(encodeURI(path), {
      method: "post"
    }).then(res => res.json())

    const {code} = res
    return !code
      ? this.resFlashCall()
      : this.resFlashCall("OK", code);
  }

  private resFlashCall(responseStatus: Status='ERROR', code=null): ResponseFlashCall {
    return {responseStatus, code}
  }
}