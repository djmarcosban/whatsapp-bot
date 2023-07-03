class Auth {
  async validate(authorization: string | undefined){
    if(!authorization || authorization === undefined){
      return false
    }

    
    const encoded = authorization.substring(6)
    const decoded = Buffer.from(encoded, 'base64').toString('ascii')
    const [user, pass] = decoded.split(':')
    
    if(user === process.env.AUTH_USER && pass === process.env.AUTH_PASS){
      return true
    }

    return false
  }
}

export default Auth