import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';
import { create, Whatsapp } from 'venom-bot';
import Historic from './utils';

const historic = new Historic();

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
  private statusSession: any
  private qr: QRCode

  get isConnected(): any {
    return this.connected
  }

  get getStatusSession(): any {
    return this.statusSession
  }

  get qrCode(): QRCode {
    return this.qr
  }

  constructor(){
    this.initialize('test')
  }

  async sendMessage(numbers: Array<N>, message: string, image: string, message_id: number, event_id: number, skip_historic: boolean) {
    if(!isValidPhoneNumber){
      throw new Error("this numbers is invalid")
    }

    // return {
    //   erro: false
    // }

    const uniqueNumbers = numbers.filter((obj, index) => numbers.findIndex((item) => item.number === obj.number) === index);  

    try {
      for (const visitor of uniqueNumbers) {
        let newNumber = this.formatNumber(visitor.number)
        let newMessage = message.replace("{nome}", visitor.name)

        await this.client
          .checkNumberStatus(newNumber)
          .then(() => {
            
            if(image && image.length > 0){
              this.client.sendImageFromBase64(newNumber, image, "flyer", newMessage)
            }else{
              this.client.sendText(newNumber, newMessage)
            }

            console.log('Sent to ' + visitor.number)

            if(skip_historic == false){
              historic.update(message_id, event_id, visitor.number)
            }
          })
          .catch((error) => {
            console.error(visitor.number + ' - ' + error.text);
          }
        );

        await this.delay(1000)
      }

      return {
        erro: false
      }

    } catch (error) {
      return error
    }
  }

  async getPicture(number: string) {
    try {
      let newNumber = this.formatNumber(number)
      let result = await this.client.getProfilePicFromServer(newNumber);

      return result

    } catch (error) {
      return error
    }
  }

  async getAllMessagesInChat(number: string) {
    try {
      let newNumber = this.formatNumber(number)

      const numberExists = await this.client.checkNumberStatus(newNumber)

      if(numberExists.numberExists){
        const messages = await this.client.loadAndGetAllMessagesInChat(newNumber, true, true);
        console.log(messages)
        return messages
      }

      return 'nada';

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
      this.statusSession = statusSession;
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