import path from 'path';
import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import Sender from './sender';
import Auth from './auth';
import dotenv from 'dotenv';
import timeout from 'connect-timeout';

dotenv.config();

export type SenderStatus = {
  code: number,
  status: string,
  message: string
}

const sender = new Sender();
const auth = new Auth();
const app: Express = express();
const router: express.Router = express.Router();

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: false, parameterLimit: 50000 }));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(cors({
  origin: '*', 
  optionsSuccessStatus: 200, 
  methods: ["GET", "PUT", "POST", "DELETE"] 
}));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-XSRF-Token, Origin');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

if (app.get('env') === 'development') {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err,
    });
  });
}

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {},
  });
});


app.get(`/`, async (req: Request, res: Response) => {
  const validated = await auth.validate(req.headers.authorization)
  if(!validated){
    return res.status(403).send({
      status: "Forbidden",
      message: "Credentials wrong"
    })
  }

  try{
    return res.sendStatus(200)
  } catch( error ){
    return res.status(403).send({status: "error", message: error})
  }
})


app.get('/status', async (req: Request, res: Response) => {
  const validated = await auth.validate(req.headers.authorization)
  if(!validated){
    return res.status(403).send({
      status: "Forbidden",
      message: "Credentials wrong"
    })
  }

  try{
    return res.send({
      qr: sender.qrCode,
      status: sender.getStatusSession,
      connected: sender.isConnected,
    })
  } catch( error ){
    return res.sendStatus(500).json({
      status: "error",
      message: error
    })
  }
})

function haltOnTimedout (req: Request, res: Response, next: any) {
  if (!req.timedout) next()
}

app.post('/send', timeout('1200s'), haltOnTimedout, async (req: Request, res: Response, next: any) => {
  const validated = await auth.validate(req.headers.authorization)

  if(!validated){
    return res.status(403).send({
      status: "Forbidden",
      message: "Credentials wrong"
    })
  }

  let status = {} as SenderStatus

  const { 
    numbers,
    message,
    image,
    message_id,
    event_id
  } = req.body

  try{
    const send = await sender.sendMessage(numbers, message, image, message_id, event_id) as any

    if(!send.erro){
      status = {
        code: 200,
        status: "success",
        message: "Mensagens enviadas com sucesso"
      }
    }else{
      status = {
        code: send.status,
        status: "error",
        message: send.text
      }
    }
    
    if (status.status === "error") return next(status)
    if (req.timedout) return

    return res.status(status.code).send({
      status: status.status,
      message: status
    })
  } catch( error ){
    console.log(error)
    return res.status(500).send({
      status: "error from try into app",
      message: error
    })

  }
})

app.post('/photo', async (req: Request, res: Response) => {
  const validated = await auth.validate(req.headers.authorization)
  if(!validated){
    return res.status(403).send({
      status: "Forbidden",
      message: "Credentials wrong"
    })
  }

  const { number } = req.body
  
  try{
    const result = await sender.getPicture(number) as any
    return res.send({
      url: result
    })
  } catch( error ){
    return res.sendStatus(500).json({
      status: "error",
      message: error
    })
  } 
})

app.use(router);

const HOST_NAME = process.env.HOST_NAME || 'localhost';
const HOST_NAME_PORT = process.env.HOST_NAME_PORT || 3000;

app.listen(HOST_NAME_PORT, () => {
  console.log(`Servidor Rodando ${HOST_NAME}:${HOST_NAME_PORT}`);
});
