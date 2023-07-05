import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';
import { create, Whatsapp } from 'venom-bot';

export type QRCode = {
  base64Qr: string
}

class Sender {
  private client: Whatsapp
  private connected: boolean
  private qr: QRCode

  get isConnected(): boolean {
    return this.connected
  }

  get qrCode(): QRCode {
    return this.qr
  }

  constructor(){
    this.initialize('test')
  }

  async sendText(to: string, body: string) {
    if(!isValidPhoneNumber){
      throw new Error("this number is invalid")
    }

    try {
      let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164").replace("+", "") as string
      phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

      await this.client.sendText(phoneNumber, body)

      return {
        erro: false
      }

    } catch (error) {
      return error
    }
  }

  private initialize(nameSession: string) {
    const qr = (base64Qr: string) => {
      this.qr = { base64Qr }
    }

    const status = (statusSession: string) => {
      this.connected = [
        "successChat",
        "isLogged",
        "qrReadSuccess",
        "chatAvaiable",
        "Authenticated"
      ].includes(statusSession)
    }

    const start = (client: Whatsapp) => {
      this.client = client
    }

    create(
      { session: nameSession } as any,
      qr,
      status,
      {
        folderNameToken: 'tokens',
        mkdirFolderToken: '',
        headless: 'new',
        devtools: false,
        debug: false,
        logQR: true,
        browserWS: '',
        browserArgs: [''],
        addBrowserArgs: [''],
        puppeteerOptions: {},
        disableSpins: true,
        disableWelcome: true,
        updatesLog: true,
        autoClose: 0,
        createPathFileToken: false,
        addProxy: [''],
        userProxy: '',
        userPass: ''
      },
      undefined
    )
    .then((client) => {
      start(client);
    })
    .catch((erro) => {
      console.log(erro);
    });
  }
}

export default Sender;