import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';
import { create, Whatsapp } from 'venom-bot';

export type QRCode = {
  base64Qr: string
}

export type N = {
  name: string
  number: string
}

class Sender {
  private client: Whatsapp
  private connected: any
  private qr: QRCode

  get isConnected(): any {
    return this.connected
  }

  get qrCode(): QRCode {
    return this.qr
  }

  constructor(){
    this.initialize('test')
  }

  async sendText(numbers: Array<N>, message: string) {
    if(!isValidPhoneNumber){
      throw new Error("this numbers is invalid")
    }

    const uniqueNumbers = numbers.filter(
      (obj, index) =>
      numbers.findIndex((item) => item.number === obj.number) === index
    );

    try {
      for (const visitor of uniqueNumbers) {
        let newMessage = `Olá ${visitor.name}, tudo bem?! ${message}`
        let newNumber = this.formatNumber(visitor.number)
        await this.client.sendText(newNumber, newMessage)
        console.log(newNumber)
        await this.delay(650)
      }

      return {
        erro: false
      }

    } catch (error) {
      return error
    }
  }

  private delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 

  private formatNumber(number: string){
    let newNumber = parsePhoneNumber(number, "BR")?.format("E.164").replace("+", "") as string
    return newNumber.includes("@c.us") ? newNumber : `${newNumber}@c.us`
  }

  private initialize(nameSession: string) {
    const qr = (base64Qr: string) => {
      this.qr = { base64Qr }
    }

    const status = (statusSession: string) => {
      // this.connected = statusSession;
      this.connected = [
        "successChat",
        "isLogged",
        "qrReadSuccess",
        "deviceNotConnected",
        "chatAvaiable",
        "Authenticated"
      ].includes(statusSession)
    }

    const start = (client: Whatsapp) => {
      this.client = client

      client.onStateChange((state) => {
        console.log('State changed: ', state);

        if ('CONFLICT'.includes(state)) client.useHere();

        if ('UNPAIRED'.includes(state)) console.log('logout');
      });

      let time = 0 as any;
      client.onStreamChange((state) => {
        console.log('State Connection Stream: ' + state);
        clearTimeout(time);
        if (state === 'DISCONNECTED' || state === 'SYNCING') {
          time = setTimeout(() => {
            client.close();
          }, 80000);
        }
      });
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