// Home Assistant client. Uses the same shopping_list service as the recept app.
const { request } = require('./http');

class HomeAssistant {
  constructor({ baseUrl, token }) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async addItem(name) {
    if (!this.baseUrl || !this.token) {
      throw new Error('Home Assistant is not configured (HA_BASE_URL / HA_TOKEN)');
    }
    const resp = await request(`${this.baseUrl}/api/services/shopping_list/add_item`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (resp.status < 200 || resp.status >= 300) {
      throw new Error(`HA API error ${resp.status}: ${resp.text}`);
    }
  }
}

module.exports = HomeAssistant;
