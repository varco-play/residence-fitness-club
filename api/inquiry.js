const SERVICES = new Set(['', 'membership', 'personal', 'group', 'pool', 'tour', 'other']);

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character]);
}

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Telegram environment variables are not configured');
    return response.status(503).json({ error: 'Service unavailable' });
  }

  const body = request.body || {};
  if (clean(body.website, 200)) {
    return response.status(200).json({ ok: true });
  }

  const name = clean(body.name, 100);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 254);
  const service = clean(body.service, 30);
  const serviceText = clean(body.serviceText, 100) || 'Не указана';
  const message = clean(body.message, 1500);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneIsValid = /^[+()\d\s-]{7,30}$/.test(phone);
  if (name.length < 2 || !phoneIsValid || !emailIsValid || !SERVICES.has(service)) {
    return response.status(400).json({ error: 'Invalid form data' });
  }

  const submittedAt = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tashkent'
  }).format(new Date());

  const lines = [
    '🏋️ <b>НОВАЯ ЗАЯВКА</b>',
    '<b>Residence Fitness Club</b>',
    '',
    `👤 <b>Клиент:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    `✉️ <b>Email:</b> ${escapeHtml(email)}`,
    `🎯 <b>Услуга:</b> ${escapeHtml(serviceText)}`,
    ...(message ? ['', '💬 <b>Сообщение:</b>', escapeHtml(message)] : []),
    '',
    `🕒 <i>${escapeHtml(submittedAt)} (Ташкент)</i>`
  ];

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!telegramResponse.ok) {
      const telegramError = await telegramResponse.text();
      console.error('Telegram API error:', telegramResponse.status, telegramError.slice(0, 300));
      return response.status(502).json({ error: 'Message delivery failed' });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Inquiry delivery error:', error instanceof Error ? error.message : error);
    return response.status(502).json({ error: 'Message delivery failed' });
  }
};
