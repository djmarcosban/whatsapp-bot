import fetch from 'node-fetch';
import {setTimeout} from 'timers/promises';

class Historic {
  async update(message_id: number, event_id: number, phone: string){
    const url = process.env.LARAVEL_URL + '/historico/atualizar?message_id=' + message_id + '&event_id=' + event_id + '&phone=' + phone

    try {
      const response = await fetch(url)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log(error))
        .finally(() => {})
    } catch (err) {
      console.log(err);
    }
  }
}

export default Historic